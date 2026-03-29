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

export async function sendNotification(subject: string, text: string): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  try {
    await transporter.sendMail({
      from: `"ProposalPro" <${OWNER_EMAIL}>`,
      to: OWNER_EMAIL,
      subject,
      text,
    });
  } catch (e) {
    console.error("[email notify]", e);
  }
}
