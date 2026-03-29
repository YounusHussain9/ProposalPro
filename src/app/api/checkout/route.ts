import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase-server";
import { PLANS } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await request.json();
  const plan = PLANS[planId as keyof typeof PLANS];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id, email").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile?.email || user.email, metadata: { supabase_user_id: user.id } });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price_data: { currency: "usd", product_data: { name: `ProposalPro ${plan.name}` }, unit_amount: plan.priceInCents }, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
    metadata: { user_id: user.id, plan_id: plan.id },
  });

  await supabase.from("payments").insert({ user_id: user.id, stripe_session_id: session.id, amount: plan.priceInCents, plan: plan.id, status: "pending" });
  return NextResponse.json({ url: session.url });
}
