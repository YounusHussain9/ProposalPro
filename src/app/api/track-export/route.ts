import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/email";
import { FREE_EXPORT_LIMIT } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const proposalTitle = body.title || "Untitled";

    const svc = await createServiceClient();

    // Fetch current export count and plan
    const { data: profile, error: profileError } = await svc
      .from("profiles")
      .select("exports_used, exports_limit, plan")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[track-export] Profile fetch error:", profileError?.message);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const limit = profile.plan === "pro"
      ? (profile.exports_limit ?? FREE_EXPORT_LIMIT)
      : FREE_EXPORT_LIMIT;
    const used = profile.exports_used ?? 0;

    if (used >= limit) {
      return NextResponse.json({ error: "Export limit reached", limit, used }, { status: 403 });
    }

    // Increment export count
    const { error: updateError } = await svc
      .from("profiles")
      .update({ exports_used: used + 1 })
      .eq("id", user.id);

    if (updateError) {
      console.error("[track-export] Update error:", updateError.message);
      return NextResponse.json({ error: "Failed to track export" }, { status: 500 });
    }

    // Notify owner (fire-and-forget, don't block response)
    sendNotification("📄 PDF Downloaded — ProposalPro", `User: ${user.email}\nProposal: "${proposalTitle}"`).catch(() => {});

    return NextResponse.json({ success: true, used: used + 1, limit });
  } catch (err) {
    console.error("[track-export] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
