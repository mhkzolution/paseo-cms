# SEO Completion V1 Design

**Date:** 2026-08-12  
**Status:** Approved ✅ — ready for implementation  

**Depends on:** Audit Infrastructure V1 (`docs/superpowers/specs/audit-logs-v1.md`) — shipped  
**Related:** SEO Workspace MVP (`docs/specifications/seo/seo-a6-0-workspace-mvp.md`) — unchanged  
**Scope:** Sprint — complete global SEO settings for production readiness

## Goal

Close the remaining global SEO gaps so The Paseo CMS can ship verification, organization structured data, and audit visibility without a settings refactor. Reuse the existing `Setting` key-value store and Audit Infrastructure patterns.

After V1, the SEO module is **production ready** for global configuration. Future work (SEO Analytics, Sitemap Monitoring) stays out of scope.

## Architecture

**Approach — extend `SEO_KEYS` on existing `Setting` table**

- No new Prisma model (`SeoSettings` deferred)
- No data migration from `Setting`
- Compose key groups in code for maintainability
- Metadata injection in root layout + `generateMetadata`
- Audit via explicit call-site after successful PATCH (same as Site Settings)
- SEO Settings page moves under **ตั้งค่าระบบ**; SEO Workspace stays under **การตลาดและ SEO**

```txt
Setting (existing)
  └─ key/value rows for SEO_KEYS

lib/settings.ts
  └─ BASE_SEO_KEYS + VERIFICATION_KEYS + ORGANIZATION_KEYS → SEO_KEYS

PATCH /api/seo
  └─ validate → saveSettings → auditSeoSettingsUpdate

app/layout.tsx
  ├─ generateMetadata() → verification + robots (existing)
  └─ body → organization JSON-LD + optional global jsonLd
```

## Decisions

| Topic | Choice |
|-------|--------|
| Storage | **Option A** — extend `Setting` via `SEO_KEYS` |
| New Prisma models | **No** |
| Prisma migration | **Only** `AuditModule.SEO` enum value (audit filtering) |
| Verification location | Global SEO settings (`googleVerification`, `bingVerification`) |
| Organization schema | Hybrid form builder + `customOrganizationSchema` override |
| Global JSON-LD | Keep existing `jsonLd` textarea as Advanced override |
| Robots index toggle | Reuse existing `robots` key (`index,follow` / `noindex,nofollow`) |
| Audit event | Single `AuditAction.UPDATE` on `AuditModule.SEO` with field diff |
| SEO Settings access | `ADMIN_ROLES` (same as General / Localization) |
| SEO Workspace access | Unchanged — `CONTENT_EDITOR_ROLES` |
| SEO Settings route | `/admin/settings/seo` (consistent with Localization) |
| Legacy route | **308 Permanent Redirect** `/admin/seo/settings` → `/admin/settings/seo` |

### Why not alternatives

- **`SeoSettings` Prisma model:** adds migration, dual-read, and repository split with no user-facing benefit in V1.
- **Search Console sub-module:** extra UI/API surface for two string fields.
- **Per-field audit actions (`GOOGLE_VERIFICATION_UPDATED`, etc.):** inflates enum usage; single UPDATE + diff is sufficient and matches Site Settings.
- **New `allowIndexing` boolean:** duplicates existing `robots` key; refactor UI only.

---

## Frozen Scope

```txt
SEO Completion V1

Storage
✓ Existing Setting table (Option A)
✓ Composed SEO_KEYS (BASE + VERIFICATION + ORGANIZATION)

Verification
✓ googleVerification
✓ bingVerification

Organization (form)
✓ organizationName
✓ organizationUrl
✓ organizationLogo
✓ organizationPhone
✓ organizationEmail

Advanced
✓ customOrganizationSchema (JSON string override)
✓ jsonLd (existing global JSON-LD override)

Existing (no new keys)
✓ robots
✓ metaTitle, metaDescription, ogImage, twitterCard, canonicalUrl

Audit
✓ AuditModule.SEO + AuditAction.UPDATE + smart diff

Navigation
✓ SEO Settings under ตั้งค่าระบบ
✓ SEO Workspace stays under การตลาดและ SEO
```

## Non-Goals

```txt
No SeoSettings Prisma model
No Search Console sub-settings page
No SEO Analytics dashboard
No Sitemap monitoring UI
No per-page verification overrides
No GSC / Bing API integration
No sitemap generation changes
No SEO Workspace feature changes
No field-label localization for audit diff keys
No JSON schema validator beyond parse + object check
No @graph / multi-type Organization builder UI
No physical delete of legacy /admin/seo/settings route file until redirect verified
```

---

## 1. Data Model

### Storage

All SEO values persist in the existing `Setting` model:

```prisma
model Setting {
  id        String    @id @default(uuid())
  key       String    @unique
  value     String    @db.Text
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("settings")
}
```

**No seed migration required.** Missing keys fall back to `DEFAULT_SEO` defaults via `getSettings()`.

### Key composition

Update `lib/settings.ts`:

```ts
export const BASE_SEO_KEYS = [
  "metaTitle",
  "metaDescription",
  "ogImage",
  "twitterCard",
  "canonicalUrl",
  "jsonLd",
  "robots",
] as const;

export const VERIFICATION_KEYS = [
  "googleVerification",
  "bingVerification",
] as const;

export const ORGANIZATION_KEYS = [
  "organizationName",
  "organizationUrl",
  "organizationLogo",
  "organizationPhone",
  "organizationEmail",
  "customOrganizationSchema",
] as const;

export const SEO_KEYS = [
  ...BASE_SEO_KEYS,
  ...VERIFICATION_KEYS,
  ...ORGANIZATION_KEYS,
] as const;
```

### Defaults

Add to `DEFAULT_SEO`:

```ts
googleVerification: "",
bingVerification: "",
organizationName: "",
organizationUrl: "",
organizationLogo: "",
organizationPhone: "",
organizationEmail: "",
customOrganizationSchema: "",
```

Existing defaults for `robots`, `jsonLd`, etc. unchanged.

### TypeScript interface

Extend `SeoSettings`:

```ts
export interface SeoSettings extends SettingMap<SeoKey> {
  twitterCard: TwitterCard;
  robots: RobotsDirective;
}
```

`getSeoSettings()` continues normalizing `twitterCard` and `robots`; new keys pass through as strings.

### Audit enum (only Prisma change)

Add to `AuditModule`:

```prisma
enum AuditModule {
  ...
  SEO
}
```

Requires one Prisma migration. No other schema changes.

---

## 2. Validation

Extend `seoSchema` in `validators/content.validator.ts`.

### Field rules

| Field | Rule |
|-------|------|
| `googleVerification` | optional; trim; max 128 |
| `bingVerification` | optional; trim; max 128 |
| `organizationName` | optional; trim; max 200 |
| `organizationUrl` | optional; trim; valid URL or empty |
| `organizationLogo` | optional; trim; valid URL or empty |
| `organizationPhone` | optional; trim; max 50 |
| `organizationEmail` | optional; trim; valid email or empty |
| `customOrganizationSchema` | optional; if non-empty must parse as JSON **object** (not array/primitive/string) |
| `jsonLd` | optional; if non-empty must parse as valid JSON (object or array) |
| `robots` | unchanged enum |

Use existing `optionalText` helper where applicable.

### JSON validation — both layers required

Invalid JSON must be rejected at **save time** (API + UI). The metadata layer must not be responsible for catching user input errors.

**API:** `seoSchema` rejects non-parseable or wrong-shape values → `400` validation error.

**UI:** react-hook-form + zod resolver shows field-level errors before submit; server errors surfaced on failed PATCH.

Examples:

| Input | Result |
|-------|--------|
| `{"@context":"https://schema.org","@type":"Organization"}` | Pass |
| `hello world` | Fail — not valid JSON |
| `"hello"` | Fail — JSON primitive, not object |
| `[]` | Fail for `customOrganizationSchema` — array, not object |
| `` (empty) | Pass — treated as unset |

Apply the same parse rules to `jsonLd` (object or array allowed).

### Organization form vs override

- Form fields are independent of `customOrganizationSchema`.
- When `customOrganizationSchema` is non-empty, metadata layer uses override only (form values stored but not emitted).
- Saving form + override together is allowed (override wins at runtime).

---

## 3. Organization JSON-LD Generation

New helper: `lib/seo/organization-schema.ts`

### Priority

```txt
customOrganizationSchema (parsed JSON object)
        ↓ (if empty/invalid at runtime → skip to generated)
Generated Organization schema from form fields
        ↓ (if insufficient fields → null)
No organization script tag
```

### Generated schema shape

Emit when **`organizationName` and `organizationUrl`** are both non-empty:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "<organizationName>",
  "url": "<organizationUrl>",
  "logo": "<organizationLogo>",
  "telephone": "<organizationPhone>",
  "email": "<organizationEmail>"
}
```

Omit optional properties when empty (do not emit `"logo": ""`).

### Runtime safety

- Save-time validation prevents new invalid JSON from entering the database.
- Legacy invalid rows (pre-V1) → log warning in dev; fall back to generated; if generated also empty → omit tag.
- Never throw from metadata/layout rendering due to bad JSON.

### Coexistence with `jsonLd`

- `jsonLd` (Advanced) and Organization schema are **separate** `<script type="application/ld+json">` tags.
- Both may render simultaneously. User is responsible for not duplicating Organization in both places.
- UI copy under Advanced should note: *Organization schema is managed in the Organization section unless overridden below.*

---

## 4. Metadata Injection

### Verification — `generateMetadata()` in `app/layout.tsx`

Add to returned `Metadata`:

```ts
verification: {
  google: seo.googleVerification || undefined,
  other: seo.bingVerification
    ? { "msvalidate.01": seo.bingVerification }
    : undefined,
},
```

Empty strings → omit (undefined).

### Robots — already implemented

Keep existing behavior:

- `generateMetadata().robots` from `seo.robots`
- `app/robots.ts` disallow all when `noindex,nofollow`

**UI change only:** replace Robots `<select>` with a boolean **Allow search indexing** toggle mapped to:

| Toggle | Stored value |
|--------|--------------|
| On (default) | `index,follow` |
| Off | `noindex,nofollow` |

Show helper text: *Turn off for staging, demo, or pre-launch sites.*

### JSON-LD scripts — `RootLayout` body

Render order:

1. Organization schema script (from `resolveOrganizationJsonLd(seo)`)
2. Global `jsonLd` script (existing — raw string inject when non-empty)

```tsx
{organizationJsonLd ? (
  <script type="application/ld+json" ... JSON.stringify(organizationJsonLd) />
) : null}
{seo.jsonLd ? (
  <script type="application/ld+json" ... seo.jsonLd />
) : null}
```

Prefer `JSON.stringify` for generated/custom object paths; keep raw inject for `jsonLd` textarea (existing behavior).

---

## 5. API

### Route

Keep `app/api/seo/route.ts` — no new endpoint.

### GET

Unchanged shape; response includes all `SeoSettings` keys.

Auth: `checkModuleAccess("seo-settings")` **after** permission split (see §7).

### PATCH

Flow (mirror `app/api/settings/route.ts`):

```txt
checkModuleAccess("seo-settings")
  → seoSchema.safeParse(body)
  → before = await getSeoSettings()
  → saveSettings(parsed.data)
  → auditSeoSettingsUpdate({ user, before, after })
  → return { seo: parsed.data }
```

During transition, `checkModuleAccess("seo")` may remain temporarily; final state uses `seo-settings`.

---

## 6. Audit Integration

### Helper

Add to `lib/settings-audit.ts` (or `lib/seo-settings-audit.ts` if file size warrants):

```ts
export async function auditSeoSettingsUpdate({
  user,
  before,
  after,
}: SettingsUpdateAuditInput): Promise<void>
```

Audit handler input:

| Field | Value |
|-------|-------|
| `action` | `AuditAction.UPDATE` |
| `module` | `AuditModule.SEO` |
| `entityType` | `SeoSettings` |
| `entityName` | `SEO Settings` |
| `before` / `after` | full SEO settings snapshots (handler input only) |
| `severity` | default INFO |

**Persisted `changes` column — changed fields only.** `createAuditLog()` calls `buildDiff(before, after)` which **ignores unchanged values**. Only keys whose values differ appear in the stored diff.

Example — user changes only `organizationPhone`:

```json
{
  "organizationPhone": {
    "before": "",
    "after": "02-123-4567"
  }
}
```

Unchanged keys (`metaTitle`, `metaDescription`, etc.) must **not** appear in `changes`.

If no fields changed, `changes` is `null` (no diff noise).

Add to `LONG_TEXT_KEYS` in `lib/audit-diff.ts`:

```ts
"jsonLd",
"customOrganizationSchema",
```

So large JSON edits show `{ changed: true }` in Audit Logs UI (consistent with other long text).

### Fail policy

Fail-open — audit failure must not block SEO save (inherited from Audit V1).

### Tests

Mirror `tests/settings-audit.test.ts`:

- Actor + before/after passed correctly
- Module = SEO, entity labels correct
- Null actor allowed
- Long-text diff behavior for `jsonLd` / `customOrganizationSchema`
- Single-field change produces diff with **only that field** (not full SEO dump)

---

## 7. Navigation & Permissions

### Navigation target

**ตั้งค่าระบบ**

```txt
├── ตั้งค่าทั่วไป        /admin/settings
├── ภาษาและรูปแบบ        /admin/settings/localization
├── SEO                  /admin/settings/seo          ← new location
├── ระบบป้องกันสแปม      /admin/recaptcha
└── Audit Logs           /admin/audit-logs
```

Remove SEO Settings entry from **การตลาดและ SEO** section. That section keeps:

```txt
การตลาดและ SEO
└── จัดการ SEO           /admin/seo/workspace
```

Update `lib/admin-navigation.ts`:

- Add item `id: "seo-settings"`, `href: "/admin/settings/seo"`, under `system-settings`
- Remove `/admin/seo/settings` from `seo` item `excludeActivePaths` (no longer needed)
- `seo` workspace item unchanged

### Permissions

Register in `lib/admin-permissions.ts`:

```ts
{ id: "seo-settings", routePrefix: "/admin/settings/seo", roles: ADMIN_ROLES }
```

Add `"seo-settings"` to `AdminModuleId` in `types/index.ts`.

Update API/page guards:

| Surface | Module |
|---------|--------|
| `/admin/settings/seo` | `seo-settings` |
| `GET/PATCH /api/seo` | `seo-settings` |
| `/admin/seo/workspace` | `seo` (unchanged) |

### Legacy redirect — 308 Permanent

`app/admin/seo/settings/page.tsx` → replace page content with server-side **308 Permanent Redirect**:

```ts
import { permanentRedirect } from "next/navigation";

export default function LegacySeoSettingsPage() {
  permanentRedirect("/admin/settings/seo");
}
```

Requirements:

- Use Next.js `permanentRedirect()` (HTTP **308**), **not** client-side `redirect()` from `useRouter` or `<meta refresh>`
- Bookmarks to `/admin/seo/settings` continue to work
- Old SEO workspace links that pointed at settings resolve cleanly
- Analytics / server logs record a single canonical path

Do not delete the legacy route file until redirect is verified in QA.

### Audit Logs UI

Update `AuditModuleBadge` `MODULE_CLASSES` map to include `SEO` styling (follow `LOCALIZATION` or `SETTINGS` palette).

---

## 8. Settings UI

### Page

Create `app/admin/settings/seo/page.tsx` — mirror Localization page structure:

- Breadcrumb label: **Settings**
- Title: **SEO**
- Description: global metadata, verification, organization schema, robots
- Link to SEO Workspace: *Open SEO Workspace* → `/admin/seo/workspace`

### Form layout

Refactor `features/settings/seo-form.tsx` into sectioned single-page form (no sub-routes):

```txt
[ General SEO ]
  Meta title
  Meta description
  Canonical URL
  Open Graph image
  Twitter card

[ Search Indexing ]
  Allow search indexing (toggle → robots)

[ Verification ]
  Google site verification
  Bing site verification
  Helper: paste content value from Search Console / Bing Webmaster

[ Organization ]
  Name *
  URL *
  Logo URL
  Phone
  Email
  Helper: Name + URL required to publish Organization schema

[ Advanced ]
  Custom Organization Schema (JSON textarea, monospace)
  Global JSON-LD Override (existing jsonLd textarea)
  Warning copy about duplication with Organization section
```

`*` = required **for generation only** (not form validation blocking save).

### UX details

- Single **Save SEO** button (one PATCH for all sections)
- Success/error messages unchanged pattern
- Optional: live JSON preview for generated organization schema (read-only, client-side) — **nice-to-have, not required V1**
- Verification inputs: plain text, placeholder examples
- Empty verification → no meta tags emitted

### Component split (recommended)

```txt
features/settings/seo-form.tsx           — shell + submit
features/settings/seo-general-section.tsx
features/settings/seo-verification-section.tsx
features/settings/seo-organization-section.tsx
features/settings/seo-advanced-section.tsx
```

Keep files focused; follow existing form styling from `settings-form.tsx` / `localization-form.tsx`.

---

## 9. Acceptance Criteria

### Verification

- [ ] Saving Google verification code emits `<meta name="google-site-verification" content="…" />` on public pages
- [ ] Saving Bing verification code emits `<meta name="msvalidate.01" content="…" />`
- [ ] Empty codes → no verification meta tags

### Organization schema

- [ ] Name + URL filled → Organization JSON-LD script on all public pages
- [ ] Optional logo/phone/email included only when set
- [ ] Non-empty valid `customOrganizationSchema` overrides generated output
- [ ] Invalid custom JSON at save → validation error (400)
- [ ] Invalid custom JSON already stored → runtime fallback to generated (no crash)

### Robots

- [ ] Toggle ON → `index,follow` metadata emitted
- [ ] Toggle OFF → `noindex,nofollow` metadata emitted

Note: `app/robots.ts` already maps the same `robots` key to `/robots.txt` allow/disallow. That behavior is **pre-existing** — V1 does not expand scope to re-verify or redesign robots.txt generation.

### Advanced JSON-LD

- [ ] Existing `jsonLd` textarea still injects when set
- [ ] Can coexist with Organization script tag

### Audit

- [ ] PATCH SEO settings creates `AuditModule.SEO` / `UPDATE` row
- [ ] Diff shows changed fields (e.g. `googleVerification: { before, after }`)
- [ ] Visible in Audit Logs UI with module filter **SEO**

### Navigation & access

- [ ] SEO Settings visible under ตั้งค่าระบบ for ADMIN / SUPER_ADMIN
- [ ] Hidden for EDITOR / MARKETING / VIEWER
- [ ] `/admin/seo/settings` returns **308** to `/admin/settings/seo`
- [ ] SEO Workspace unchanged under การตลาดและ SEO

### Regression

- [ ] Existing SEO keys load/save without data loss
- [ ] SEO Workspace unaffected
- [ ] Public page metadata (title, description, OG, Twitter) unchanged behavior

---

## 10. Implementation Phases

### Phase 1 — Keys, types, validation

```txt
lib/settings.ts          — composed SEO_KEYS + DEFAULT_SEO
validators/content.validator.ts — extended seoSchema
tests                    — validator tests for new fields
```

No Setting table migration.

### Phase 2 — Audit enum + helper

```txt
prisma/schema.prisma     — AuditModule.SEO
prisma migrate
lib/settings-audit.ts    — auditSeoSettingsUpdate
lib/audit-diff.ts        — LONG_TEXT_KEYS
tests/settings-audit.test.ts (or seo-settings-audit.test.ts)
features/audit-logs/audit-log-badges.tsx — SEO badge color
```

### Phase 3 — API wiring

```txt
app/api/seo/route.ts     — before/after audit on PATCH
lib/admin-permissions.ts — seo-settings module
types/index.ts           — AdminModuleId
tests/api-authorization-guard.test.ts — update expectations
```

### Phase 4 — Settings UI + navigation

```txt
app/admin/settings/seo/page.tsx
features/settings/seo-form.tsx (+ section components)
app/admin/seo/settings/page.tsx — redirect
lib/admin-navigation.ts
```

### Phase 5 — Metadata injection

```txt
lib/seo/organization-schema.ts
app/layout.tsx           — verification + organization scripts
tests/organization-schema.test.ts
tests/metadata or layout integration tests (if pattern exists)
```

### Phase 6 — QA + smoke test

Manual checklist from §9 plus:

```bash
npm test
npm run build
```

Verify staging toggle on a non-production deploy before go-live.

---

## 11. Test Plan

### Unit

| Area | File |
|------|------|
| Organization generation | `tests/organization-schema.test.ts` |
| Priority (custom vs generated) | same |
| SEO schema validation | extend `tests/content-validator.test.ts` |
| Audit handler | extend `tests/settings-audit.test.ts` |
| Audit diff long text | `tests/audit-log.test.ts` or settings-audit |

### Integration / guard

| Area | File |
|------|------|
| API auth module | `tests/api-authorization-guard.test.ts` |
| SEO PATCH creates audit row | optional integration test |

### Manual smoke

1. Set Google + Bing codes → view page source
2. Fill Organization form → validate JSON-LD in source
3. Paste custom Organization JSON → confirm override
4. Toggle indexing off → check meta robots (`noindex,nofollow`)
5. Save SEO → confirm row in Audit Logs with diff
6. Confirm EDITOR cannot access `/admin/settings/seo`

---

## 12. Future Considerations (post-V1)

```txt
SeoSettings dedicated model (if SEO config outgrows key-value)
Search Console API integration
Sitemap crawl monitoring
Per-locale SEO overrides
Organization @graph builder UI
Live structured-data preview / Rich Results test link
```

---

## Appendix — File Touch List

| File | Action |
|------|--------|
| `lib/settings.ts` | Modify |
| `lib/seo/organization-schema.ts` | Create |
| `lib/settings-audit.ts` | Modify |
| `lib/audit-diff.ts` | Modify |
| `lib/admin-navigation.ts` | Modify |
| `lib/admin-permissions.ts` | Modify |
| `validators/content.validator.ts` | Modify |
| `app/layout.tsx` | Modify |
| `app/api/seo/route.ts` | Modify |
| `app/admin/settings/seo/page.tsx` | Create |
| `app/admin/seo/settings/page.tsx` | Redirect |
| `features/settings/seo-form.tsx` | Refactor |
| `features/settings/seo-*-section.tsx` | Create (4) |
| `features/audit-logs/audit-log-badges.tsx` | Modify |
| `prisma/schema.prisma` | Modify (AuditModule only) |
| `types/index.ts` | Modify |
| `tests/*` | Extend |

**Untouched:** SEO Workspace, sitemap routes, content-level SEO assistant, `app/robots.ts` logic (unless copy tweak).
