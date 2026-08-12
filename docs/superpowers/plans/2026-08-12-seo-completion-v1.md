# SEO Completion V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship production-ready global SEO settings — verification meta tags, Organization JSON-LD (form + override), robots toggle UX, audit logging, and navigation cleanup — without a new Prisma settings model.

**Architecture:** Extend composed `SEO_KEYS` on the existing `Setting` table; validate at API + UI; inject metadata in `app/layout.tsx`; audit via `auditSeoSettingsUpdate` with smart diff (changed fields only); move admin UI to `/admin/settings/seo` with 308 from legacy route.

**Tech Stack:** Next.js App Router Metadata API, Prisma `Setting` + `AuditLog`, react-hook-form + zod, existing `saveSettings` / `createAuditLog`, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-seo-completion-v1-design.md`

## Global Constraints

- Storage: existing `Setting` key-value — **no `SeoSettings` model**
- Prisma migration: **`AuditModule.SEO` enum only**
- SEO Settings access: `ADMIN_ROLES` via module id `seo-settings`
- SEO Workspace access: unchanged — `CONTENT_EDITOR_ROLES` via module id `seo`
- Legacy route: `permanentRedirect()` → HTTP **308** from `/admin/seo/settings` to `/admin/settings/seo`
- `customOrganizationSchema` + `jsonLd`: reject invalid JSON at **API and UI** before save
- Audit: `AuditAction.UPDATE` + `AuditModule.SEO`; persisted `changes` = **changed fields only** via `buildDiff`
- Organization emit requires `organizationName` + `organizationUrl` (generation only — does not block save)
- Robots: reuse `robots` key (`index,follow` / `noindex,nofollow`); UI = toggle only
- Fail-open audit policy (inherited from Audit V1)

## File map

| Path | Responsibility |
|------|----------------|
| `lib/settings.ts` | Composed `SEO_KEYS`, defaults, `getSeoSettings` |
| `validators/content.validator.ts` | Extended `seoSchema` + JSON helpers |
| `lib/seo/organization-schema.ts` | Resolve custom vs generated Organization JSON-LD |
| `lib/settings-audit.ts` | `auditSeoSettingsUpdate` |
| `lib/audit-diff.ts` | Add long-text keys |
| `lib/admin-permissions.ts` | `seo-settings` module |
| `lib/admin-navigation.ts` | SEO under system-settings |
| `types/index.ts` | `seo-settings` in `AdminModuleId` |
| `app/api/seo/route.ts` | Auth split + audit on PATCH |
| `app/layout.tsx` | Verification meta + organization script |
| `app/admin/settings/seo/page.tsx` | New settings page |
| `app/admin/seo/settings/page.tsx` | 308 permanent redirect |
| `features/settings/seo-form.tsx` | Sectioned form shell |
| `features/settings/seo-*-section.tsx` | General / verification / organization / advanced |
| `features/audit-logs/audit-log-badges.tsx` | SEO module badge color |
| `prisma/schema.prisma` | `AuditModule.SEO` |
| `tests/content-validator.test.ts` | SEO + JSON validation |
| `tests/organization-schema.test.ts` | Generation + priority |
| `tests/settings-audit.test.ts` | SEO audit handler + diff |
| `tests/api-authorization-guard.test.ts` | `seo-settings` on `/api/seo` |

---

### Task 1: SEO keys + JSON validation (Phase 1)

**Files:**
- Modify: `lib/settings.ts`
- Modify: `validators/content.validator.ts`
- Modify: `tests/content-validator.test.ts`

**Interfaces:**
- Produces: `BASE_SEO_KEYS`, `VERIFICATION_KEYS`, `ORGANIZATION_KEYS`, `SEO_KEYS`, extended `DEFAULT_SEO`, extended `seoSchema`, helpers `optionalJsonObjectText`, `optionalJsonLdText`

- [ ] **Step 1: Write failing validator tests**

Add to `tests/content-validator.test.ts`:

```ts
it("accepts extended SEO settings with verification and organization fields", () => {
  const parsed = seoSchema.safeParse({
    metaTitle: "The Paseo",
    metaDescription: "Shopping, events, news, and promotions.",
    ogImage: "",
    twitterCard: "summary_large_image",
    canonicalUrl: "",
    jsonLd: "",
    robots: "index,follow",
    googleVerification: "abc123",
    bingVerification: "bing456",
    organizationName: "The Paseo",
    organizationUrl: "https://thepaseo.co.th",
    organizationLogo: "",
    organizationPhone: "",
    organizationEmail: "",
    customOrganizationSchema: "",
  });

  assert.equal(parsed.success, true);
});

it("rejects invalid customOrganizationSchema JSON", () => {
  const base = {
    metaTitle: "The Paseo",
    metaDescription: "Shopping, events, news, and promotions.",
    ogImage: "",
    twitterCard: "summary_large_image",
    canonicalUrl: "",
    jsonLd: "",
    robots: "index,follow",
    googleVerification: "",
    bingVerification: "",
    organizationName: "",
    organizationUrl: "",
    organizationLogo: "",
    organizationPhone: "",
    organizationEmail: "",
  };

  assert.equal(
    seoSchema.safeParse({ ...base, customOrganizationSchema: "hello world" }).success,
    false,
  );
  assert.equal(
    seoSchema.safeParse({ ...base, customOrganizationSchema: "[]" }).success,
    false,
  );
  assert.equal(
    seoSchema.safeParse({
      ...base,
      customOrganizationSchema: '{"@context":"https://schema.org","@type":"Organization"}',
    }).success,
    true,
  );
});

it("rejects invalid jsonLd JSON", () => {
  const parsed = seoSchema.safeParse({
    metaTitle: "The Paseo",
    metaDescription: "Shopping, events, news, and promotions.",
    ogImage: "",
    twitterCard: "summary_large_image",
    canonicalUrl: "",
    jsonLd: "not-json",
    robots: "index,follow",
    googleVerification: "",
    bingVerification: "",
    organizationName: "",
    organizationUrl: "",
    organizationLogo: "",
    organizationPhone: "",
    organizationEmail: "",
    customOrganizationSchema: "",
  });

  assert.equal(parsed.success, false);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx tsx --test tests/content-validator.test.ts`
Expected: FAIL — unknown keys or missing validation

- [ ] **Step 3: Implement keys + validators**

In `validators/content.validator.ts`, add helpers above `seoSchema`:

```ts
function parseJsonValue(raw: string, context: z.RefinementCtx, message: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    context.addIssue({ code: z.ZodIssueCode.custom, message });
    return z.NEVER;
  }
}

const optionalJsonObjectText = z.preprocess(emptyToNull, z.string().nullable().optional()).superRefine((value, context) => {
  if (!value) return;
  const parsed = parseJsonValue(value, context, "Enter valid JSON");
  if (parsed === z.NEVER) return;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "JSON must be an object" });
  }
});

const optionalJsonLdText = z.preprocess(emptyToNull, z.string().nullable().optional()).superRefine((value, context) => {
  if (!value) return;
  const parsed = parseJsonValue(value, context, "Enter valid JSON");
  if (parsed === z.NEVER) return;
  if (typeof parsed !== "object" || parsed === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "JSON-LD must be a JSON object or array" });
  }
});
```

Extend `seoSchema`:

```ts
export const seoSchema = z.object({
  metaTitle: requiredText("Meta title").max(70, "Meta title should be 70 characters or less"),
  metaDescription: requiredText("Meta description").max(170, "Meta description should be 170 characters or less"),
  ogImage: optionalText,
  twitterCard: z.enum(["summary", "summary_large_image"]),
  canonicalUrl: optionalText,
  jsonLd: optionalJsonLdText,
  robots: z.enum(["index,follow", "noindex,nofollow"]),
  googleVerification: z.string().trim().max(128).optional().default(""),
  bingVerification: z.string().trim().max(128).optional().default(""),
  organizationName: z.string().trim().max(200).optional().default(""),
  organizationUrl: z.union([z.literal(""), z.string().trim().url("Enter a valid URL")]).optional().default(""),
  organizationLogo: z.union([z.literal(""), z.string().trim().url("Enter a valid URL")]).optional().default(""),
  organizationPhone: z.string().trim().max(50).optional().default(""),
  organizationEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional().default(""),
  customOrganizationSchema: optionalJsonObjectText,
});
```

In `lib/settings.ts`, add composed keys and defaults per spec §1.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx tsx --test tests/content-validator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/settings.ts validators/content.validator.ts tests/content-validator.test.ts
git commit -m "feat(seo): extend SEO keys and JSON validation"
```

---

### Task 2: Organization schema resolver (Phase 5 prep)

**Files:**
- Create: `lib/seo/organization-schema.ts`
- Create: `tests/organization-schema.test.ts`

**Interfaces:**
- Produces: `resolveOrganizationJsonLd(seo: SeoSettings): Record<string, unknown> | null`

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_SEO } from "@/lib/settings";
import { resolveOrganizationJsonLd } from "@/lib/seo/organization-schema";

describe("resolveOrganizationJsonLd", () => {
  it("returns null when no organization data", () => {
    assert.equal(resolveOrganizationJsonLd({ ...DEFAULT_SEO }), null);
  });

  it("generates schema when name and url are set", () => {
    const result = resolveOrganizationJsonLd({
      ...DEFAULT_SEO,
      organizationName: "The Paseo",
      organizationUrl: "https://thepaseo.co.th",
      organizationPhone: "02-123-4567",
    });

    assert.deepEqual(result, {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Paseo",
      url: "https://thepaseo.co.th",
      telephone: "02-123-4567",
    });
  });

  it("prefers customOrganizationSchema over generated", () => {
    const custom = { "@context": "https://schema.org", "@type": "Organization", name: "Custom" };
    const result = resolveOrganizationJsonLd({
      ...DEFAULT_SEO,
      organizationName: "The Paseo",
      organizationUrl: "https://thepaseo.co.th",
      customOrganizationSchema: JSON.stringify(custom),
    });

    assert.deepEqual(result, custom);
  });

  it("omits empty optional generated fields", () => {
    const result = resolveOrganizationJsonLd({
      ...DEFAULT_SEO,
      organizationName: "The Paseo",
      organizationUrl: "https://thepaseo.co.th",
      organizationLogo: "",
    });

    assert.equal("logo" in (result ?? {}), false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement resolver**

```ts
import type { SeoSettings } from "@/lib/settings";

function parseCustomOrganizationSchema(raw: string): Record<string, unknown> | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[seo] invalid customOrganizationSchema in settings — falling back to generated");
    }
  }
  return null;
}

function generateOrganizationSchema(seo: SeoSettings): Record<string, unknown> | null {
  if (!seo.organizationName.trim() || !seo.organizationUrl.trim()) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.organizationName.trim(),
    url: seo.organizationUrl.trim(),
  };

  if (seo.organizationLogo.trim()) schema.logo = seo.organizationLogo.trim();
  if (seo.organizationPhone.trim()) schema.telephone = seo.organizationPhone.trim();
  if (seo.organizationEmail.trim()) schema.email = seo.organizationEmail.trim();

  return schema;
}

export function resolveOrganizationJsonLd(seo: SeoSettings): Record<string, unknown> | null {
  return parseCustomOrganizationSchema(seo.customOrganizationSchema) ?? generateOrganizationSchema(seo);
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/seo/organization-schema.ts tests/organization-schema.test.ts
git commit -m "feat(seo): add organization JSON-LD resolver"
```

---

### Task 3: Audit enum + SEO audit handler (Phase 2)

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/settings-audit.ts`
- Modify: `lib/audit-diff.ts`
- Modify: `tests/settings-audit.test.ts`
- Modify: `features/audit-logs/audit-log-badges.tsx`

**Interfaces:**
- Produces: `auditSeoSettingsUpdate(input, deps?)`; `AuditModule.SEO` in Prisma client

- [ ] **Step 1: Write failing audit tests**

Add to `tests/settings-audit.test.ts`:

```ts
import { auditSeoSettingsUpdate } from "@/lib/settings-audit";
import { buildDiff } from "@/lib/audit-diff";

it("audits SEO settings updates under AuditModule.SEO", async () => {
  const capture = captureAuditInput();
  const before = { organizationPhone: "" };
  const after = { organizationPhone: "02-123-4567" };

  await auditSeoSettingsUpdate({ user, before, after }, capture.dependencies);

  assert.deepEqual(capture.getInput(), {
    user,
    action: AuditAction.UPDATE,
    module: AuditModule.SEO,
    entityType: "SeoSettings",
    entityName: "SEO Settings",
    before,
    after,
    context,
  });
});

it("stores only changed SEO fields in diff", () => {
  const diff = buildDiff(
    {
      metaTitle: "The Paseo",
      metaDescription: "Same",
      organizationPhone: "",
    },
    {
      metaTitle: "The Paseo",
      metaDescription: "Same",
      organizationPhone: "02-123-4567",
    },
  );

  assert.deepEqual(diff, {
    organizationPhone: { before: "", after: "02-123-4567" },
  });
});

it("marks jsonLd and customOrganizationSchema as long-text diffs", () => {
  assert.deepEqual(
    buildDiff({ jsonLd: "{}" }, { jsonLd: '{"@type":"Thing"}' }),
    { jsonLd: { changed: true } },
  );
});
```

- [ ] **Step 2: Run tests — expect FAIL** (`AuditModule.SEO` missing, handler missing)

- [ ] **Step 3: Migrate + implement**

1. Add `SEO` to `AuditModule` in `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name add_audit_module_seo`
3. Add to `lib/audit-diff.ts` `LONG_TEXT_KEYS`: `"jsonLd"`, `"customOrganizationSchema"`
4. Add handler:

```ts
export async function auditSeoSettingsUpdate(
  { user, before, after }: SettingsUpdateAuditInput,
  dependencies: SettingsAuditDependencies = defaultDependencies,
): Promise<void> {
  await dependencies.createAuditLog({
    user: toAuditActor(user),
    action: AuditAction.UPDATE,
    module: AuditModule.SEO,
    entityType: "SeoSettings",
    entityName: "SEO Settings",
    before,
    after,
    context: await dependencies.getAuditRequestContext(),
  });
}
```

5. Add `SEO` to `MODULE_CLASSES` in `audit-log-badges.tsx` (match `LOCALIZATION` palette)

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/settings-audit.ts lib/audit-diff.ts \
  tests/settings-audit.test.ts features/audit-logs/audit-log-badges.tsx
git commit -m "feat(seo): add SEO audit module and handler"
```

---

### Task 4: API auth split + audit wiring (Phase 3)

**Files:**
- Modify: `app/api/seo/route.ts`
- Modify: `lib/admin-permissions.ts`
- Modify: `types/index.ts`
- Modify: `tests/api-authorization-guard.test.ts`
- Modify: `tests/admin-permissions.test.ts` (if exists)

**Interfaces:**
- Consumes: `auditSeoSettingsUpdate`, `getSeoSettings`, `saveSettings`, `seoSchema`
- Produces: `/api/seo` guarded by `seo-settings`; PATCH writes audit row

- [ ] **Step 1: Update failing guard test**

Change registry entry:

```ts
{ file: "app/api/seo/route.ts", moduleId: "seo-settings", authPattern: "checkModuleAccess" },
```

Add permission test for `seo-settings` → `ADMIN_ROLES`.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement**

`types/index.ts` — add `"seo-settings"` to `AdminModuleId`.

`lib/admin-permissions.ts`:

```ts
{ id: "seo-settings", routePrefix: "/admin/settings/seo", roles: ADMIN_ROLES },
```

`app/api/seo/route.ts`:

```ts
import { auditSeoSettingsUpdate } from "@/lib/settings-audit";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("seo-settings");
  if (!authorized) return forbiddenError(status);
  const seo = await getSeoSettings();
  return NextResponse.json({ seo });
}

export async function PATCH(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("seo-settings");
  if (!authorized) return forbiddenError(status);

  const parsed = seoSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const before = await getSeoSettings();
  await saveSettings(parsed.data);
  await auditSeoSettingsUpdate({
    user: session.user,
    before,
    after: parsed.data,
  });

  return NextResponse.json({ seo: parsed.data });
}
```

- [ ] **Step 4: Run guard + audit tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add app/api/seo/route.ts lib/admin-permissions.ts types/index.ts tests/api-authorization-guard.test.ts
git commit -m "feat(seo): wire API auth split and audit on PATCH"
```

---

### Task 5: Metadata injection (Phase 5)

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `resolveOrganizationJsonLd(seo)`, `getSeoSettings()`

- [ ] **Step 1: Add verification to `generateMetadata`**

```ts
verification: {
  google: seo.googleVerification || undefined,
  other: seo.bingVerification
    ? { "msvalidate.01": seo.bingVerification }
    : undefined,
},
```

- [ ] **Step 2: Add organization script in `RootLayout`**

```tsx
const organizationJsonLd = resolveOrganizationJsonLd(seo);

// inside <body>, before existing jsonLd script:
{organizationJsonLd ? (
  <script
    type="application/ld+json"
    suppressHydrationWarning
    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
  />
) : null}
```

Keep existing `seo.jsonLd` raw inject unchanged.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): inject verification meta and organization JSON-LD"
```

---

### Task 6: Settings UI + navigation + 308 redirect (Phase 4)

**Files:**
- Create: `app/admin/settings/seo/page.tsx`
- Modify: `app/admin/seo/settings/page.tsx`
- Modify: `lib/admin-navigation.ts`
- Refactor: `features/settings/seo-form.tsx`
- Create: `features/settings/seo-general-section.tsx`
- Create: `features/settings/seo-verification-section.tsx`
- Create: `features/settings/seo-organization-section.tsx`
- Create: `features/settings/seo-advanced-section.tsx`

**Interfaces:**
- Consumes: `seoSchema`, `SeoFormValues`, `GET/PATCH /api/seo`
- Produces: sectioned admin UI at `/admin/settings/seo`; 308 from legacy route

- [ ] **Step 1: Permissions + navigation**

In `lib/admin-navigation.ts`:

1. Add under `system-settings`:

```ts
{ id: "seo-settings", label: "SEO", href: "/admin/settings/seo" },
```

2. Remove `excludeActivePaths: ["/admin/seo/settings"]` from `seo` workspace item (no longer needed)

- [ ] **Step 2: Create new page**

`app/admin/settings/seo/page.tsx` — mirror `app/admin/settings/localization/page.tsx`:

```tsx
import { Globe2 } from "lucide-react";
import Link from "next/link";

import { SeoForm } from "@/features/settings/seo-form";
import { requireModuleAccess } from "@/lib/rbac";
import { getSeoSettings } from "@/lib/settings";

export default async function SeoSettingsPage() {
  await requireModuleAccess("seo-settings");
  const seo = await getSeoSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <Globe2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">SEO</h1>
        <p className="text-sm text-muted">
          Manage global metadata, search engine verification, organization schema, and indexing defaults.
        </p>
        <Link
          href="/admin/seo/workspace"
          className="mt-2 inline-block text-sm font-medium text-paseo-dark hover:underline"
        >
          Open SEO Workspace
        </Link>
      </div>
      <SeoForm defaultValues={seo} />
    </div>
  );
}
```

- [ ] **Step 3: 308 legacy redirect**

Replace `app/admin/seo/settings/page.tsx`:

```tsx
import { permanentRedirect } from "next/navigation";

export default function LegacySeoSettingsPage() {
  permanentRedirect("/admin/settings/seo");
}
```

- [ ] **Step 4: Refactor form into sections**

`seo-form.tsx` — keep submit/fetch logic; delegate fields to section components.

**Search Indexing toggle** — map boolean ↔ robots:

```tsx
const allowIndexing = watch("robots") !== "noindex,nofollow";

<input
  type="checkbox"
  checked={allowIndexing}
  onChange={(event) =>
    setValue("robots", event.target.checked ? "index,follow" : "noindex,nofollow", {
      shouldDirty: true,
    })
  }
/>
```

**Advanced section** — warning copy:

> Organization schema is managed in the Organization section. Custom JSON-LD below is a global override and may duplicate structured data if both are set.

All sections use `register()` / `errors` from parent form so **UI validation runs via zod resolver** on submit (same schema as API).

- [ ] **Step 5: Manual UI smoke**

1. ADMIN opens `/admin/settings/seo` — form loads with all sections
2. Paste `hello world` in Custom Organization Schema → client validation error on submit
3. Toggle indexing off → saves `noindex,nofollow`
4. Visit `/admin/seo/settings` → lands on `/admin/settings/seo` (308)

- [ ] **Step 6: Commit**

```bash
git add app/admin/settings/seo/page.tsx app/admin/seo/settings/page.tsx \
  lib/admin-navigation.ts features/settings/seo-form.tsx features/settings/seo-*-section.tsx
git commit -m "feat(seo): add settings UI, nav, and 308 legacy redirect"
```

#### Phase 4 Verification

- [ ] SEO Settings under **ตั้งค่าระบบ** for ADMIN / SUPER_ADMIN only
- [ ] SEO Workspace unchanged under **การตลาดและ SEO**
- [ ] `/admin/seo/settings` → 308 → `/admin/settings/seo`
- [ ] Invalid JSON blocked in UI before save

---

### Task 7: QA + acceptance smoke (Phase 6)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: PASS

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 3: Manual acceptance checklist (spec §9)**

1. Google + Bing verification → view page source meta tags
2. Organization name + URL → JSON-LD script in source
3. Custom organization JSON → overrides generated
4. Indexing toggle off → `noindex,nofollow` metadata emitted (do not require `/robots.txt` in V1 acceptance; existing `app/robots.ts` already follows the same key)
5. Save SEO → Audit Logs row with module **SEO**, diff shows **only changed fields**
6. EDITOR blocked from `/admin/settings/seo` and `PATCH /api/seo`

- [ ] **Step 4: Final commit** (if any QA fixes)

```bash
git commit -m "fix(seo): address QA findings for completion v1"
```

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Composed SEO_KEYS on Setting | Task 1 |
| JSON validation API + UI | Task 1, Task 6 |
| Organization resolver + priority | Task 2 |
| Verification metadata | Task 5 |
| Organization script tag | Task 5 |
| Robots toggle UX | Task 6 |
| AuditModule.SEO + smart diff | Task 3 |
| seo-settings ADMIN auth | Task 4 |
| Navigation cleanup | Task 6 |
| 308 permanent redirect | Task 6 |
| Acceptance criteria | Task 7 |
