import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/email";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && webhookSecret !== "your_stripe_webhook_secret") {
    // Production: verify signature
    if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // Webhook secret not configured — parse event without verification
    // (plan is also updated directly on dashboard return, so this is a fallback)
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ error: "Missing metadata" }, { status: 400 });

    try {
      const supabase = await createServiceClient();
      await supabase.from("payments").update({ status: "paid" }).eq("stripe_session_id", session.id);
      await supabase.from("profiles").update({ plan: "pro", exports_limit: 999 }).eq("id", userId);
      const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : "";
      await sendNotification("💰 New Purchase — ProposalPro", `Plan: ${session.metadata?.plan_id ?? "pro"}\nAmount: ${amount}\nSession: ${session.id}`);
    } catch (e) {
      console.error("Webhook DB update failed:", e);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
