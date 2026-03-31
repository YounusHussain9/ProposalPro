// ─── Plan limits ─────────────────────────────────────────────────────────────
export const FREE_EXPORT_LIMIT = 3;
export const PRO_EXPORT_LIMIT = 999; // effectively unlimited
export const DEFAULT_PLAN = "free" as const;

// ─── Stripe ───────────────────────────────────────────────────────────────────
export const STRIPE_API_VERSION = "2025-02-24.acacia" as const;
export const STRIPE_SESSION_FETCH_LIMIT = 10; // max sessions to check in verify-payment

// ─── Proposals ───────────────────────────────────────────────────────────────
export const PROPOSAL_VALIDITY_DAYS = 30;
export const PROPOSAL_TITLE_MAX_LENGTH = 200;
export const PROPOSAL_CONTENT_MAX_BYTES = 512_000; // 512 KB

// ─── Custom templates ────────────────────────────────────────────────────────
export const DEFAULT_TEMPLATE_ICON = "📄";
export const DEFAULT_TEMPLATE_COLOR = "from-gray-500 to-gray-700";
export const MAX_TEMPLATE_FIELDS = 20;
export const TEMPLATE_NAME_MAX_LENGTH = 100;

// ─── Email ───────────────────────────────────────────────────────────────────
export const EMAIL_MAX_WIDTH = 520; // px, used in HTML email template
export const EMAIL_ACCENT_COLORS: Record<string, string> = {
  "💰": "#16a34a", // green  – payments
  "📄": "#2563eb", // blue   – proposals
  "📋": "#d97706", // amber  – templates
  "📬": "#7c3aed", // purple – contact
};
export const EMAIL_ACCENT_DEFAULT = "#4f46e5"; // indigo fallback

// ─── URLs ────────────────────────────────────────────────────────────────────
export const LOCALHOST_URL = "http://localhost:3000";
