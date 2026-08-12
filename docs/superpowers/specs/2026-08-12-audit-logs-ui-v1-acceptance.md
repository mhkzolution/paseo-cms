# Audit Logs UI V1 — Acceptance Checklist

**Date:** 2026-08-12  
**Branch:** `feat/media-library-v2`  
**Phase:** 5 — Polish + Acceptance Smoke

## Phase 5 Polish Delivered

| Item | Status |
|------|--------|
| Escape-to-close on audit drawer | **Added** — `keydown` listener on `Escape` in `AuditLogDrawerContent`; cleaned up on unmount |
| Skeleton rows ×10 (`loading.tsx`) | **Verified** — `SKELETON_ROWS = 10` (Phase 3, unchanged) |
| `expectedApiModules` includes `audit-logs` | **Added** — `tests/api-authorization-guard.test.ts` |
| CSV / Saved Views / Deep Links / Editor Links / Retention / Analytics / User dropdown | **Not shipped** (per spec non-goals) |

## §8 Acceptance Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Nav item under **ตั้งค่าระบบ** visible only to SUPER_ADMIN / ADMIN | **Pass** | `admin-permissions.test.ts`: `audit-logs` → `ADMIN_ROLES`; nav in `lib/admin-navigation.ts` |
| 2 | EDITOR / MARKETING / VIEWER cannot access page or APIs (403) | **Pass** (unit) / **Deferred (browser-only)** | Permission registry; manual role matrix not re-run this phase |
| 3 | Filters: Module, Action, Severity, Date Range, Search | **Deferred (browser-only)** | Implemented Phases 3–4; UI not re-smoked here |
| 4 | All filters sync via URL `searchParams` | **Deferred (browser-only)** | |
| 5 | Refresh keeps filters; browser Back/Forward works | **Deferred (browser-only)** | |
| 6 | Default sort newest first (`createdAt DESC, id DESC`) | **Pass** | `audit-logs-query.test.ts`: `AUDIT_LOG_ORDER_BY` |
| 7 | Pagination page + pageSize (25/50/100, default 50) | **Pass** | `parseAuditLogsListQuery` tests |
| 8 | Table columns match desktop spec; View opens drawer | **Deferred (browser-only)** | |
| 9 | Opening drawer does not reload list | **Deferred (browser-only)** | Architecture verified Task 4 |
| 10 | Open drawer fetches detail; close discards; reopen fetches again | **Deferred (browser-only)** | Discard-on-close via unmount (Task 4) |
| 11 | Field list + View JSON; empty changes copy when `changes` is null | **Pass** | `audit-log-changes.test.ts` |
| 12 | Entity fields nullable → display `—` | **Pass** | `emptyValue()` in drawer; formatter tests |
| 13 | Search trims; empty / length &lt; 2 ignored | **Pass** | `normalizeAuditSearch` + `buildAuditLogsWhere` tests |
| 14 | Date range bounds use Asia/Bangkok startOfDay/endOfDay | **Pass** | `resolveBangkokDayBounds` tests |
| 15 | Advanced Details collapsed: IP, User-Agent, Audit ID | **Deferred (browser-only)** | `<details>` default collapsed in drawer |
| 16 | List API omits heavy fields; Detail API returns full row | **Pass** | API smoke (see below) |
| 17 | Detail 404 → error in drawer | **Deferred (browser-only)** | Error strings implemented Task 4 |
| 18 | Empty + loading states match spec | **Pass** (partial) | Skeleton ×10 verified; empty/error copy from Phase 3–4 |
| 19 | No CSV / Saved Views / User dropdown / row click / editor deep links | **Pass** | Not implemented; confirmed out of scope |

## Test Results

### Unit / integration (this phase)

```bash
node --import tsx --test tests/audit-logs-query.test.ts tests/audit-log-changes.test.ts tests/admin-permissions.test.ts
```

**25/25 pass**

### API authorization guard

```bash
node --import tsx --test tests/api-authorization-guard.test.ts
```

**Audit-logs:** `matches authorization wiring` for list + `[id]` routes ✔; `expectedApiModules` includes `audit-logs` ✔  

**Pre-existing failures (ignored):** `categories/route.ts`, `categories/[id]/route.ts` (dynamic module id wiring)

## API Smoke (admin session, localhost:3000)

Login: `<redacted>` via credentials callback (HTTP 302). Credentials omitted from this document intentionally.

| Check | Result |
|-------|--------|
| `GET /api/admin/audit-logs?pageSize=25` — items omit `changes`, `ipAddress`, `userAgent` | **Pass** — keys: `id, createdAt, severity, module, action, entityName, entitySlug, userName` |
| `GET /api/admin/audit-logs/{id}` — full payload | **Pass** — sample id `fe1af905-eeaa-45dd-a28d-b7728b4b60f7` includes `changes`, `ipAddress`, `userAgent` |
| `GET /admin/audit-logs` authenticated | **Pass** — HTTP 200 |

## Manual Matrix (Task 5 brief — browser)

| Check | Expected | Result |
|-------|----------|--------|
| ADMIN login sees nav | yes | Deferred (browser-only) |
| EDITOR blocked | yes | Deferred (browser-only) |
| Filter + refresh | params persist | Deferred (browser-only) |
| Back/Forward | works | Deferred (browser-only) |
| Open drawer | 1 detail request | Deferred (browser-only) |
| Close + reopen | 2nd detail request | Deferred (browser-only) |
| LOGIN row entity | `—` fields | Deferred (browser-only) |
| UPDATE row | title diff visible | Deferred (browser-only) |
| DELETE row | WARNING badge; no field changes copy | Deferred (browser-only) |
| search=`a` | ignored | **Pass** (unit: `normalizeAuditSearch`) |

## Non-Goals Confirmation

Not shipped in V1: CSV export, Saved Views, deep links (`?id=`), editor entity links, retention policies, analytics dashboard, user filter dropdown.
