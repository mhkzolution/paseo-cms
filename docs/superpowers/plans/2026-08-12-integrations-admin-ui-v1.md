# Integrations Admin UI V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/admin/settings/integrations` so ADMIN roles can configure GA4, GTM, Meta Pixel, and LINE OA IDs via the Foundation API — with nav, module identity, and matching page/API auth.

**Architecture:** SEO Settings clone — Server Component page loads `getIntegrationSettings()`, client form with four section components PATCHes `/api/settings/integrations`. Add `integrations` module id (`ADMIN_ROLES`) for nav/middleware/auth identity. Migrate API auth from `"settings"` → `"integrations"`. Keep `AuditModule.SETTINGS`.

**Tech Stack:** Next.js App Router, react-hook-form + zod (`integrationSchema`), existing Foundation helpers, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-integrations-admin-ui-v1-design.md`

## Global Constraints

- Storage / schema: **reuse Foundation** — no new Setting keys, no Prisma changes
- Permission roles: **`ADMIN_ROLES` only** (`SUPER_ADMIN`, `ADMIN`) — same as settings
- Module id: **`integrations`** for page + API + nav (not a new business RBAC split)
- API path unchanged: `/api/settings/integrations` — **only** `checkModuleAccess` module string changes
- Audit: keep **`AuditModule.SETTINGS`** via existing `auditIntegrationSettingsUpdate`
- LINE: store **OA ID only** (`@thepaseo`) — no URL field
- No format validation beyond existing `integrationSchema`
- No runtime injection, connection tests, status badges, or tabs
- Visual consistency with SEO section cards; **do not** force-import SEO components if coupling is heavy — clone the pattern
- Save: PATCH current RHF form state (API already merges partials)

## File map

| Path | Responsibility |
|------|----------------|
| `types/index.ts` | Add `integrations` to `AdminModuleId` |
| `lib/admin-permissions.ts` | Registry entry `integrations` → `/admin/settings/integrations` |
| `lib/admin-navigation.ts` | Nav link + `excludeActivePaths` |
| `app/api/settings/integrations/route.ts` | Auth → `integrations` |
| `app/admin/settings/integrations/page.tsx` | Server page + auth + load defaults |
| `features/settings/integrations-form.tsx` | Form shell + save |
| `features/settings/integrations-analytics-section.tsx` | GA4 field |
| `features/settings/integrations-tag-manager-section.tsx` | GTM field |
| `features/settings/integrations-meta-section.tsx` | Meta Pixel field |
| `features/settings/integrations-line-section.tsx` | LINE OA ID field |
| `tests/admin-permissions.test.ts` | Module + pathname + excludeActivePaths |
| `tests/api-authorization-guard.test.ts` | API module id + audit wiring |

---

### Task 1: Registry + Navigation (Phase 1)

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/admin-permissions.ts`
- Modify: `lib/admin-navigation.ts`
- Modify: `tests/admin-permissions.test.ts`

**Interfaces:**
- Produces: `AdminModuleId` includes `"integrations"`; `getModuleRoles("integrations")` → `ADMIN_ROLES`; `findModulePermissionForPathname("/admin/settings/integrations")` → `integrations`

- [ ] **Step 1: Write failing permission / nav tests**

Add to `tests/admin-permissions.test.ts`:

```ts
it("protects integrations settings for ADMIN_ROLES only", () => {
  assert.deepEqual(getModuleRoles("integrations"), ["SUPER_ADMIN", "ADMIN"]);
  const permission = findModulePermissionForPathname("/admin/settings/integrations");
  assert.equal(permission?.id, "integrations");
  assert.equal(permission?.roles.includes("EDITOR"), false);
});

it("keeps general settings active-path exclusions for nested settings routes", () => {
  const general = ADMIN_NAV_SECTIONS.flatMap((section) => section.items).find(
    (item) => item.id === "settings",
  );
  assert.ok(general);
  assert.ok(general.excludeActivePaths?.includes("/admin/settings/integrations"));
  assert.equal(isNavLinkActive("/admin/settings/integrations", general), false);
});

it("includes Integrations nav link after SEO", () => {
  const system = ADMIN_NAV_SECTIONS.find((section) => section.id === "system-settings");
  assert.ok(system);
  const ids = system.items.map((item) => item.id);
  const seoIndex = ids.indexOf("seo-settings");
  const integrationsIndex = ids.indexOf("integrations");
  assert.ok(seoIndex >= 0);
  assert.ok(integrationsIndex >= 0);
  assert.equal(integrationsIndex, seoIndex + 1);

  const integrations = system.items[integrationsIndex];
  assert.equal(integrations.label, "Integrations");
  assert.equal(integrations.href, "/admin/settings/integrations");
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
node --import tsx --test tests/admin-permissions.test.ts
```

Expected: FAIL — unknown module / missing nav / missing exclude path

- [ ] **Step 3: Add module id + permission + nav**

In `types/index.ts`, add `| "integrations"` to `AdminModuleId` (near `localization` / `recaptcha`).

In `lib/admin-permissions.ts`, after localization entry:

```ts
{ id: "integrations", routePrefix: "/admin/settings/integrations", roles: ADMIN_ROLES },
```

In `lib/admin-navigation.ts` system-settings items:

```ts
{
  id: "settings",
  label: "ตั้งค่าทั่วไป",
  href: "/admin/settings",
  excludeActivePaths: [
    "/admin/settings/localization",
    "/admin/settings/seo",
    "/admin/settings/integrations",
  ],
},
{ id: "localization", label: "ภาษาและรูปแบบ", href: "/admin/settings/localization" },
{ id: "seo-settings", label: "SEO", href: "/admin/settings/seo" },
{ id: "integrations", label: "Integrations", href: "/admin/settings/integrations" },
{ id: "recaptcha", label: "ระบบป้องกันสแปม", href: "/admin/recaptcha" },
{ id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs" },
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --import tsx --test tests/admin-permissions.test.ts
```

Expected: PASS (including existing `validateAdminNavigationConfig` → `[]`)

- [ ] **Step 5: Commit**

```bash
git add types/index.ts lib/admin-permissions.ts lib/admin-navigation.ts tests/admin-permissions.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add integrations module registry and nav

EOF
)"
```

---

### Task 2: API auth migration (Phase 3 brought forward — unblocks page)

**Files:**
- Modify: `app/api/settings/integrations/route.ts`
- Modify: `tests/api-authorization-guard.test.ts`

**Interfaces:**
- Consumes: `integrations` module from Task 1
- Produces: GET/PATCH both call `checkModuleAccess("integrations")`

- [ ] **Step 1: Update failing expectations in API guard tests**

In `tests/api-authorization-guard.test.ts` registry entry, change:

```ts
{ file: "app/api/settings/integrations/route.ts", moduleId: "integrations", authPattern: "checkModuleAccess" },
```

In the integration audit wiring describe block, assert:

```ts
assert.match(patchHandler, /const \{ authorized, status, session \} = await checkModuleAccess\("integrations"\)/);
```

(Keep existing assertions for `getIntegrationSettings`, `saveIntegrationSettings`, `auditIntegrationSettingsUpdate`.)

- [ ] **Step 2: Run guard test for integrations — expect FAIL**

```bash
node --import tsx --test tests/api-authorization-guard.test.ts
```

Expected: FAIL on integrations route still using `"settings"`

- [ ] **Step 3: Migrate API auth**

In `app/api/settings/integrations/route.ts`, replace both:

```ts
await checkModuleAccess("settings")
```

with:

```ts
await checkModuleAccess("integrations")
```

Do not change route path, response shape, merge behavior, or audit call.

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --import tsx --test tests/api-authorization-guard.test.ts
```

Expected: PASS for integrations wiring (ignore pre-existing categories failures if still present)

- [ ] **Step 5: Commit**

```bash
git add app/api/settings/integrations/route.ts tests/api-authorization-guard.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): migrate integrations API auth to integrations module

EOF
)"
```

---

### Task 3: Page + Form + Sections (Phase 2)

**Files:**
- Create: `app/admin/settings/integrations/page.tsx`
- Create: `features/settings/integrations-form.tsx`
- Create: `features/settings/integrations-analytics-section.tsx`
- Create: `features/settings/integrations-tag-manager-section.tsx`
- Create: `features/settings/integrations-meta-section.tsx`
- Create: `features/settings/integrations-line-section.tsx`
- Test: `tests/admin-page-authorization-guard.test.ts` (auto-discovers pages — no exemption)

**Interfaces:**
- Consumes: `getIntegrationSettings()`, `integrationSchema`, `IntegrationFormValues`
- Produces: `/admin/settings/integrations` page calling `requireModuleAccess("integrations")`

- [ ] **Step 1: Confirm page-auth guard will require wiring**

```bash
node --import tsx --test tests/admin-page-authorization-guard.test.ts
```

After adding the page file without `requireModuleAccess`, this suite should FAIL. Prefer writing the page with auth in the same task cycle.

- [ ] **Step 2: Create section components (clone SEO card visuals locally)**

Shared local pattern (inline in each section or a tiny private helper in the first section file — **do not** import `SeoSectionCard` unless trivial):

```tsx
<section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
  <div className="mb-4">
    <h2 className="text-base font-semibold text-foreground">{title}</h2>
    <p className="mt-1 text-sm text-muted">{description}</p>
  </div>
  {/* field */}
</section>
```

Input class (match SEO):

```txt
mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent
```

**Analytics** (`integrations-analytics-section.tsx`):

- title: `Analytics`
- description: `Configure Google Analytics 4 tracking for your website.`
- field: `gaMeasurementId` / label `Measurement ID` / placeholder `G-XXXXXXXXXX` / help `GA4 Measurement ID`

**Tag Manager** (`integrations-tag-manager-section.tsx`):

- title: `Tag Manager`
- description: `Configure Google Tag Manager container injection.`
- field: `gtmContainerId` / `Container ID` / `GTM-XXXXXXX` / `GTM Container ID`

**Meta** (`integrations-meta-section.tsx`):

- title: `Meta`
- description: `Configure Meta Pixel tracking for marketing analytics.`
- field: `metaPixelId` / `Pixel ID` / `123456789012345` / `Meta Pixel ID`

**LINE** (`integrations-line-section.tsx`):

- title: `LINE`
- description: `Configure your LINE Official Account identifier.`
- field: `lineOaId` / `LINE OA ID` / `@thepaseo`
- help: `Enter your LINE Official Account ID including the @ prefix. Example: @thepaseo`

Each section accepts `register` + `errors` typed with `IntegrationFormValues` from `@/validators/content.validator`.

- [ ] **Step 3: Create `IntegrationsForm`**

Mirror `features/settings/seo-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { IntegrationsAnalyticsSection } from "@/features/settings/integrations-analytics-section";
import { IntegrationsTagManagerSection } from "@/features/settings/integrations-tag-manager-section";
import { IntegrationsMetaSection } from "@/features/settings/integrations-meta-section";
import { IntegrationsLineSection } from "@/features/settings/integrations-line-section";
import { integrationSchema } from "@/validators/content.validator";
import type { IntegrationFormValues } from "@/validators/content.validator";

interface IntegrationsFormProps {
  defaultValues: IntegrationFormValues;
}

export function IntegrationsForm({ defaultValues }: IntegrationsFormProps) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const resolver = zodResolver(integrationSchema) as Resolver<IntegrationFormValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntegrationFormValues>({ resolver, defaultValues });

  const onSubmit = async (values: IntegrationFormValues) => {
    setServerMessage(null);
    setIsSuccess(false);

    const response = await fetch("/api/settings/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerMessage(body?.error ?? "Unable to save integrations settings.");
      return;
    }

    setIsSuccess(true);
    setServerMessage("Integrations settings saved.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-4xl gap-6">
      <IntegrationsAnalyticsSection register={register} errors={errors} />
      <IntegrationsTagManagerSection register={register} errors={errors} />
      <IntegrationsMetaSection register={register} errors={errors} />
      <IntegrationsLineSection register={register} errors={errors} />

      {serverMessage ? (
        <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{serverMessage}</p>
      ) : null}

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          Save Integrations
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create admin page**

`app/admin/settings/integrations/page.tsx`:

```tsx
import { Link2 } from "lucide-react";

import { IntegrationsForm } from "@/features/settings/integrations-form";
import { getIntegrationSettings } from "@/lib/integration-settings";
import { requireModuleAccess } from "@/lib/rbac";

export default async function IntegrationsSettingsPage() {
  await requireModuleAccess("integrations");

  const integrations = await getIntegrationSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <Link2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="text-sm text-muted">
          จัดการการเชื่อมต่อบริการภายนอกและระบบติดตามข้อมูล
        </p>
      </div>

      <IntegrationsForm defaultValues={integrations} />
    </div>
  );
}
```

- [ ] **Step 5: Run page auth + permission suites**

```bash
node --import tsx --test \
  tests/admin-page-authorization-guard.test.ts \
  tests/admin-permissions.test.ts \
  tests/api-authorization-guard.test.ts
```

Expected: integrations page discovered and wired; nav/API still green (categories failures may remain unrelated)

- [ ] **Step 6: Commit**

```bash
git add \
  app/admin/settings/integrations/page.tsx \
  features/settings/integrations-form.tsx \
  features/settings/integrations-analytics-section.tsx \
  features/settings/integrations-tag-manager-section.tsx \
  features/settings/integrations-meta-section.tsx \
  features/settings/integrations-line-section.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): add integrations admin settings UI

EOF
)"
```

---

### Task 4: Tests hardening (Phase 4)

**Files:**
- Modify only if Task 1–3 left gaps: `tests/admin-permissions.test.ts`, `tests/api-authorization-guard.test.ts`

- [ ] **Step 1: Re-run scoped suite**

```bash
node --import tsx --test \
  tests/admin-permissions.test.ts \
  tests/admin-page-authorization-guard.test.ts \
  tests/api-authorization-guard.test.ts \
  tests/integration-settings.test.ts \
  tests/settings-audit.test.ts \
  tests/content-validator.test.ts
```

Expected: all integrations-related cases PASS

- [ ] **Step 2: Lint changed files only**

```bash
npx eslint \
  types/index.ts \
  lib/admin-permissions.ts \
  lib/admin-navigation.ts \
  app/api/settings/integrations/route.ts \
  app/admin/settings/integrations/page.tsx \
  features/settings/integrations-*.tsx \
  tests/admin-permissions.test.ts \
  tests/api-authorization-guard.test.ts
```

Expected: 0 errors on these paths

- [ ] **Step 3: Commit only if test/lint fixes were needed**

```bash
git add -u
git commit -m "$(cat <<'EOF'
test(integrations): harden admin UI auth and nav coverage

EOF
)"
```

(Skip commit if working tree clean.)

---

### Task 5: Manual smoke (Phase 5)

- [ ] **Step 1: Run dev server and open UI**

```bash
npm run dev
```

Open `/admin/settings/integrations` as ADMIN.

Checklist:

- [ ] Sidebar shows **Integrations** after SEO; general settings not highlighted on this route
- [ ] EDITOR cannot open the page (redirect)
- [ ] Save empty / sample values (`G-TEST`, `GTM-TEST`, pixel digits, `@thepaseo`)
- [ ] Reload retains values
- [ ] Success message `Integrations settings saved.`
- [ ] Audit log row appears under Settings module for the update (if Audit UI available)

- [ ] **Step 2: Push branch when smoke OK**

```bash
git push -u origin HEAD
```

Open PR against `feat/integrations-foundation-v1` (or updated base once Foundation merges):

**Title:** `feat(integrations): add integrations admin settings UI`

Include Known Issues note for pre-existing repo lint/build failures unrelated to this PR.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Module id `integrations` + ADMIN_ROLES | Task 1 |
| Nav label/order + excludeActivePaths | Task 1 |
| API auth migration to `integrations` | Task 2 |
| Page + form + 4 sections + Save | Task 3 |
| Auth/nav/API tests | Tasks 1–4 |
| No runtime / format validation / connection test | Global Constraints (omitted intentionally) |
| Audit stays SETTINGS | Task 2 (no audit code change) |
| Manual smoke | Task 5 |
