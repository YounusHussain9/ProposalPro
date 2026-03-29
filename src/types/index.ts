export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: "free" | "pro";
  exports_used: number;
  exports_limit: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Proposal {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  content: Record<string, string>;
  status: "draft" | "sent" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  isPremium: boolean;
  color: string;      // tailwind gradient class
  icon: string;       // emoji
  fields: TemplateField[];
  defaultContent: Record<string, string>;
}

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  placeholder: string;
}

export const PLANS = {
  pro_monthly: { id: "pro_monthly", name: "Pro Monthly", price: 12, priceInCents: 1200 },
  pro_lifetime: { id: "pro_lifetime", name: "Pro Lifetime", price: 29, priceInCents: 2900 },
} as const;

export const FREE_EXPORT_LIMIT = 3;
