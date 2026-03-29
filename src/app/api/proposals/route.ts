import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { getTemplateById } from "@/lib/templates";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ proposals: data ?? [] });
  } catch (e) {
    console.error("GET /api/proposals:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body?.templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });

    const template = getTemplateById(body.templateId);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    if (template.isPremium) {
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (profile?.plan !== "pro") {
        return NextResponse.json({ error: "Premium template requires Pro plan", requiresUpgrade: true }, { status: 402 });
      }
    }

    const svc = await createServiceClient();
    const { data: proposal, error } = await svc
      .from("proposals")
      .insert({
        user_id: user.id,
        template_id: body.templateId,
        title: `${template.title} — ${new Date().toLocaleDateString()}`,
        content: template.defaultContent,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ proposal });
  } catch (e) {
    console.error("POST /api/proposals:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { id, title, content, status } = body;
    const { data, error } = await supabase
      .from("proposals")
      .update({ title, content, status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ proposal: data });
  } catch (e) {
    console.error("PATCH /api/proposals:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", body.id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/proposals:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
