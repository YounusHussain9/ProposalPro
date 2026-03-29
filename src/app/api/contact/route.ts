import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.name || !body?.email || !body?.message) {
      return NextResponse.json({ error: "name, email and message are required" }, { status: 400 });
    }
    const { name, email, subject, message } = body;
    await sendNotification(
      `📬 New Contact Message — ${subject || "General enquiry"}`,
      `From: ${name} (${email})\nSubject: ${subject || "General enquiry"}\n\n${message}`
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/contact:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
