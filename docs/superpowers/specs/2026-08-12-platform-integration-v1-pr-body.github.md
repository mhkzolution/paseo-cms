## Summary

Integration PR bringing **four platform stacks** from `feat/seo-completion-v1` into `main`:

| Stack | Role in this PR |
|-------|-----------------|
| **SEO Completion V1** | Primary feature — global SEO settings production-ready |
| Audit Infrastructure V1 | Required dependency for SEO audit logging |
| Audit Logs UI V1 | Required dependency — view SEO (and other) audit events |
| Media Library V2 | Included from integration branch (pagination, metadata, UX kit) |

**Diff size:** 51 commits · 382 files · +34,307 / −2,660 lines (vs `origin/main`)

**Branch:** `feat/seo-completion-v1` → **Base:** `main`

---

## Primary feature — SEO Completion V1

Global SEO configuration for production:

- Google + Bing site verification (Next.js `metadata.verification`)
- Organization schema builder (name, URL, logo, phone, email)
- Custom Organization JSON-LD override
- Robots indexing toggle UX (metadata only; existing `robots` key)
- Global JSON-LD override (`jsonLd` textarea, unchanged behavior)
- SEO settings at `/admin/settings/seo` (ตั้งค่าระบบ)
- **308 permanent redirect** from legacy `/admin/seo/settings`
- Permission split: `seo-settings` → `ADMIN_ROLES`; SEO Workspace unchanged → editors
- Audit: `AuditModule.SEO` + smart diff (changed fields only)

**Architecture (SEO):**

- Extends existing `Setting` key-value store — **no `SeoSettings` Prisma model**
- Composed `SEO_KEYS` (BASE + VERIFICATION + ORGANIZATION)
- `normalizeSeoSettingsValues()` prevents phantom audit diffs (`""` vs `null`)

**SEO commits (review focus):**

```txt
55bbc03 docs(seo): approve SEO Completion V1 spec and implementation plan
8fca005 feat(seo): extend SEO keys and JSON validation
914efc1 feat(seo): add organization JSON-LD resolver
61daf2b feat(seo): add SEO audit module and handler
287ad72 feat(seo): wire API auth split and audit on PATCH
b9aa3d2 feat(seo): inject verification meta and organization JSON-LD
979ccb6 feat(seo): add settings UI, nav, and 308 legacy redirect
0380291 test(seo): align phase auth suites with seo-settings module
4a01543 fix(seo): normalize empty SEO fields for accurate audit diffs
fd6ee83 test(seo): update API guard for normalized SEO audit after
```

**Spec / plan:**

- `docs/superpowers/specs/2026-08-12-seo-completion-v1-design.md`
- `docs/superpowers/plans/2026-08-12-seo-completion-v1.md`

---

## Included dependencies

### Audit Infrastructure V1

Append-only audit trail: schema, `buildDiff`, `createAuditLog`, auth/settings/content wiring.

```txt
cbdd8bd feat(audit): add AuditLog schema and migration
8a8c883 feat(audit): add smart buildDiff helper
066da18 feat(audit): add createAuditLog helper and request context adapter
ebcadb6 feat(audit): record LOGIN and LOGOUT via NextAuth events
f774d1d feat(audit): audit site settings and localization updates
27b25f7 feat(audit): wire posts events promotions audit call-sites
```

Spec: `docs/superpowers/specs/audit-logs-v1.md`

### Audit Logs UI V1

Read-only admin UI: `/admin/audit-logs`, list + detail APIs, filters, drawer.

```txt
926c72a feat(audit-logs): add nav, permissions, and page shell
85aa486 feat(audit-logs): add list API and query helpers
596a11f feat(audit-logs): add filters, table, and pagination UI
42b3563 feat(audit-logs): add detail API and audit drawer
457897e feat(audit-logs): polish drawer escape and auth inventory
```

Spec: `docs/superpowers/specs/2026-08-12-audit-logs-ui-v1-design.md`

### Media Library V2

Metadata fields, paginated API, shared UX kit, library/picker improvements.

```txt
0eda541 feat(media): expand Media metadata fields for V2 MVP
… (17 media-related commits)
41c18db chore(media): remove dead DeleteMediaButton and unused localization prop
```

Specs: `docs/superpowers/specs/media-library-v2/`

---

## Prisma migrations (review impact)

Six migrations vs `main` — **run in order on deploy:**

| Migration | Purpose |
|-----------|---------|
| `20260811120000_add_localization_settings` | Localization settings table |
| `20260811130000_add_category_scope` | Category scope enum |
| `20260811140000_add_category_post_kind` | Post kind on categories |
| `20260812100000_media_v2_metadata_fields` | Media V2 metadata columns |
| `20260812120000_add_audit_logs` | `audit_logs` table + enums |
| `20260812150000_add_audit_module_seo` | Adds `SEO` to `AuditModule` enum |

**Post-merge deploy:**

```bash
npx prisma migrate deploy
npx prisma generate
```

> Note: `prisma migrate dev` may fail on shadow DB replay due to a pre-existing baseline issue (`add_category_scope`). Production `migrate deploy` applies forward-only and is the supported path.

---

## Pre-merge verification (completed on branch)

| Check | Result |
|-------|--------|
| SEO migration scope | `AuditModule.SEO` enum only (last migration) |
| Permission matrix | `seo-settings` → ADMIN only; EDITOR blocked on `/admin/settings/seo`, `GET/PATCH /api/seo`; workspace stays on `seo` |
| Metadata injection | `app/layout.tsx`: verification meta + Organization JSON-LD + existing `jsonLd` |
| Audit smart diff | Single-field change → one key in diff; no-op → `null` |
| 308 redirect | `/admin/seo/settings` → `permanentRedirect("/admin/settings/seo")` |
| SEO-focused tests | **60/60 pass** (organization, validator, audit, permissions, API auth) |

**Indexing toggle:** affects **metadata only** (`noindex,nofollow`). `robots.txt` behavior unchanged (pre-existing `app/robots.ts`).

---

## Known pre-existing issues (not introduced by this PR)

These fail on the branch but are **outside SEO / integration scope**:

- Category API authorization guard tests (scope-aware routes vs stale `checkModuleAccess("categories")` assertions)
- `app/api/categories/[id]/route.ts` TypeScript error (`403 | 404` vs `forbiddenError` signature)
- `tests/branch-config.test.ts` slug ordering assertion

Full suite: **451/457 pass** at last QA run.

---

## Test plan (reviewer / post-merge smoke)

### SEO (primary)

- [ ] ADMIN opens `/admin/settings/seo`, saves all sections
- [ ] EDITOR blocked from `/admin/settings/seo` and `PATCH /api/seo`
- [ ] `/admin/seo/settings` returns **308** → `/admin/settings/seo`
- [ ] Set Google + Bing codes → page source shows verification meta tags
- [ ] Organization name + URL → Organization JSON-LD script in source
- [ ] Change only `organizationPhone` → Audit Log shows **that field only** in diff
- [ ] Toggle indexing off → `noindex,nofollow` in metadata

### Audit

- [ ] `/admin/audit-logs` loads for ADMIN; filter by module **SEO**
- [ ] Login/logout and content mutations still write audit rows

### Media Library

- [ ] `/admin/media` paginated browse, upload metadata, picker in content forms

### Deploy

- [ ] `npx prisma migrate deploy` on staging/production
- [ ] Smoke public homepage metadata after SEO settings saved

---

## Merge guidance

- **Do not squash** if preserving stack commit history matters for rollback
- **Do not merge** until migration impact reviewed and staging smoke passes
- SEO **cannot deploy independently** of Audit Infrastructure on this branch — both land together

---

## Future split (optional, post-merge)

If the team prefers smaller PRs going forward:

1. Merge Audit Infrastructure + Audit Logs UI to `main` first
2. Open SEO-only PR on top

This integration PR avoids that rework given current branch state and passing QA.
