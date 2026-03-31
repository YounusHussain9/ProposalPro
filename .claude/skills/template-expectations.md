# Template Expectations Skill

Use this skill when asked to check what templates do, verify template behavior, or ensure templates meet their contract.

## What Templates Are

ProposalPro has two kinds of templates:
1. **Built-in templates** — defined in `src/lib/templates.ts`, shown to all users
2. **Custom templates** — user-created, stored in `custom_templates` Supabase table

---

## Built-in Template Contract

**File:** `src/lib/templates.ts`
**Function:** `getTemplateById(id: string)` — returns a template or undefined

### Required Fields Per Template
| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique slug (kebab-case) |
| `title` | string | Display name in gallery |
| `description` | string | One-line description |
| `icon` | string | Emoji icon |
| `color` | string | Tailwind gradient classes |
| `fields` | TemplateField[] | Form fields for the proposal |
| `isPro` | boolean | Gated behind Pro plan? |

### Template Field Contract
Each field in `fields[]` must have:
```ts
{
  id: string;         // unique within template
  label: string;      // display label
  type: "text" | "textarea" | "email" | "date" | "number" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[]; // for "select" type only
}
```

### Expected Behavior
- Free users see all templates but Pro-gated ones show upgrade prompt on click
- Template selected → creates new proposal with `template_id` set
- Template `fields` pre-populate the TipTap editor structure
- `getTemplateById(id)` returns `undefined` for unknown IDs — callers must handle this

### Test Cases — Built-in Templates
- [ ] All templates have unique `id` values (no duplicates)
- [ ] All templates have `title`, `description`, `icon`, `color`
- [ ] All `fields` have `id`, `label`, `type`, `required`
- [ ] `getTemplateById("non-existent")` returns `undefined` without throwing
- [ ] Pro templates show lock icon or upgrade prompt for free users
- [ ] Free templates open editor immediately

---

## Custom Template Contract

**API:** `src/app/api/custom-templates/route.ts`
**Table:** `custom_templates` (Supabase)

### Schema
| Column | Type | Required | Default |
|--------|------|----------|---------|
| `id` | uuid | auto | — |
| `user_id` | uuid (FK → profiles) | Yes | — |
| `name` | text | Yes | — |
| `fields` | JSONB | Yes | — |
| `icon` | text | No | `DEFAULT_TEMPLATE_ICON` ("📄") |
| `color` | text | No | `DEFAULT_TEMPLATE_COLOR` |

### API Endpoints
| Method | Behavior |
|--------|----------|
| GET | Returns all custom templates for the authenticated user |
| POST | Creates new template — requires `name` and `fields` (min 1 field) |
| DELETE | Deletes template by `id` — verifies ownership before delete |

### Validation Rules
- `name` must be non-empty, max `TEMPLATE_NAME_MAX_LENGTH` (100) chars
- `fields` must be an array with at least 1 item
- `fields` max length: `MAX_TEMPLATE_FIELDS` (20)
- Each field must have `id`, `label`, `type`
- RLS policy ensures users can only see/edit their own templates

### Expected Behavior
- GET returns only the current user's templates (RLS enforced)
- POST on duplicate name is allowed (names don't need to be unique)
- DELETE with wrong `user_id` returns 403 Forbidden
- Custom templates appear in the template gallery alongside built-in ones
- Custom template `id` is prefixed with `custom_` when used as `template_id` in proposals

### Test Cases — Custom Templates
- [ ] GET returns only current user's templates (not other users')
- [ ] POST with empty name → 400 Bad Request
- [ ] POST with no fields → 400 Bad Request
- [ ] POST with valid data → template appears in gallery
- [ ] DELETE own template → removed from gallery and DB
- [ ] DELETE another user's template → 403 Forbidden
- [ ] Custom template creates proposal → `template_id` stored correctly

---

## Template Usage in Analytics

The dashboard chart (`src/app/dashboard/page.tsx`) aggregates:
```ts
const templateCounts = proposals.reduce((acc, p) => {
  acc[p.template_id] = (acc[p.template_id] ?? 0) + 1;
  return acc;
}, {});
```

`getTemplateLabel(id)` resolves template names:
- Known built-in → uses `template.title`
- Starts with `custom_` → shows "Custom Template"
- Unknown → title-cases the ID

### Test Cases — Analytics
- [ ] Built-in template usage shows correct template title
- [ ] Custom template usage shows "Custom Template"
- [ ] Bar chart width = (count / maxCount) × 100%
- [ ] Chart only shows when at least 1 proposal exists

## How to Use This Skill

When asked to verify template behavior:
1. Read `src/lib/templates.ts` — check built-in template structure
2. Read `src/app/api/custom-templates/route.ts` — check API validation
3. Read `src/components/CustomTemplateBuilder.tsx` — check UI validation
4. Run each test case above manually or by reading the code logic
5. Report: which cases pass, which fail, which are untested
6. Fix any gap found
