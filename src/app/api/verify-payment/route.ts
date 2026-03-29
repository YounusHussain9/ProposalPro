import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase-server";

// Called when user returns from Stripe with ?upgrade=success
// Looks up their latest pending payment, verifies with Stripe, and upgrades the profile
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = await createServiceClient();

    // Find most recent pending or paid payment for this user
    const { data: payment } = await svc
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!payment) return NextResponse.json({ error: "No payment found" }, { status: 404 });

    // Already recorded as paid — just make sure profile is updated
    if (payment.status === "paid") {
      await svc.from("profiles").update({ plan: "pro", exports_limit: 999 }).eq("id", user.id);
      return NextResponse.json({ upgraded: true });
    }

    // Verify with Stripe directly
    const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
    if (session.payment_status === "paid") {
      await svc.from("payments").update({ status: "paid" }).eq("id", payment.id);
      await svc.from("profiles").update({ plan: "pro", exports_limit: 999 }).eq("id", user.id);
      return NextResponse.json({ upgraded: true });
    }

    return NextResponse.json({ upgraded: false, status: session.payment_status });
  } catch (e) {
    console.error("POST /api/verify-payment:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
