# Audit Logs UI V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production read-only Audit Logs admin UI with URL-synced filters, offset pagination, and a View-button drawer backed by list + detail APIs.

**Architecture:** Server page reads `searchParams` and loads list data (via shared query helper or list API). Client drawer opens only via View and always re-fetches `GET /api/admin/audit-logs/[id]` on open, discarding state on close. List payloads omit `changes` / IP / UA.

**Tech Stack:** Next.js App Router, Prisma `AuditLog`, existing `requireModuleAccess` / `checkModuleAccess`, `ADMIN_ROLES`, localization datetime formatters, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-audit-logs-ui-v1-design.md`

## Global Constraints

- Access: `SUPER_ADMIN` + `ADMIN` only (`ADMIN_ROLES`)
- Route: `/admin/audit-logs` under System settings nav
- Filters URL-synced: `page`, `pageSize`, `module`, `action`, `severity`, `search`, `dateFrom`, `dateTo`
- Search: trim; empty → unset; length &lt; 2 → ignored
- Date bounds: **Asia/Bangkok** startOfDay / endOfDay
- Sort: `createdAt DESC, id DESC`
- pageSize default 50; options 25 / 50 / 100
- List omits `changes`, `ipAddress`, `userAgent`; Detail returns full row
- Drawer: open = fetch; close = discard; reopen = fetch again
- Missing entity fields → `—`
- No CSV, Saved Views, User dropdown, row click, editor deep links, retention UI

## File map

| Path | Responsibility |
|------|----------------|
| `types/index.ts` | Add `"audit-logs"` to `AdminModuleId` |
| `lib/admin-permissions.ts` | Register module → `ADMIN_ROLES` |
| `lib/admin-navigation.ts` | Nav item under `system-settings` |
| `lib/audit-logs-query.ts` | Parse filters, normalize search, Bangkok day bounds, Prisma where/order/skip/take, list/detail selects |
| `app/api/admin/audit-logs/route.ts` | List API |
| `app/api/admin/audit-logs/[id]/route.ts` | Detail API |
| `app/admin/audit-logs/page.tsx` | Server page shell + data |
| `features/audit-logs/*` | Filters, table/cards, pagination, drawer, field-diff, JSON panel |
| `tests/audit-logs-query.test.ts` | Pure query helper tests |
| `tests/admin-permissions.test.ts` | Extend for audit-logs path/roles |

---

### Task 1: Permissions + Navigation + Page Shell (Phase 1)

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/admin-permissions.ts`
- Modify: `lib/admin-navigation.ts`
- Modify: `tests/admin-permissions.test.ts` (and/or navigation validation tests)
- Create: `app/admin/audit-logs/page.tsx`

**Interfaces:**
- Produces: `AdminModuleId` includes `"audit-logs"`; `getModuleRoles("audit-logs")` → `ADMIN_ROLES`; nav href `/admin/audit-logs`

- [ ] **Step 1: Extend failing permission test**

```ts
it("protects audit-logs for ADMIN_ROLES only", () => {
  assert.deepEqual(getModuleRoles("audit-logs"), ["SUPER_ADMIN", "ADMIN"]);
  const permission = findModulePermissionForPathname("/admin/audit-logs");
  assert.equal(permission?.id, "audit-logs");
});
```

- [ ] **Step 2: Run test — expect FAIL** (`audit-logs` unknown / undefined roles)

- [ ] **Step 3: Implement registry + nav + shell**

1. Add `"audit-logs"` to `AdminModuleId` in `types/index.ts`
2. Add `{ id: "audit-logs", routePrefix: "/admin/audit-logs", roles: ADMIN_ROLES }` in `lib/admin-permissions.ts`
3. Add nav item under `system-settings`:

```ts
{ id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs" }
```

(Use a sensible Lucide icon already used nearby, e.g. `ScrollText` / `ClipboardList` if available — otherwise `FileText`.)

4. Create page:

```tsx
import { requireModuleAccess } from "@/lib/rbac";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleAccess("audit-logs");
  const params = await searchParams;
  void params; // wired in Task 3

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium text-muted">System</div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted">Review who changed what across the CMS.</p>
      </div>
      <p className="text-sm text-muted">Coming next: filters and table.</p>
    </div>
  );
}
```

- [ ] **Step 4: Run permission/nav tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add types/index.ts lib/admin-permissions.ts lib/admin-navigation.ts \
  tests/admin-permissions.test.ts app/admin/audit-logs/page.tsx
git commit -m "feat(audit-logs): add nav, permissions, and page shell"
```

#### Phase 1 Verification

- [ ] SUPER_ADMIN/ADMIN see nav item
- [ ] EDITOR cannot open `/admin/audit-logs` (redirect/forbidden per existing pattern)
- [ ] `validateAdminNavigationConfig` still passes

---

### Task 2: List API + Query Helpers (Phase 2)

**Files:**
- Create: `lib/audit-logs-query.ts`
- Create: `tests/audit-logs-query.test.ts`
- Create: `app/api/admin/audit-logs/route.ts`

**Interfaces:**
- Produces:
  - `parseAuditLogsListQuery(input) → { page, pageSize, module?, action?, severity?, search?, dateFrom?, dateTo? }`
  - `buildAuditLogsWhere(filters) → Prisma.AuditLogWhereInput`
  - `listAuditLogs(filters) → { items, pagination }`
- List item fields only: `id, createdAt, severity, module, action, entityName, entitySlug, userName`

- [ ] **Step 1: Write failing unit tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeAuditSearch,
  parseAuditLogsListQuery,
  resolveBangkokDayBounds,
} from "@/lib/audit-logs-query";

describe("normalizeAuditSearch", () => {
  it("trims and rejects empty / short terms", () => {
    assert.equal(normalizeAuditSearch("  "), undefined);
    assert.equal(normalizeAuditSearch("a"), undefined);
    assert.equal(normalizeAuditSearch(" ab "), "ab");
  });
});

describe("parseAuditLogsListQuery", () => {
  it("defaults page=1 pageSize=50", () => {
    const q = parseAuditLogsListQuery({});
    assert.equal(q.page, 1);
    assert.equal(q.pageSize, 50);
  });

  it("coerces invalid pageSize to 50", () => {
    assert.equal(parseAuditLogsListQuery({ pageSize: "999" }).pageSize, 50);
  });
});

describe("resolveBangkokDayBounds", () => {
  it("maps YYYY-MM-DD to Asia/Bangkok start/end instants", () => {
    const { gte, lte } = resolveBangkokDayBounds("2026-08-12", "2026-08-12");
    assert.ok(gte instanceof Date && lte instanceof Date);
    assert.ok(gte.getTime() < lte.getTime());
    // 2026-08-12 00:00 ICT = 2026-08-11 17:00 UTC
    assert.equal(gte.toISOString(), "2026-08-11T17:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement `lib/audit-logs-query.ts`**

Include:

```ts
export function normalizeAuditSearch(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim() ?? "";
  if (trimmed.length < 2) return undefined;
  return trimmed;
}

export const AUDIT_LOG_PAGE_SIZES = [25, 50, 100] as const;

// parse enums against Prisma AuditModule / AuditAction / AuditSeverity
// resolveBangkokDayBounds(dateFrom?, dateTo?) using Asia/Bangkok
// Prefer existing datetime helpers in lib/datetime* if they already support timezone day bounds; otherwise implement with a small explicit helper and document it.

export async function listAuditLogs(filters: ParsedAuditLogsListQuery) {
  const where = buildAuditLogsWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: filters.pageSize,
      select: {
        id: true,
        createdAt: true,
        severity: true,
        module: true,
        action: true,
        entityName: true,
        entitySlug: true,
        userName: true,
      },
    }),
  ]);
  return {
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / filters.pageSize),
    },
  };
}
```

- [ ] **Step 4: Implement list route**

```ts
export async function GET(request: Request) {
  const { authorized, status } = await checkModuleAccess("audit-logs");
  if (!authorized) return forbiddenError(status);

  const url = new URL(request.url);
  const query = parseAuditLogsListQuery(Object.fromEntries(url.searchParams));
  const result = await listAuditLogs(query);
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Run unit tests — PASS**

- [ ] **Step 6: Manual smoke** — `GET /api/admin/audit-logs?pageSize=25` as admin returns items without `changes`

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(audit-logs): add list API and query helpers"
```

#### Phase 2 Verification

- [ ] Search length &lt; 2 does not add LIKE
- [ ] Bangkok day bounds tested
- [ ] Unauthorized → 403

---

### Task 3: Filters + Table + Pagination UI (Phase 3)

**Files:**
- Create: `features/audit-logs/audit-logs-filters.tsx`
- Create: `features/audit-logs/audit-logs-table.tsx`
- Create: `features/audit-logs/audit-logs-pagination.tsx`
- Create: `features/audit-logs/audit-logs-page-client.tsx` (or compose in page)
- Modify: `app/admin/audit-logs/page.tsx` to load list via `listAuditLogs(parse…(searchParams))` and render UI

**Interfaces:**
- Consumes: list result shape from Task 2
- Produces: URL updates via `useRouter` + `searchParams` (or link-based filter controls)

- [ ] **Step 1: Wire server page to call `listAuditLogs` from searchParams**

- [ ] **Step 2: Build filters UI** that writes query string keys from the spec (module/action/severity/search/dateFrom/dateTo/pageSize) and resets `page=1` on filter change

- [ ] **Step 3: Build table** with columns Time · Severity · Module · Action · Entity · User · View  
  - Entity/User empty → `—`  
  - View button only (no row onClick)  
  - Pass `onView(id)` into client drawer host (Task 4 can stub View as no-op temporarily, or leave disabled until Task 4)

- [ ] **Step 4: Pagination** Previous/Next + pageSize select; preserve other params

- [ ] **Step 5: Empty states**  
  - no filters / zero total → “No audit logs found…”  
  - filters active / zero total → “No matching audit logs…” + Clear filters

- [ ] **Step 6: Loading** — if using `loading.tsx` or transition, show 10 skeleton rows; otherwise document that RSC navigation uses Next loading UI

- [ ] **Step 7: Manual check** — set filters in URL, refresh, Back/Forward restores

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(audit-logs): add filters, table, and pagination UI"
```

#### Phase 3 Verification

- [ ] URL sync works
- [ ] View button present (drawer wired in Task 4)
- [ ] Mobile cards or acceptable responsive collapse per spec

---

### Task 4: Detail API + Drawer (Phase 4)

**Files:**
- Create: `app/api/admin/audit-logs/[id]/route.ts`
- Create: `lib/audit-logs-query.ts` add `getAuditLogById(id)`
- Create: `features/audit-logs/audit-log-drawer.tsx`
- Create: `features/audit-logs/audit-log-changes.tsx` (field list + JSON toggle)
- Create: `tests/audit-log-changes.test.ts` (pure renderer/helpers for change rows)
- Modify: table View → open drawer

**Interfaces:**
- `GET /api/admin/audit-logs/[id]` → full detail DTO
- Drawer props: `{ open, auditLogId, onClose }`

- [ ] **Step 1: Failing tests for change row formatting**

```ts
import { formatAuditChangeRows } from "@/features/audit-logs/audit-log-changes";

it("formats before/after, changed, and masked", () => {
  const rows = formatAuditChangeRows({
    title: { before: "A", after: "B" },
    content: { changed: true },
    smtpPassword: { changed: true, masked: true },
  });
  assert.deepEqual(rows, [
    { key: "title", kind: "diff", before: "A", after: "B" },
    { key: "content", kind: "changed" },
    { key: "smtpPassword", kind: "masked" },
  ]);
});

it("returns empty list for null changes", () => {
  assert.deepEqual(formatAuditChangeRows(null), []);
});
```

- [ ] **Step 2: Implement formatter + Detail API**

```ts
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, status } = await checkModuleAccess("audit-logs");
  if (!authorized) return forbiddenError(status);
  const { id } = await params;
  const row = await getAuditLogById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
```

- [ ] **Step 3: Implement drawer**

On open (`auditLogId` set): `fetch(/api/admin/audit-logs/${id})`  
On close: clear `auditLogId`, clear loaded detail, clear error  
Reopen: fetch again  

Sections per spec; Advanced Details collapsed; entity null → `—`  
Changes null → “No field-level changes recorded.”  
Toggle View JSON → pretty `JSON.stringify(changes, null, 2)` monospace + copy button

- [ ] **Step 4: Wire View button**

- [ ] **Step 5: Tests PASS + manual open/close/reopen network check (2 fetches for 2 opens)**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(audit-logs): add detail API and audit drawer"
```

#### Phase 4 Verification

- [ ] 404 shows in drawer
- [ ] List not reloaded on open
- [ ] Field list + JSON work

---

### Task 5: Polish + Acceptance Smoke (Phase 5)

**Files:**
- Touch: empty/loading/error copy, skeleton, tablet/mobile tweaks
- Modify: tests as needed (`tests/api-*` auth guard pattern if project lists new routes)
- Update: checklist / smoke notes optional

- [ ] **Step 1: Add route to API authorization inventory tests if the repo maintains an explicit file list** (see `tests/api-authorization-guard.test.ts` patterns)

- [ ] **Step 2: Skeleton rows × 10** for pending navigations

- [ ] **Step 3: Manual acceptance matrix**

| Check | Expected |
|-------|----------|
| ADMIN login sees nav | yes |
| EDITOR blocked | yes |
| Filter + refresh | params persist |
| Back/Forward | works |
| Open drawer | 1 detail request |
| Close + reopen | 2nd detail request |
| LOGIN row entity | `—` fields |
| UPDATE row | title diff visible |
| DELETE row | WARNING badge; no field changes copy |
| search=`a` | ignored (same as no search) |

- [ ] **Step 4: Run full related tests**

```bash
node --import tsx --test tests/audit-logs-query.test.ts tests/audit-log-changes.test.ts tests/admin-permissions.test.ts
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(audit-logs): polish empty loading error states"
```

#### Phase 5 Verification

- [ ] Spec acceptance checklist complete
- [ ] No CSV/Saved Views/deep links shipped

---

## Spec coverage self-check

| Spec area | Task |
|-----------|------|
| Permissions + nav | Task 1 |
| Search normalize + Bangkok dates + list API | Task 2 |
| URL filters + table + pagination + empty | Task 3 |
| Detail API + drawer + field/JSON + discard-on-close | Task 4 |
| Loading/error polish + acceptance | Task 5 |
| Non-goals | All — do not implement |

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-12-audit-logs-ui-v1.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task + review between tasks  
2. **Inline Execution** — execute in this session with checkpoints  

Which approach?
