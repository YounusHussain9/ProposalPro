import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase-server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ error: "Missing metadata" }, { status: 400 });

    const supabase = await createServiceClient();
    await supabase.from("payments").update({ status: "paid" }).eq("stripe_session_id", session.id);
    await supabase.from("profiles").update({ plan: "pro", exports_limit: 999 }).eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
