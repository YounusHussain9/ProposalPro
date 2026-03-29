import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { notifyWhatsApp } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const proposalTitle = body.title || "Untitled";

    const svc = await createServiceClient();
    await svc.from("profiles")
      .update({ exports_used: (await svc.from("profiles").select("exports_used").eq("id", user.id).single().then(r => (r.data?.exports_used ?? 0) + 1)) })
      .eq("id", user.id);

    await notifyWhatsApp(`📄 PDF Downloaded\n\nUser: ${user.email}\nProposal: "${proposalTitle}"`);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/track-export:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
