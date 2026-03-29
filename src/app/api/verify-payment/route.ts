import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = await createServiceClient();

    // Ensure profile row exists
    await svc.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? null,
    }, { onConflict: "id", ignoreDuplicates: true });

    let verified = false;

    // 1. Check DB for any payment record
    const { data: payment } = await svc
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (payment) {
      if (payment.status === "paid") {
        verified = true;
      } else if (payment.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
        if (session.payment_status === "paid") {
          await svc.from("payments").update({ status: "paid" }).eq("id", payment.id);
          verified = true;
        }
      }
    }

    // 2. Fallback: look up by stripe_customer_id
    if (!verified) {
      const { data: profile } = await svc.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
      if (profile?.stripe_customer_id) {
        const sessions = await stripe.checkout.sessions.list({ customer: profile.stripe_customer_id, limit: 10 });
        const paid = sessions.data.find(s => s.payment_status === "paid");
        if (paid) {
          await svc.from("payments").upsert({
            user_id: user.id,
            stripe_session_id: paid.id,
            amount: paid.amount_total ?? 0,
            plan: (paid.metadata?.plan_id as string) ?? "pro_lifetime",
            status: "paid",
          }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
          verified = true;
        }
      }
    }

    // 3. Fallback: search all Stripe sessions by user email
    if (!verified && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });
      for (const customer of customers.data) {
        const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 10 });
        const paid = sessions.data.find(s => s.payment_status === "paid");
        if (paid) {
          // Link customer to profile
          await svc.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", user.id);
          await svc.from("payments").upsert({
            user_id: user.id,
            stripe_session_id: paid.id,
            amount: paid.amount_total ?? 0,
            plan: (paid.metadata?.plan_id as string) ?? "pro_lifetime",
            status: "paid",
          }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return NextResponse.json({ upgraded: false, error: "No completed Stripe payment found for your account." });
    }

    await svc.from("profiles").update({ plan: "pro", exports_limit: 999 }).eq("id", user.id);
    return NextResponse.json({ upgraded: true });
  } catch (e) {
    console.error("POST /api/verify-payment:", e);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
