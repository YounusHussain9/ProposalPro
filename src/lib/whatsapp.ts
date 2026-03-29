const OWNER_PHONE = "923131805259";

export async function notifyWhatsApp(message: string): Promise<void> {
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!apiKey) return; // silently skip if not configured
  const url = `https://api.callmebot.com/whatsapp.php?phone=${OWNER_PHONE}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  try {
    await fetch(url);
  } catch {
    // fire-and-forget — never block the main request
  }
}
