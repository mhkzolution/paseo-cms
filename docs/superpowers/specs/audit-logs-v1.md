# Audit Infrastructure V1 Design

**Date:** 2026-08-12  
**Status:** Approved for implementation  
**Scope:** Sprint 1 — schema, helpers, auth/settings/content wiring (no UI)

## Goal

Add an append-only audit trail so The Paseo CMS starts recording real operational history immediately: who did what, to which entity, with a compact smart diff. Prefer collecting useful data in Sprint 1 over building an Audit Logs UI.

## Sprint scope

### In scope

```txt
✅ Prisma enums + AuditLog model + migration
✅ lib/audit-diff.ts + lib/audit-log.ts
✅ lib/audit-request.ts (thin Next.js adapter only)
✅ NextAuth LOGIN / LOGOUT
✅ Site Settings + Localization Setting
✅ Posts / Events / Promotions (CREATE, UPDATE, PUBLISH, UNPUBLISH, DELETE)
```

### Out of scope

```txt
❌ Audit Logs UI / menu / drawer / JSON viewer
❌ CSV export / advanced filters / pagination API
❌ Pages / Media / Users / Introduction route wiring
❌ RESTORE call-site (enum reserved only)
❌ Failed-login audit
❌ Relation / nested / bulk diff
❌ Retention / purge jobs
❌ Prisma middleware / domain-service refactor
❌ CRITICAL entries in default severity map (Users/Permissions later)
```

## Decisions

| Topic | Choice |
|-------|--------|
| Architecture | Explicit call-site after successful mutation |
| Diff storage | Smart diff in `changes Json?` — never full `before`/`after` snapshots |
| Module / action typing | Prisma enums (`AuditModule`, `AuditAction`) |
| Severity | Default map + optional caller override |
| Soft delete | `DELETE` = set `deletedAt`; `RESTORE` = clear `deletedAt` (no physical delete) |
| Actor | Denormalized `userId` / `userName` / `userRole` — no FK to `User` |
| IP / User-Agent | Store from Sprint 1 (`ipAddress`, `userAgent`) |
| Fail policy | Fail-open — audit never fails the primary business operation |
| UI | Sprint 2 |

### Why not alternatives

- **Prisma middleware:** sees only `update()`, cannot distinguish `PUBLISH` / soft `DELETE` business intent.
- **Domain service layer first:** cleaner long-term, but requires large API refactor beyond Sprint 1.
- **Full snapshot audit:** Post/Event/Promotion `content` (@db.LongText) would inflate the DB on every typo fix.

---

## Section 1 — Schema

### Semantics

- `AuditLog` is **append-only**. No `updatedAt`, no `deletedAt`, no updates/deletes of audit rows.
- `DELETE` in audit = **soft delete** on the target entity.
- `RESTORE` = clear `deletedAt` (enum present; no Sprint 1 caller).

### Enums

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  RESTORE
  PUBLISH
  UNPUBLISH
  LOGIN
  LOGOUT
}

enum AuditModule {
  AUTH
  POSTS
  EVENTS
  PROMOTIONS
  PAGES
  SETTINGS
  LOCALIZATION
  MEDIA
  USERS
}

enum AuditSeverity {
  INFO
  WARNING
  CRITICAL
}
```

`PAGES` / `MEDIA` / `USERS` are forward-compatible module values. Sprint 1 does **not** add fake callers for them.

### Model

```prisma
/// Append-only system audit trail.
/// DELETE = soft delete (set deletedAt). RESTORE = clear deletedAt.
/// Never soft-delete or update AuditLog rows.
model AuditLog {
  id         String @id @default(uuid())

  userId     String?
  userName   String?
  userRole   Role?

  action     AuditAction
  module     AuditModule
  severity   AuditSeverity @default(INFO)

  entityId   String?
  entityType String?
  entityName String?
  entitySlug String?

  changes    Json?

  ipAddress  String?
  userAgent  String?

  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([module])
  @@index([action])
  @@index([severity])
  @@index([createdAt])
  @@index([module, createdAt])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

### Field notes

| Field | Purpose |
|-------|---------|
| `user*` | Historical actor snapshot; survives user deletion |
| `entityType` | Concrete type string, e.g. `"Post"`, `"LocalizationSetting"` |
| `entitySlug` | Stable identifier when titles change |
| `changes` | Smart diff only (see Section 2) |
| `ipAddress` / `userAgent` | Security context; stored even if UI does not show them yet |

---

## Section 2 — Helper API

### Files

```txt
lib/audit-diff.ts      → buildDiff()
lib/audit-log.ts       → createAuditLog(), getDefaultSeverity()
lib/audit-request.ts   → getAuditRequestContext()  (Next.js headers adapter only)
```

`audit-diff.ts` and `audit-log.ts` must remain **framework-agnostic** (no Next.js / Route Handler / `Headers` / `Request` imports).

### Smart diff rules

#### Ignore completely

```txt
createdAt
updatedAt
deletedAt
```

#### Mask (sensitive)

```txt
password
token
secret
apiKey
smtpPassword
```

Output:

```json
{
  "smtpPassword": {
    "changed": true,
    "masked": true
  }
}
```

#### Long-text marker

```txt
content
customJsonLd
metadata
schemaOverrides
robotsDirectives
```

Output:

```json
{
  "content": {
    "changed": true
  }
}
```

#### Normal fields

```json
{
  "title": {
    "before": "Summer Sale",
    "after": "Summer Sale 2026"
  }
}
```

#### Objects / arrays (V1)

Shallow compare only. If an object/array value changed, store the whole before/after values — do **not** recurse into nested diffs.

#### Empty result

`buildDiff()` returns `null` when there are no changes (not `{}`).

### Types

```ts
type AuditActor = {
  id: string
  name: string
  role?: Role | null
}

type AuditRequestContext = {
  ipAddress?: string | null
  userAgent?: string | null
}

type CreateAuditLogInput = {
  user?: AuditActor | null
  action: AuditAction
  module: AuditModule
  severity?: AuditSeverity
  entityId?: string | null
  entityType?: string | null
  entityName?: string | null
  entitySlug?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  changes?: Record<string, unknown> | null // escape hatch — skip buildDiff
  context?: AuditRequestContext | null
}
```

### `createAuditLog` flow

```txt
1. severity = input.severity ?? getDefaultSeverity(action)
2. changes  =
     input.changes
     ?? (input.before || input.after ? buildDiff(before, after) : null)
3. prisma.auditLog.create(...)
4. on error → console.error → do not throw
```

### Default severity map

```txt
DELETE  → WARNING
all other Sprint 1 actions → INFO
```

Caller may override with `severity`. `CRITICAL` has no default Sprint 1 actions; reserved for Users/Permissions later.

### LOGIN / LOGOUT

Do not call `buildDiff` when neither `before` nor `after` is provided → `changes = null`.

---

## Section 3 — Wiring

### Architecture

Explicit call-site **after** the primary mutation succeeds. No Prisma middleware. No shared DB transaction with the business write.

### Request context adapter

```ts
// lib/audit-request.ts
export function getAuditRequestContext(): AuditRequestContext
```

Reads IP / User-Agent from `next/headers`. Used only at call-sites / auth events.

### Actor source

API routes already receive `session` from `checkModuleAccess()` — map `session.user` into `AuditActor`.

### 3.1 Auth (`lib/auth.ts`)

| Event | Action | Module |
|-------|--------|--------|
| `signIn` | `LOGIN` | `AUTH` |
| `signOut` | `LOGOUT` | `AUTH` |

- **LOGIN:** actor required from `signIn` user payload.
- **LOGOUT:** **best effort**. NextAuth may not provide full user. If actor cannot be resolved, still write the row with `user: null`.
- Failed login is out of scope for Sprint 1.

### 3.2 Settings

| Route | Module | Action | entityType | entityName |
|-------|--------|--------|------------|------------|
| `PATCH /api/settings` | `SETTINGS` | `UPDATE` | `SiteSettings` | `Global Settings` |
| `PATCH /api/settings/localization` | `LOCALIZATION` | `UPDATE` | `LocalizationSetting` | `Localization` |

Always set `entityName` (never leave null for these rows).

### 3.3 Posts / Events / Promotions

| HTTP | Condition | Action |
|------|-----------|--------|
| `POST /api/{resource}` | create success | `CREATE` |
| `PATCH /api/{resource}/[id]` | status → `PUBLISHED` | `PUBLISH` |
| `PATCH` | `PUBLISHED` → `DRAFT` | `UNPUBLISH` |
| `PATCH` | otherwise | `UPDATE` |
| `DELETE /api/{resource}/[id]` | soft-delete success | `DELETE` |

#### Action resolution

```ts
function resolveContentAction(beforeStatus, afterStatus): AuditAction {
  if (beforeStatus !== "PUBLISHED" && afterStatus === "PUBLISHED") {
    return AuditAction.PUBLISH
  }
  if (beforeStatus === "PUBLISHED" && afterStatus === "DRAFT") {
    return AuditAction.UNPUBLISH
  }
  return AuditAction.UPDATE
}
```

`DRAFT → ARCHIVED` (and other non-publish transitions) remain `UPDATE`, never `UNPUBLISH`.

#### Entity metadata

```txt
entityId   = id
entityType = "Post" | "Event" | "Promotion"
entityName = title
entitySlug = slug
```

Load entity before soft-delete so name/slug are available.

`RESTORE` has no API in Sprint 1 — do not invent a caller.

### Content snapshot include / exclude

Snapshots passed to `before` / `after` must follow this list so call-sites stay consistent.

#### Include

```txt
title
slug
excerpt
subtitle
status
publishedAt
featuredImage

seoTitle
seoDescription
focusKeyword
canonicalUrl
noindex
nofollow
```

(Map SEO fields from the related SEO model / flattened save payload as available per content type.)

#### Exclude

```txt
content
tableOfContents
customJsonLd
metadata
schemaOverrides
robotsDirectives

tags
branches
faqs
images
relatedPosts
```

If an excluded or sensitive/long-text field is accidentally passed into `before`/`after`, `buildDiff` still applies Ignore / Mask / LongText rules as a safety net.

### Files to touch

```txt
prisma/schema.prisma
prisma/migrations/...

lib/audit-diff.ts
lib/audit-log.ts
lib/audit-request.ts
lib/auth.ts

app/api/settings/route.ts
app/api/settings/localization/route.ts

app/api/posts/route.ts
app/api/posts/[id]/route.ts
app/api/events/route.ts
app/api/events/[id]/route.ts
app/api/promotions/route.ts
app/api/promotions/[id]/route.ts
```

---

## Section 4 — Error Handling / Scope / Acceptance

### Error handling

**Policy (non-negotiable):**

```txt
Audit failures must never affect the primary business operation.
```

Example:

```txt
Post updated successfully
Audit insert failed

→ API returns 200
→ Error logged to server
```

| Case | Behavior |
|------|----------|
| Audit DB write fails | catch → `console.error` → do not throw |
| Empty diff | store `changes: null` |
| LOGOUT without actor | write row with null user fields |
| Missing request context | null `ipAddress` / `userAgent` allowed |
| Soft-delete target already missing | do not block DELETE response; skip or warn on audit |

No shared transaction between business mutation and audit insert.

### Acceptance criteria

**Schema**

- [ ] `AuditAction`, `AuditModule`, `AuditSeverity`, and `AuditLog` match this spec (including `entitySlug` and indexes)
- [ ] Migration applies on MySQL
- [ ] Documentation states `DELETE` = soft delete, `RESTORE` = clear `deletedAt`

**Helper**

- [ ] `buildDiff` implements ignore / mask / long-text / normal / empty→`null` / shallow object-array
- [ ] `createAuditLog` applies default severity, allows override, skips diff when no before/after, fail-open
- [ ] `audit-log.ts` / `audit-diff.ts` do not import Next.js

**Wiring**

- [ ] LOGIN always written on successful sign-in; LOGOUT best-effort
- [ ] Settings + Localization write `UPDATE` with fixed `entityName` values
- [ ] Posts / Events / Promotions support `CREATE`, `UPDATE`, `PUBLISH`, `UNPUBLISH`, `DELETE`
- [ ] `UNPUBLISH` only for `PUBLISHED → DRAFT`
- [ ] Snapshots follow include/exclude lists

**Smoke**

- [ ] Login creates one `LOGIN` / `AUTH` row
- [ ] Patch post title creates one `UPDATE` row with `title` diff
- [ ] Soft-delete post creates one `DELETE` / `WARNING` row
- [ ] **Single mutation creates exactly one audit row** (no duplicates from layered helpers/refactors)

### Suggested implementation phases (next step)

```txt
Phase 1 — Prisma schema + migration
Phase 2 — Helpers (audit-diff, audit-log, audit-request)
Phase 3 — Auth LOGIN / LOGOUT
Phase 4 — Settings + Localization
Phase 5 — Posts / Events / Promotions
Phase 6 — Smoke tests
```

UI work begins only after Sprint 1 has produced real rows in `audit_logs`.

---

## Sprint 2 preview (not in this deliverable)

```txt
System → Audit Logs
Columns: User, Role, Action, Module, Entity, Date
Filters: Date range, User, Action, Module, Severity
Search: Entity name / User name
Detail drawer: changes JSON, IP, User-Agent, timestamp
```

Design UX from real accumulated data, not speculative empty states.
