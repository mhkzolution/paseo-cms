# Audit Infrastructure V1 — Pre-Merge Checklist

**Branch:** `feat/media-library-v2` (contains Audit V1 commits + prior Media work)  
**Status:** Code complete · **APPROVED WITH MANUAL SMOKE REQUIRED**

## Commits (Audit V1)

```txt
cbdd8bd feat(audit): add AuditLog schema and migration
8a8c883 feat(audit): add smart buildDiff helper
066da18 feat(audit): add createAuditLog helper and request context adapter
ebcadb6 feat(audit): record LOGIN and LOGOUT via NextAuth events
f774d1d feat(audit): audit site settings and localization updates
27b25f7 feat(audit): wire posts events promotions audit call-sites
```

## Automated verification

```bash
node --import tsx --test \
  tests/audit-*.test.ts \
  tests/auth-audit.test.ts \
  tests/settings-audit.test.ts \
  tests/content-audit.test.ts \
  tests/audit-content.test.ts
```

Expected: **53/53 pass**

## Priority 1 — Manual smoke (required before merge)

1. Start app: `npm run dev`
2. Login as admin (`admin@thepaseo.co.th` / seed password unless changed)
3. Create a Post (draft)
4. Edit title only → save
5. Publish
6. Unpublish (status → Draft)
7. Soft-delete the Post

Then:

```sql
SELECT action, module, entityName, severity, createdAt
FROM audit_logs
ORDER BY createdAt DESC
LIMIT 20;
```

Expected sequence (at least):

```txt
LOGIN      AUTH
CREATE     POSTS
UPDATE     POSTS
PUBLISH    POSTS
UNPUBLISH  POSTS
DELETE     POSTS   (severity WARNING)
```

## Priority 2 — NextAuth LOGIN uniqueness

After **one** successful browser login:

```sql
SELECT COUNT(*) FROM audit_logs
WHERE action = 'LOGIN' AND createdAt > NOW() - INTERVAL 5 MINUTE;
```

Expected: **1** (not 2–3). If duplicates appear, note provider/callback path before merging.

## Priority 3 — Migration status (for MR description)

Local note (2026-08-12):

```txt
npx prisma migrate status

- audit migration folder present: 20260812120000_add_audit_logs
- marked applied on this dev DB via migrate resolve after db execute
- Pre-existing drift remains (unrelated to Audit):
  - DB has 20260625083733_initial_schema not in repo
  - Pending locally vs DB: add_category_scope, add_category_post_kind, media_v2_metadata_fields
- Audit migration itself is NOT the cause of migrate dev failures
```

Paste a fresh `npx prisma migrate status` into the MR when opening it.

## Out of scope (Sprint 2)

```txt
Audit Logs UI
Filters / Drawer / CSV
RESTORE / Pages / Media / Users wiring
```

## Suggested MR summary bullets

- Append-only `audit_logs` with enums + smart diff helper (fail-open)
- Auth LOGIN/LOGOUT, Settings + Localization UPDATE, Posts/Events/Promotions CREATE/UPDATE/PUBLISH/UNPUBLISH/DELETE
- 53 unit tests; manual smoke checklist attached
- Note pre-existing Prisma migration drift separately from Audit V1
