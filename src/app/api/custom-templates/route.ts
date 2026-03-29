import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("custom_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates: data ?? [] });
  } catch (e) {
    console.error("GET /api/custom-templates:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body?.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!body?.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json({ error: "At least one field is required" }, { status: 400 });
    }

    const svc = await createServiceClient();
    const { data: template, error } = await svc
      .from("custom_templates")
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description ?? "",
        icon: body.icon ?? "📄",
        color: body.color ?? "from-gray-500 to-gray-700",
        fields: body.fields,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template });
  } catch (e) {
    console.error("POST /api/custom-templates:", e);
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
      .from("custom_templates")
      .delete()
      .eq("id", body.id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/custom-templates:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
