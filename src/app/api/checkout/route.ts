import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { PLANS } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body?.planId) return NextResponse.json({ error: "planId is required" }, { status: 400 });

    const plan = PLANS[body.planId as keyof typeof PLANS];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const svc = await createServiceClient();
    const { data: profile } = await svc.from("profiles").select("stripe_customer_id, email, plan").eq("id", user.id).single();

    if (profile?.plan === "pro") {
      return NextResponse.json({ error: "You are already on Pro" }, { status: 400 });
    }

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await svc.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `ProposalPro ${plan.name}` },
          unit_amount: plan.priceInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { user_id: user.id, plan_id: plan.id },
    });

    await svc.from("payments").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: plan.priceInCents,
      plan: plan.id,
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("POST /api/checkout:", e);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
