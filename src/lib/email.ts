import nodemailer from "nodemailer";

const OWNER_EMAIL = process.env.GMAIL_USER!;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function buildHtml(subject: string, rows: { label: string; value: string }[], accentColor = "#4f46e5"): string {
  const rowsHtml = rows
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;white-space:nowrap;width:130px;vertical-align:top;">${label}</td>
        <td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:600;">${value}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${accentColor};padding:28px 32px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:rgba(255,255,255,0.2);border-radius:10px;padding:8px;vertical-align:middle;">
                        <div style="width:28px;height:28px;background:#ffffff;border-radius:6px;display:flex;align-items:center;justify-content:center;">
                          <img src="https://proposalpro-app.netlify.app/favicon.ico" width="20" height="20" alt="" style="display:block;" />
                        </div>
                      </td>
                      <td style="padding-left:10px;vertical-align:middle;">
                        <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">ProposalPro</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:14px;">
                  <span style="color:rgba(255,255,255,0.9);font-size:15px;font-weight:500;">${subject.replace(/^[^\s]+ /, "")}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
              ${rowsHtml}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              This is an automated notification from <strong style="color:${accentColor};">ProposalPro</strong>. Do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Parse plain-text lines like "Key: Value" into row objects */
function parseRows(text: string): { label: string; value: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { label: "Info", value: line };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });
}

/** Pick accent color based on subject emoji/keyword */
function accentFor(subject: string): string {
  if (subject.startsWith("💰")) return "#059669"; // green — purchase
  if (subject.startsWith("📄")) return "#0ea5e9"; // blue — export
  if (subject.startsWith("📋")) return "#f59e0b"; // amber — status change
  if (subject.startsWith("📬")) return "#8b5cf6"; // purple — contact
  return "#4f46e5"; // indigo default
}

export async function sendNotification(subject: string, text: string): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  try {
    const rows = parseRows(text);
    const html = buildHtml(subject, rows, accentFor(subject));
    await transporter.sendMail({
      from: `"ProposalPro" <${OWNER_EMAIL}>`,
      to: OWNER_EMAIL,
      subject,
      text,   // plain-text fallback
      html,
    });
  } catch (e) {
    console.error("[email notify]", e);
  }
}
