# Audit Logs UI V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — ready for implementation  

**Depends on:** Audit Infrastructure V1 (`docs/superpowers/specs/audit-logs-v1.md`) — shipped  
**Scope:** Sprint 2 — read-only admin UI + list/detail APIs over existing `audit_logs`

## Goal

Give `SUPER_ADMIN` and `ADMIN` a production Audit Logs screen under System settings so they can find who did what, to which entity, when — using real rows already produced by Audit Infrastructure V1.

## Architecture

**Approach 3 — Server list + client drawer fetch**

- Page / filters / table: server-driven via URL `searchParams` (shareable, refresh-stable, browser back/forward)
- Drawer: client component; on **View**, fetch `GET /api/admin/audit-logs/[id]`; discard detail on close; fetch again on reopen
- List API returns table metadata only (no `changes` / `ipAddress` / `userAgent`)
- Detail API returns full row for the drawer

```txt
/admin/audit-logs?...searchParams...
        │
        ▼
GET /api/admin/audit-logs   (or RSC query equivalent for initial paint)
        │
        ▼
Table
        │
      View
        │
        ▼
GET /api/admin/audit-logs/[id]
        │
        ▼
Drawer (Field List + optional JSON)
```

## Decisions

| Topic | Choice |
|-------|--------|
| UI level | Production (filters + drawer + JSON), not MVP-minimal, not Enterprise |
| Access | `SUPER_ADMIN` + `ADMIN` (`ADMIN_ROLES`) |
| Navigation | Under **ตั้งค่าระบบ** → Audit Logs |
| Route | `/admin/audit-logs` |
| Filters | Module, Action, Severity, Date Range, Search |
| Sort | `createdAt DESC, id DESC` |
| Pagination | Offset `page` + `pageSize` (default 50; options 25/50/100) |
| Table open | **View** button only (no row click) |
| Diff UI | Field list default + **View JSON** |
| API | List + Detail |
| Retention | None in V1 — Future Consideration only |

## Non-Goals

```txt
No CSV export
No Saved Views
No User filter dropdown / autocomplete
No row click / multi-select / bulk actions
No editor deep links from Entity
No Audit dashboard / analytics charts
No retention / purge UI or jobs
No field-label localization map (show raw keys)
No JSON tree search / colored line-diff / JSON export
No real-time websocket feed
No RESTORE action UI
No Pages / Media / Users module-specific deep UX
```

---

## 1. Navigation & Permissions

### Nav

Add under `system-settings` in `lib/admin-navigation.ts`:

```txt
ตั้งค่าระบบ
├── ตั้งค่าทั่วไป
├── ภาษาและรูปแบบ
├── ระบบป้องกันสแปม
└── Audit Logs          ← new
```

- `id`: `audit-logs`
- `href`: `/admin/audit-logs`
- Label (V1): `Audit Logs` (English ok; Thai label can follow existing bilingual pattern later)

### Permissions

Register in `lib/admin-permissions.ts`:

```ts
{ id: "audit-logs", routePrefix: "/admin/audit-logs", roles: ADMIN_ROLES }
```

`ADMIN_ROLES` = `SUPER_ADMIN` | `ADMIN`

- Page guard: `requireModuleAccess("audit-logs")`
- API: `checkModuleAccess("audit-logs")` → 401/403 as elsewhere
- EDITOR / MARKETING / VIEWER: nav hidden + API forbidden

---

## 2. Page UX

### Layout

Desktop-first admin page:

1. Page title: **Audit Logs**
2. Filter bar (sticky optional, not required V1)
3. Result count / pagination summary
4. Table (desktop) / card list (mobile)
5. Pagination controls
6. Detail drawer (overlay)

### Filters (URL-synced)

All filters sync via `searchParams`. Refresh and browser Back/Forward must restore state.

| Param | Type | Notes |
|-------|------|--------|
| `page` | int ≥ 1 | default 1 |
| `pageSize` | 25 \| 50 \| 100 | default 50 |
| `module` | `AuditModule` | optional |
| `action` | `AuditAction` | optional |
| `severity` | `AuditSeverity` | optional |
| `search` | string | matches `entityName` OR `entitySlug` OR `userName` (case-insensitive contains). **Normalize before query:** trim whitespace; empty string → treated as unset; length **&lt; 2** → ignored (do not apply LIKE). |
| `dateFrom` | `YYYY-MM-DD` | inclusive **startOfDay** in project timezone **`Asia/Bangkok`** |
| `dateTo` | `YYYY-MM-DD` | inclusive **endOfDay** in project timezone **`Asia/Bangkok`** |
| `preset` | optional | `today` \| `7d` \| `30d` — UI helper; resolve to `dateFrom`/`dateTo` when applied |

**Timezone (locked):** Audit Logs UI V1 uses project timezone **`Asia/Bangkok`** for all date-range bounds. Do not use UTC midnight for `dateFrom`/`dateTo` interpretation.

Date range presets: **Today**, **Last 7 Days**, **Last 30 Days**, **Custom Range**.

Clear filters resets to defaults (page 1, pageSize 50, no module/action/severity/search/dates).

### Default sort

```sql
ORDER BY createdAt DESC, id DESC
```

No user-facing sort toggle in V1.

---

## 3. Table

### Desktop columns

| Column | Source | Notes |
|--------|--------|--------|
| Time | `createdAt` | Localized datetime via existing localization formatters |
| Severity | `severity` | Badge (INFO / WARNING / CRITICAL) |
| Module | `module` | Badge |
| Action | `action` | Badge |
| Entity | `entityName` | Subtext optional: `entitySlug`; empty → `—` |
| User | `userName` | Empty → `—` (e.g. actorless LOGOUT) |
| | | **View** button (fixed ~80–100px) |

### Interaction

- Open drawer **only** via View
- No row click, no multi-select, no bulk actions

### Tablet

Hide Severity and User columns if needed for width:

```txt
Time | Module | Action | Entity | View
```

### Mobile

Card list:

```txt
[INFO] POSTS • UPDATE
Entity name
by User
12 Aug 2026 10:45
[View]
```

---

## 4. Detail Drawer

Opened by View → **always fetch detail on open**.

**Drawer cache policy (locked):**

```txt
Open drawer  = fetch detail
Close drawer = discard detail state
Open again   = fetch again
```

Do not retain detail payload across close/open in V1. No stale-while-revalidate cache.

### Structure

```txt
Header
  Action badge · Module badge · Timestamp

Section: Actor
  User name
  Role

Section: Entity
  Type
  Name
  Slug

**Entity display rule (locked):** `entityId`, `entityType`, `entityName`, and `entitySlug` are nullable. When a value is missing, the UI shows an em dash (`—`). LOGIN / LOGOUT / some SETTINGS rows may have no entity — the Entity section must still render without layout breakage.

Section: Changes
  Field list (default)
  [ View JSON ] toggle

Advanced Details (collapsed by default)
  IP Address
  User Agent
  Audit ID
```

### Changes — Field list (default)

Human-readable rows from `changes` object keys (raw key names, no label map):

```txt
title
  Old Title  →  New Title

content
  Changed

smtpPassword
  Changed (masked)
```

Rules:

- `{ before, after }` → show before → after
- `{ changed: true }` → `Changed`
- `{ changed: true, masked: true }` → `Changed (masked)`
- `changes === null` → copy: **No field-level changes recorded.**

### Changes — JSON (optional)

- Pretty-print monospace
- Copyable
- Collapsible panel/tab is enough
- No JSON search, tree expand UX, colored line-diff, or export

### Drawer errors

- Loading: `Loading audit details...`
- 404: not-found message in drawer (list stays mounted)
- 403: forbidden message
- Network error: retry affordance optional; at minimum show error text

Opening the drawer must **not** reload the list.

---

## 5. Empty & Loading States

### Empty — no logs in system (or unfiltered empty DB)

```txt
No audit logs found

Try adjusting your filters or date range.
```

(If zero rows total and no filters, the second line may read: `Audit events will appear here as admins use the CMS.`)

### Empty — filters yield no matches

```txt
No matching audit logs

Clear filters or widen the date range.
```

Provide a **Clear filters** control.

### Loading — table

Skeleton rows × **10** (independent of pageSize).

### Loading — drawer

```txt
Loading audit details...
```

---

## 6. API Contract

### Auth

Both endpoints: `checkModuleAccess("audit-logs")`.

### List

```http
GET /api/admin/audit-logs
```

Query: `page`, `pageSize`, `module`, `action`, `severity`, `search`, `dateFrom`, `dateTo`

Response:

```ts
{
  items: Array<{
    id: string
    createdAt: string // ISO
    severity: "INFO" | "WARNING" | "CRITICAL"
    module: string    // AuditModule
    action: string    // AuditAction
    entityName: string | null
    entitySlug: string | null
    userName: string | null
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

**Must not** include `changes`, `ipAddress`, `userAgent` on list items.

Validation:

- Invalid enum values (`module` / `action` / `severity`) are **ignored** and treated as unset filters (same resilience model as page/pageSize coercion — bad bookmark/query params must not 422 the page)
- `pageSize` not in {25,50,100} → coerce to 50
- `page < 1` → coerce to 1

Query shape (conceptual):

```sql
WHERE
  (module = ? OR ? IS NULL)
  AND (action = ? OR ? IS NULL)
  AND (severity = ? OR ? IS NULL)
  AND (createdAt >= ? OR ? IS NULL)
  AND (createdAt <= ? OR ? IS NULL)
  AND (
    ? IS NULL OR
    entityName LIKE ? OR entitySlug LIKE ? OR userName LIKE ?
  )
ORDER BY createdAt DESC, id DESC
LIMIT ? OFFSET ?
```

`search` must be normalized (trim; ignore if empty or length &lt; 2) before building the LIKE clause. Date bounds must be converted with **Asia/Bangkok** startOfDay / endOfDay before comparing to `createdAt`.

Uses existing indexes: `module`, `action`, `severity`, `createdAt`, `[module, createdAt]`, `[action, createdAt]`.

### Detail

```http
GET /api/admin/audit-logs/[id]
```

Response:

```ts
{
  id: string
  createdAt: string
  severity: string
  module: string
  action: string
  userId: string | null
  userName: string | null
  userRole: string | null
  entityId: string | null
  entityType: string | null
  entityName: string | null
  entitySlug: string | null
  changes: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
}
```

- Missing id → **404**
- Unauthorized → **401/403**

### Optional deep-link (V1 stretch, not required)

`?id=<auditId>` may open the drawer after list load. Not required for acceptance if omitted; prefer implementing only if cheap.

---

## 7. Files (expected)

```txt
lib/admin-navigation.ts          # nav item
lib/admin-permissions.ts         # audit-logs module

app/admin/audit-logs/page.tsx    # server page + searchParams
app/api/admin/audit-logs/route.ts
app/api/admin/audit-logs/[id]/route.ts

features/audit-logs/...          # table, filters, drawer, diff list, JSON view
  (follow existing features/* layout conventions)
```

Exact component split is an implementation concern; keep filter URL sync and drawer fetch boundaries clear.

---

## 8. Acceptance Criteria

- [ ] Nav item under **ตั้งค่าระบบ** visible only to SUPER_ADMIN / ADMIN
- [ ] EDITOR / MARKETING / VIEWER cannot access page or APIs (403)
- [ ] Filters: Module, Action, Severity, Date Range (presets + custom), Search
- [ ] All filters sync via URL `searchParams`
- [ ] Refresh keeps filters; browser Back/Forward works
- [ ] Default sort newest first (`createdAt DESC, id DESC`)
- [ ] Pagination page + pageSize (25/50/100, default 50)
- [ ] Table columns match desktop spec; View opens drawer
- [ ] Opening drawer does not reload list
- [ ] Open drawer always fetches detail; close discards state; reopen fetches again
- [ ] Field list + View JSON; empty changes copy shown when `changes` is null
- [ ] Entity fields nullable → display `—` when missing
- [ ] Search trims; empty/`length < 2` ignored
- [ ] Date range bounds use Asia/Bangkok startOfDay/endOfDay
- [ ] Advanced Details collapsed: IP, User-Agent, Audit ID
- [ ] List API omits heavy fields; Detail API returns full row
- [ ] Detail 404 → error in drawer
- [ ] Empty + loading states match this spec
- [ ] No CSV / Saved Views / User dropdown / row click / editor deep links

---

## 9. Future Considerations

```txt
- CSV Export
- Saved Views
- User Filter Dropdown / autocomplete
- Editor Deep Links from Entity
- Audit Dashboard / quick analytics
- Retention Policies / purge jobs
- RESTORE Action UI
- Pages / Media / Users module wiring & UX
- Field label localization registry
- Cursor pagination / infinite scroll
- Shareable /admin/audit-logs/[id] route (if not done in V1 stretch)
```

---

## 10. Relationship to Infrastructure V1

This UI is **read-only**. It does not write audit rows. All write semantics (smart diff, fail-open, severity, PUBLISH/UNPUBLISH resolution) remain owned by Audit Infrastructure V1.

Suggested implementation phases (for the later plan):

```txt
Phase 1 — Permissions + Nav + empty page shell
Phase 2 — List API + filters/pagination query
Phase 3 — Table + URL-synced filters UI
Phase 4 — Detail API + Drawer (field list + JSON)
Phase 5 — Empty/loading/error polish + acceptance smoke
```
