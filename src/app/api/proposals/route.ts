import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { getTemplateById } from "@/lib/templates";

export async function GET() {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return NextResponse.json({ proposals: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await request.json();
  const template = getTemplateById(templateId);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // Check if premium template — require pro plan
  if (template.isPremium) {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan !== "pro") {
      return NextResponse.json({ error: "Premium template requires Pro plan", requiresUpgrade: true }, { status: 402 });
    }
  }

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      template_id: templateId,
      title: `${template.title} — ${new Date().toLocaleDateString()}`,
      content: template.defaultContent,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, content, status } = await request.json();

  const { data, error } = await supabase
    .from("proposals")
    .update({ title, content, status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await supabase.from("proposals").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
