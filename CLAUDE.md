# ProposalPro — CLAUDE.md

## Project Overview
ProposalPro is a Next.js 15 SaaS app for creating, editing, and sending professional proposals. Users pick a template, fill in details via a TipTap rich-text editor, and export/share the proposal. It has a free tier and a Pro tier gated by Stripe.

**Live:** https://proposalpro-app.netlify.app
**Repo:** https://github.com/YounusHussain9/ProposalPro
**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 3, Supabase, Stripe, Nodemailer, Groq SDK, next-themes

---

## Commands

```bash
npm run dev       # local dev server (localhost:3000)
npm run build     # production build — always run before committing
npm run lint      # ESLint check
netlify deploy --prod   # deploy to Netlify production
```

Always run `npm run build` and confirm it passes before committing.

---

## Architecture

### Directory Layout
```
src/
  app/               # Next.js App Router pages + API routes
    api/             # Route handlers (checkout, proposals, webhook, etc.)
    auth/            # login, signup, callback pages
    dashboard/       # User dashboard with analytics chart
    editor/          # Proposal editor (TipTap rich text)
    templates/       # Template gallery
    pricing/         # Pricing page
    contact/         # Contact form
  components/        # Shared React components
  lib/               # Utility modules
  types/             # TypeScript type definitions
mcp/                 # MCP stats server (ESM, Node.js)
supabase/
  schema.sql         # Full DB schema (source of truth)
```

### Key Libraries
| Library | Purpose |
|---------|---------|
| `@supabase/supabase-js` + `@supabase/ssr` | Database + auth |
| `@tiptap/*` | Rich-text proposal editor |
| `stripe` | Payments |
| `nodemailer` | Email notifications |
| `groq-sdk` | AI features |
| `next-themes` | Dark mode (`darkMode: "class"`) |
| `@modelcontextprotocol/sdk` | MCP stats server |
| `lucide-react` | Icons |

---

## Supabase

### Tables
- **`profiles`** — One row per auth user. Columns: `id`, `email`, `full_name`, `plan` (free/pro), `exports_used`, `stripe_customer_id`. RLS enabled.
- **`proposals`** — User proposals. Columns: `id`, `user_id` (FK → profiles), `title`, `template_id`, `content` (JSONB), `status` (draft/sent/accepted/declined), `client_email`, `updated_at`. RLS enabled.
- **`payments`** — Stripe payment records. Columns: `user_id`, `stripe_session_id`, `plan`, `amount`, `status` (pending/paid/failed). RLS enabled.
- **`custom_templates`** — User-built templates. Columns: `id`, `user_id`, `name`, `fields` (JSONB), `icon`, `color`. RLS enabled.

### Two Supabase Clients
- **`src/lib/supabase-server.ts`** — Server-side (SSR), respects RLS, uses anon key.
- **`src/lib/supabase-browser.ts`** — Client-side, uses anon key.
- For admin operations (bypassing RLS), use the service role key via `createClient(url, serviceRoleKey)` in server-only code.

### Profile Upsert Pattern
Always include `plan: "free"` when upserting profiles to avoid FK violations from missing defaults:
```ts
await supabase.from("profiles").upsert(
  { id: user.id, email: user.email, full_name: ..., plan: "free" },
  { onConflict: "id" }
);
```
Never use `ignoreDuplicates: true` — it silently swallows errors.

---

## Authentication
- Supabase Auth (email/password)
- Auth pages (`/auth/login`, `/auth/signup`) use a `ready` state guard:
  - On mount, call `getUser()` and redirect to `/dashboard` if already logged in
  - Show an indigo spinner while checking — never render the form before the check resolves
- Callback route: `src/app/auth/callback/route.ts` exchanges the code for a session

---

## Dark Mode
- Implemented with `next-themes` (`attribute="class"`, `defaultTheme="system"`)
- Tailwind `darkMode: "class"` in `tailwind.config.ts`
- `<html suppressHydrationWarning>` in `src/app/layout.tsx` prevents SSR mismatch
- `ThemeToggle` component inside `Navbar.tsx` uses `mounted` state + `useEffect` to defer render
- Print/preview panels intentionally stay white (no `dark:` variants on proposal preview)
- Use `dark:bg-gray-900` / `dark:bg-gray-800` / `dark:text-gray-50` / `dark:border-gray-700` as standard dark equivalents

---

## Stripe
- Secret key: `STRIPE_SECRET_KEY` (server only)
- Publishable key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Webhook secret: `STRIPE_WEBHOOK_SECRET`
- Checkout: `src/app/api/checkout/route.ts`
- Webhook handler: `src/app/api/webhook/route.ts` — updates `profiles.plan` and inserts into `payments`
- Verify payment: `src/app/api/verify-payment/route.ts`

---

## Email
- `src/lib/email.ts` — `sendNotification(subject, text)` sends branded HTML emails
- HTML uses a colored header (accent picked from subject emoji), table rows, and ProposalPro footer
- `parseRows(text)` parses "Key: Value" lines into table rows
- Configure `SMTP_*` env vars (or use Nodemailer transporter of choice)

---

## MCP Stats Server
Local MCP server for querying live ProposalPro stats from Claude Code.

**File:** `mcp/stats-server.js` (ESM, requires `mcp/package.json` with `"type": "module"`)
**Config:** `.claude/settings.json` registers it as `proposalpro-stats`
**Loads:** `.env.local` via `dotenv` — uses service role key to bypass RLS

**Tools:**
| Tool | What it returns |
|------|----------------|
| `get_overview` | Total proposals, users, pro users, exports, revenue |
| `get_template_usage` | Per-template proposal counts, sorted desc |
| `get_recent_signups` | Last 10 signups (email, plan, created_at) |
| `get_proposal_statuses` | Counts by draft/sent/accepted/declined |
| `get_top_users` | Top 5 users by proposal count |

Restart Claude Code after changing `.claude/settings.json` for the server to reload.

---

## Environment Variables

| Variable | Where used |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (admin ops, MCP server) |
| `STRIPE_SECRET_KEY` | Server only |
| `STRIPE_WEBHOOK_SECRET` | Server only (webhook verification) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client |
| `NEXT_PUBLIC_APP_URL` | Redirect URLs |
| `GROQ_API_KEY` | Server only (AI features) |

Copy `.env.example` → `.env.local` and fill in values before running locally.

---

## Deployment
- **Host:** Netlify (auto-deploys from GitHub `main` branch)
- **Plugin:** `@netlify/plugin-nextjs` configured in `netlify.toml`
- **Deploy manually:** `netlify deploy --prod`
- Build output is `.next/` — do not commit it

---

## Coding Conventions
- All pages are server components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- API routes use service role Supabase client for cross-user data access
- Tailwind only — no CSS modules, no inline styles except dynamic values (e.g., `style={{ width: pct% }}`)
- `clsx` for conditional class names
- Icons from `lucide-react`
- No external chart libraries — use pure CSS/Tailwind bar charts

---

## Constants — No Magic Numbers

**All numeric literals and repeated string values must come from `src/lib/constants.ts`.**

```ts
// WRONG
exports_used: 999
validity: 30 * 86400000

// RIGHT
import { PRO_EXPORT_LIMIT, PROPOSAL_VALIDITY_DAYS } from "@/lib/constants";
exports_used: PRO_EXPORT_LIMIT
validity: PROPOSAL_VALIDITY_DAYS * 86_400_000
```

Key constants already defined in `src/lib/constants.ts`:
| Constant | Value | Used in |
|----------|-------|---------|
| `FREE_EXPORT_LIMIT` | 3 | proposals, track-export |
| `PRO_EXPORT_LIMIT` | 999 | webhook, verify-payment |
| `DEFAULT_PLAN` | "free" | profile upserts |
| `STRIPE_API_VERSION` | "2025-02-24.acacia" | stripe.ts |
| `STRIPE_SESSION_FETCH_LIMIT` | 10 | verify-payment |
| `PROPOSAL_VALIDITY_DAYS` | 30 | templates.ts |
| `DEFAULT_TEMPLATE_ICON` | "📄" | custom-templates |
| `DEFAULT_TEMPLATE_COLOR` | "from-gray-500 to-gray-700" | custom-templates |
| `EMAIL_MAX_WIDTH` | 520 | email.ts |
| `EMAIL_ACCENT_COLORS` | emoji→hex map | email.ts |
| `LOCALHOST_URL` | "http://localhost:3000" | checkout fallback |

---

## API Error Handling Pattern

Every API route handler must follow this structure:

```ts
export async function POST(req: Request) {
  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Input validation
    const body = await req.json();
    if (!body.requiredField) {
      return NextResponse.json({ error: "Missing required field" }, { status: 400 });
    }

    // 3. Business logic with explicit error checks
    const { data, error } = await supabase.from("table").insert(payload);
    if (error) {
      console.error("[route-name] DB error:", error.message);
      return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[route-name] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Rules:
- Always log errors server-side with a route prefix: `console.error("[route-name] ...")`
- Never expose raw DB/Stripe error messages to the client
- Always return typed status codes (400 bad input, 401 unauth, 403 forbidden, 404 not found, 500 server)
- Check `error` from every Supabase call — never assume success

---

## API Retry Pattern

For calls to external services (Stripe, Groq, email) that may transiently fail:

```ts
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 500
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * 2 ** i));
    }
  }
  throw new Error("unreachable");
}

// Usage
const session = await withRetry(() =>
  stripe.checkout.sessions.retrieve(sessionId)
);
```

Apply retry to: `stripe.*`, `nodemailer.sendMail()`, `groq.chat.completions.create()`  
Do NOT retry: Supabase reads/writes (idempotency issues), user input validation

---

## Form Rules

### Validation — Non-Negotiable
**No form field marked `required` may be submitted empty.** Enforce this both client-side (HTML `required` + JS check) and server-side (API route validation).

```ts
// Client-side (React)
if (!name.trim()) {
  setError("Name is required");
  return;
}

// Server-side (API route)
const { name, email } = await req.json();
if (!name?.trim() || !email?.trim()) {
  return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
}
```

### Form UX Standards
- Show inline error messages next to the field, not just a generic toast
- Disable submit button while request is in-flight (set loading state)
- On success: show confirmation state or redirect — never leave the form in ambiguous state
- On error: keep all form data intact — never clear the form on failure
- Show a spinner or "Loading..." text on submit button during async operations

### Form-Specific Rules
| Form | Required Fields | On Success | On Error |
|------|----------------|------------|----------|
| Login | email, password | Redirect to `/dashboard` | Inline error, form kept |
| Signup | full_name, email, password | Show success message | Inline error, form kept |
| Contact | name, email, message | Show confirmation, clear form | Inline error, keep data |
| Proposal editor | title, content | Auto-save confirmation | Error toast |
| Custom template builder | name, min 1 field | Appear in gallery | Inline error |

### Auth Forms Special Rule
Login and signup pages must guard with `ready` state:
```tsx
const [ready, setReady] = useState(false);
useEffect(() => {
  createClient().auth.getUser().then(({ data }) => {
    if (data.user) { router.replace("/dashboard"); return; }
    setReady(true);
  });
}, []);
if (!ready) return <Spinner />;
```
Never render the form before the auth check resolves.

---

## Automated Hooks (Claude Code)

Configured in `.claude/settings.json`. Runs automatically:

| Trigger | Hook | Purpose |
|---------|------|---------|
| Before `git commit` | `npm run lint` | Block commit on lint errors |
| Before `git push` | `npm run lint` | Block push on lint errors |

To view/edit hooks: open `/hooks` in Claude Code.
