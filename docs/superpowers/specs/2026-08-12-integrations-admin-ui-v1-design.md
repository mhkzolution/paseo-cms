# Integrations Admin UI V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Foundation MVP (`feat/integrations-foundation-v1` — settings keys, service, API, audit, schema)  
**Scope:** Admin settings page + navigation + module identity wiring (UI layer)

## Goal

Give `SUPER_ADMIN` and `ADMIN` a production Integrations settings screen under System settings so they can configure:

- Google Analytics 4 Measurement ID
- Google Tag Manager Container ID
- Meta Pixel ID
- LINE Official Account ID

Values persist through the existing Foundation API. No runtime script injection in this PR.

## Architecture

**Approach 1 — SEO Settings clone**

```txt
Browser
  ↓
/admin/settings/integrations  (Server Component)
  ├─ requireModuleAccess("integrations")
  ├─ getIntegrationSettings()
  └─ <IntegrationsForm defaultValues={...} />

IntegrationsForm (Client)
  ├─ react-hook-form + integrationSchema
  ├─ Analytics / GTM / Meta / LINE sections
  └─ PATCH /api/settings/integrations  (single save)
        ↓
  Foundation
  ├─ saveIntegrationSettings (trim)
  └─ auditIntegrationSettingsUpdate (AuditModule.SETTINGS)
```

Consistency with `/admin/settings/seo` outweighs DRY. Each integration section is a separate file so future fields (debug mode, CAPI, etc.) do not force a config-driven abstraction.

## Decisions

| Topic | Choice |
|-------|--------|
| UI pattern | SEO Settings clone (page → form → sections → single Save) |
| Route | `/admin/settings/integrations` |
| Nav label | `Integrations` |
| Nav group | ตั้งค่าระบบ (after SEO) |
| Permission module id | `integrations` (identity only) |
| Roles | `ADMIN_ROLES` (`SUPER_ADMIN`, `ADMIN`) — same as settings |
| Page auth | `requireModuleAccess("integrations")` |
| API auth | `checkModuleAccess("integrations")` (update Foundation route in this PR) |
| Audit | Keep `AuditModule.SETTINGS` |
| LINE field | OA ID only (`@thepaseo`) — key `lineOaId` |
| Format validation | None in V1 (existing `integrationSchema`: optional strings + trim on save) |
| Connection test | None |
| Runtime injection | Out of scope (PR #3+) |

## Non-Goals

```txt
No runtime GA4 / GTM / Meta Pixel script injection
No LINE OA CTA / footer / widget surfaces
No format validation (G-, GTM-, numeric Pixel, @ prefix enforce)
No Test Connection / Verify buttons
No status badges for “configured”
No separate Save per section
No tabs / sub-routes per integration
No AuditModule.INTEGRATIONS enum / migration
No EDITOR / MARKETING access
No E2E / visual regression suite
```

---

## 1. Navigation & Permissions

### Nav

Add under `system-settings` in `lib/admin-navigation.ts`:

```txt
ตั้งค่าทั่วไป
ภาษาและรูปแบบ
SEO
Integrations          ← new
ระบบป้องกันสแปม
Audit Logs
```

- `id`: `integrations`
- `label`: `Integrations`
- `href`: `/admin/settings/integrations`
- Update “ตั้งค่าทั่วไป” `excludeActivePaths` to include `/admin/settings/integrations` (alongside localization + seo)

### Permission registry

Add to `AdminModuleId`, `ADMIN_MODULE_PERMISSIONS`:

```txt
id: integrations
routePrefix: /admin/settings/integrations
roles: ADMIN_ROLES
```

**Note:** This is module identity for navigation, middleware longest-prefix matching, and auth registry — not a new business RBAC split. Roles match `settings` exactly.

### Auth wiring

| Layer | Call |
|-------|------|
| Page | `requireModuleAccess("integrations")` |
| API | `checkModuleAccess("integrations")` |

Update `app/api/settings/integrations/route.ts` from `"settings"` → `"integrations"` in this PR so page and API share one module identity.

**Reviewer note:** This is a breaking authorization change for the integrations endpoint. The route path remains unchanged (`/api/settings/integrations`). Only the module identity checked by `checkModuleAccess` changes.

### Audit

Unchanged: `auditIntegrationSettingsUpdate` continues to use `AuditModule.SETTINGS`. Permission module ≠ audit module.

---

## 2. UI

### Page chrome

- Title: **Integrations**
- Subtitle (TH): `จัดการการเชื่อมต่อบริการภายนอกและระบบติดตามข้อมูล`
- Layout: match SEO (`flex flex-col gap-6`, form `max-w-4xl`)

### File structure

```txt
app/admin/settings/integrations/page.tsx

features/settings/
├─ integrations-form.tsx
├─ integrations-analytics-section.tsx
├─ integrations-tag-manager-section.tsx
├─ integrations-meta-section.tsx
└─ integrations-line-section.tsx
```

Prefer visual consistency with SEO section cards. Reuse SEO primitives only when the import stays light; otherwise clone the visual pattern locally. Visual consistency beats component coupling in V1.

### Sections

| Section title | Description | Field key | Label | Placeholder | Help |
|---------------|-------------|-----------|-------|-------------|------|
| Analytics | Configure Google Analytics 4 tracking for your website. | `gaMeasurementId` | Measurement ID | `G-XXXXXXXXXX` | GA4 Measurement ID |
| Tag Manager | Configure Google Tag Manager container injection. | `gtmContainerId` | Container ID | `GTM-XXXXXXX` | GTM Container ID |
| Meta | Configure Meta Pixel tracking for marketing analytics. | `metaPixelId` | Pixel ID | `123456789012345` | Meta Pixel ID |
| LINE | Configure your LINE Official Account identifier. | `lineOaId` | LINE OA ID | `@thepaseo` | Enter your LINE Official Account ID including the `@` prefix. Example: `@thepaseo` |

### Save flow

- Single button: **Save Integrations**
- Single `PATCH /api/settings/integrations` with the current form state (API already merges partial updates; do not require a special “send all keys” rule beyond what RHF submits)
- Feedback: inline success / error (SEO pattern)
  - Success: `Integrations settings saved.`
  - Error: API `error` string or generic fallback
- Submitting state via existing `Button` `isLoading`

### Validation

Client + server continue to use existing `integrationSchema` (optional strings). Persistence trims via `saveIntegrationSettings`. No new format rules.

---

## 3. Data / API contract

Unchanged response / body shape from Foundation:

```json
{
  "gaMeasurementId": "",
  "gtmContainerId": "",
  "metaPixelId": "",
  "lineOaId": ""
}
```

Page loads via `getIntegrationSettings()`. Form submits the same object.

**Only API change in this PR:** auth module string `"settings"` → `"integrations"`.

---

## 4. Tests

Required in this PR:

```txt
✅ navigation config includes Integrations link (order / href / label)
✅ AdminModuleId + permission registry uniqueness
✅ pathname /admin/settings/integrations resolves to integrations module
✅ excludeActivePaths on ตั้งค่าทั่วไป includes integrations path
✅ page auth wiring: requireModuleAccess("integrations")
✅ API authorization guard: checkModuleAccess("integrations")
✅ audit wiring on PATCH remains (user / before / after)
```

Not required:

```txt
❌ New API behavior / persistence tests (Foundation covers)
❌ E2E browser tests
❌ Format-validation tests
❌ Visual regression
```

### Known issues (parent branch)

This PR does not introduce new repo-wide lint/build failures. Existing failures on the target branch (unrelated ESLint; categories route typecheck) remain out of scope.

---

## 5. Implementation order

1. Add `integrations` to types + permission registry + nav (+ excludeActivePaths)
2. Update API route auth to `integrations`
3. Build page + form + four sections
4. Update auth/nav/permission tests + API guard expectations
5. Manual smoke: open page as ADMIN, save values, confirm reload + audit entry

## 6. Branch / PR

- Branch from `feat/integrations-foundation-v1` (or continue stacked commits)
- Base PR: `feat/integrations-foundation-v1` (or `feat/seo-completion-v1` once Foundation is merged into it)
- Title suggestion: `feat(integrations): add integrations admin settings UI`

## 7. Follow-ups (not this PR)

```txt
PR #3  Runtime Tracking (GA4 / GTM / Meta Pixel injection)
PR #4  LINE OA Surfaces (CTA / footer / contact)
Later   Format validation, connection tests, AuditModule.INTEGRATIONS
```
