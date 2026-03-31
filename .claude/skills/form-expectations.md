# Form Expectations Skill

Use this skill when asked to check, review, or test what a form does and whether it meets expectations.

## ProposalPro Forms and Their Contracts

---

### 1. Login Form (`/auth/login`)
**File:** `src/app/auth/login/page.tsx`

**Inputs:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | email | Yes | Valid email format |
| password | password | Yes | Min 6 characters |

**Expected Behavior:**
- Show indigo spinner while auth check resolves (never flash the form first)
- If user already logged in → redirect to `/dashboard` immediately
- On success → redirect to `/dashboard`
- On failure → show inline error message (do not clear the form)
- Submit button shows "Signing in..." during loading

**Test Cases:**
- [ ] Empty email → "Email is required" shown, form not submitted
- [ ] Empty password → "Password is required" shown, form not submitted
- [ ] Invalid email format → validation error shown
- [ ] Wrong credentials → Supabase error shown inline
- [ ] Already logged in → redirected to dashboard without seeing form
- [ ] Network error → error message shown, retry possible

---

### 2. Signup Form (`/auth/signup`)
**File:** `src/app/auth/signup/page.tsx`

**Inputs:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| full_name | text | Yes | Non-empty |
| email | email | Yes | Valid email format |
| password | password | Yes | Min 6 characters |

**Expected Behavior:**
- Same spinner guard as login (no flash)
- On success → show success message (email confirmation sent), not auto-redirect
- If user already logged in → redirect to `/dashboard`
- Profile upsert must include `plan: "free"` to avoid FK violation

**Test Cases:**
- [ ] Empty name → form not submitted
- [ ] Empty email → form not submitted
- [ ] Short password (< 6 chars) → error shown
- [ ] Already-used email → Supabase error shown inline
- [ ] Successful signup → success state shown (not blank page)

---

### 3. Contact Form (`/contact`)
**File:** `src/app/contact/page.tsx`  
**API:** `src/app/api/contact/route.ts`

**Inputs:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | Non-empty |
| email | email | Yes | Valid email format |
| message | textarea | Yes | Non-empty |

**Expected Behavior:**
- On success → show confirmation message, clear form
- On API failure → show error, keep form data intact
- Email sent via `sendNotification()` in `src/lib/email.ts`
- Branded HTML email received with ProposalPro header

**Test Cases:**
- [ ] All fields empty → form blocked, validation shown
- [ ] Invalid email → error on email field
- [ ] Successful submit → "Message sent" confirmation visible
- [ ] API error → error message shown, form data preserved

---

### 4. Proposal Editor Form (`/editor/[proposalId]`)
**File:** `src/app/editor/[proposalId]/page.tsx`

**Inputs:**
| Field | Type | Required |
|-------|------|----------|
| title | text | Yes |
| client_email | email | No |
| content | TipTap rich text | Yes |
| status | dropdown (draft/sent/accepted/declined) | Yes |

**Expected Behavior:**
- Auto-save or save button triggers PATCH to `/api/proposals`
- Changing status updates `proposals.status` in Supabase
- Export (PDF/print) button tracks export via `/api/track-export`
- Free users limited to `FREE_EXPORT_LIMIT = 3` exports
- Preview panel stays white even in dark mode (for print)

**Test Cases:**
- [ ] Empty title → save blocked with validation
- [ ] Save with content → `proposals.content` updated in DB
- [ ] Status change → reflected in DB immediately
- [ ] Free user exceeds export limit → upgrade prompt shown
- [ ] Print/preview → white background regardless of dark mode

---

### 5. Custom Template Builder (`/templates`)
**File:** `src/components/CustomTemplateBuilder.tsx`  
**API:** `src/app/api/custom-templates/route.ts`

**Inputs:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| name | text | Yes | — |
| icon | emoji picker | No | `DEFAULT_TEMPLATE_ICON` ("📄") |
| color | gradient picker | No | `DEFAULT_TEMPLATE_COLOR` |
| fields | dynamic list | Yes (min 1) | — |

**Expected Behavior:**
- POST saves to `custom_templates` table
- Template immediately appears in template gallery
- DELETE removes from gallery and DB

**Test Cases:**
- [ ] Empty name → form blocked
- [ ] No fields added → form blocked
- [ ] Successful create → appears in template list
- [ ] Delete → removed from list immediately

## How to Use This Skill

When reviewing a form:
1. Read the form's page file
2. Read the corresponding API route
3. Compare against the contract above
4. List any gaps: missing validation, wrong redirect, missing error state
5. Fix gaps found
