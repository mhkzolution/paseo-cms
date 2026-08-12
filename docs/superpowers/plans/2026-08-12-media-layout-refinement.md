# Media Library V2 Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve browse density, inventory awareness, and paginated Load More for Media Library and Media Picker via an extended `GET /api/media` page contract and shared UX Kit updates.

**Architecture:** Patch existing `GET /api/media` with offset/page pagination + `total`/`hasMore`. Library and Picker share the same list contract, inventory semantics (current query scope), grid density, skeleton loading, and Load More footer. No new browse endpoint or Media Platform features.

**Tech Stack:** Next.js App Router, Prisma, Zod, shared `features/media/*`, node:test + tsx

**Spec:** `docs/superpowers/specs/media-library-v2/06-layout-refinement.md`

## Global Constraints

- UX/UI refinement only — no Media Platform concepts
- Inventory = **current query scope** (folder + search + type + `deletedAt: null`), never global totals
- Sort affects ordering only — must not affect `total`
- `GET /api/media` only — do not create `/api/media/browse`
- Library + Picker share MediaToolbar / MediaGrid / inventory / Load More / pagination
- Default `take = 40`; `page` is 1-based
- Response: `media`, `total`, `page`, `take`, `totalPages`, `hasMore`
- `totalPages` may be `0` when `total` is `0` — consumers must not assume `totalPages >= 1`
- Load More appends pages; query changes reset to page 1
- Initial / query-change → grid skeleton; Load More → button loading only
- Grid: `repeat(auto-fill, minmax(220px, 1fr))`
- Flat folders only; Drawer remains the manage surface
- Out of scope: counts{}, cursor, infinite scroll, bulk actions, usage badges, nested folders, upload redesign

## File map

| Path | Responsibility |
|------|----------------|
| `validators/media.validator.ts` | Add `page` / `take` to list schema |
| `lib/media.ts` | Pagination helpers (`skip`, `totalPages`, `hasMore`) |
| `app/api/media/route.ts` | Paginated findMany + count |
| `tests/media-pagination.test.ts` | Pure helpers + where/count independence from sort |
| `features/media/media-grid.tsx` | Density + optional skeleton |
| `features/media/media-inventory.tsx` | Title + `{total} assets` |
| `features/media/media-load-more.tsx` | Showing X of Y + button |
| `features/media/media-grid-skeleton.tsx` | Skeleton placeholders |
| `features/media/use-media-list.ts` | Shared fetch/pagination state (Library + Picker) |
| `features/media/media-library.tsx` | Wire inventory, skeleton, Load More |
| `features/media/media-picker-dialog.tsx` | Same wiring |
| `docs/superpowers/specs/media-library-v2/06-layout-refinement.md` | Already approved (no code) |

---

### Task 1: Pagination helpers + API contract

**Files:**
- Modify: `validators/media.validator.ts`
- Modify: `lib/media.ts`
- Modify: `app/api/media/route.ts`
- Create: `tests/media-pagination.test.ts`

**Interfaces:**
- Produces: `parseMediaPage({ page?, take? }) → { page, take, skip }`
- Produces: `buildMediaPageMeta({ total, page, take }) → { total, page, take, totalPages, hasMore }`
- Produces: `GET /api/media` JSON matching spec response

- [ ] **Step 1: Write failing tests**

```ts
// tests/media-pagination.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMediaPageMeta, parseMediaPage } from "@/lib/media";

describe("parseMediaPage", () => {
  it("defaults page=1 take=40", () => {
    assert.deepEqual(parseMediaPage({}), { page: 1, take: 40, skip: 0 });
  });

  it("computes skip from page and take", () => {
    assert.deepEqual(parseMediaPage({ page: 3, take: 40 }), { page: 3, take: 40, skip: 80 });
  });

  it("clamps take to 1..100 and page to >=1", () => {
    assert.equal(parseMediaPage({ page: 0, take: 999 }).page, 1);
    assert.equal(parseMediaPage({ page: 1, take: 999 }).take, 100);
    assert.equal(parseMediaPage({ page: 1, take: 0 }).take, 1);
  });
});

describe("buildMediaPageMeta", () => {
  it("returns hasMore true when more pages remain", () => {
    assert.deepEqual(buildMediaPageMeta({ total: 238, page: 1, take: 40 }), {
      total: 238,
      page: 1,
      take: 40,
      totalPages: 6,
      hasMore: true,
    });
  });

  it("allows totalPages=0 when total=0", () => {
    const meta = buildMediaPageMeta({ total: 0, page: 1, take: 40 });
    assert.equal(meta.totalPages, 0);
    assert.equal(meta.hasMore, false);
  });

  it("sets hasMore false on last page", () => {
    assert.equal(buildMediaPageMeta({ total: 40, page: 1, take: 40 }).hasMore, false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd paseo-cms && node --import tsx --test tests/media-pagination.test.ts
```

- [ ] **Step 3: Implement helpers in `lib/media.ts`**

```ts
export function parseMediaPage(input: { page?: number; take?: number }) {
  const page = Math.max(1, Number.isFinite(input.page) ? Number(input.page) : 1);
  const rawTake = Number.isFinite(input.take) ? Number(input.take) : 40;
  const take = Math.min(100, Math.max(1, rawTake || 40));
  return { page, take, skip: (page - 1) * take };
}

export function buildMediaPageMeta(input: { total: number; page: number; take: number }) {
  const { total, page, take } = input;
  const totalPages = total === 0 ? 0 : Math.ceil(total / take);
  const hasMore = page * take < total;
  return { total, page, take, totalPages, hasMore };
}
```

- [ ] **Step 4: Extend validator**

```ts
export const mediaListSchema = z.object({
  folderId: z.string().trim().optional(),
  type: z.enum(MEDIA_TYPE_VALUES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "name-asc", "name-desc"]).optional(),
  page: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});
```

- [ ] **Step 5: Update `GET /api/media`**

```ts
const where = buildMediaWhere(parsed.data);
const { page, take, skip } = parseMediaPage(parsed.data);

const [media, total] = await Promise.all([
  prisma.media.findMany({
    where,
    orderBy: buildMediaOrderBy(parsed.data.sort),
    skip,
    take,
    select: mediaListSelect,
  }),
  prisma.media.count({ where }),
]);

return NextResponse.json({
  media,
  ...buildMediaPageMeta({ total, page, take }),
});
```

Remove hard-coded `take: 120`.

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd paseo-cms && node --import tsx --test tests/media-pagination.test.ts tests/media-where.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add validators/media.validator.ts lib/media.ts app/api/media/route.ts tests/media-pagination.test.ts
git commit -m "$(cat <<'EOF'
feat(media): add page/take pagination contract to media list API

EOF
)"
```

---

### Task 2: Shared list hook + inventory + Load More + skeleton

**Files:**
- Create: `features/media/use-media-list.ts`
- Create: `features/media/media-inventory.tsx`
- Create: `features/media/media-load-more.tsx`
- Create: `features/media/media-grid-skeleton.tsx`

**Interfaces:**
- Produces: `useMediaList({ folderId, query, type, sort, accept? })` with `{ media, total, page, hasMore, isLoading, isLoadingMore, error, reload, loadMore }`
- Query change → clear + skeleton path (`isLoading` true, `media` empty)
- Load More → `isLoadingMore` true, append

- [ ] **Step 1: Implement `useMediaList`**

Behavior:
- Fetch `/api/media?folderId&q&type&sort&page&take=40`
- On dependency change: set `page=1`, clear media, `isLoading=true`, replace results
- `loadMore`: if `hasMore` && !loading, fetch `page+1`, append (dedupe by id), update meta
- Optional `accept` filter applied client-side after fetch (Picker)

- [ ] **Step 2: Implement presentational pieces**

`MediaInventory`:

```tsx
export function MediaInventory({ title, total }: { title: string; total: number }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted">{total} assets</p>
    </div>
  );
}
```

Title rules from spec: All Files / folder name / Search Results when `query` non-empty.

`MediaLoadMore`:

```tsx
// Showing {loadedCount} of {total} assets + button when hasMore
```

`MediaGridSkeleton`: 8–12 placeholder cards matching grid density.

- [ ] **Step 3: Typecheck / eslint focused files**

```bash
cd paseo-cms && npx eslint features/media/use-media-list.ts features/media/media-inventory.tsx features/media/media-load-more.tsx features/media/media-grid-skeleton.tsx
```

- [ ] **Step 4: Commit**

```bash
git add features/media/use-media-list.ts features/media/media-inventory.tsx features/media/media-load-more.tsx features/media/media-grid-skeleton.tsx
git commit -m "$(cat <<'EOF'
feat(media): add shared media list hook, inventory, load more, skeleton

EOF
)"
```

---

### Task 3: Grid density

**Files:**
- Modify: `features/media/media-grid.tsx`

- [ ] **Step 1: Replace breakpoint columns with auto-fill**

```tsx
className={cn(
  "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]",
  className,
)}
```

- [ ] **Step 2: Update Next Image `sizes`**

Use something like `(max-width: 768px) 50vw, 220px` (or equivalent) so larger cards load appropriately.

- [ ] **Step 3: Commit**

```bash
git add features/media/media-grid.tsx
git commit -m "$(cat <<'EOF'
feat(media): use auto-fill minmax grid for larger media thumbnails

EOF
)"
```

---

### Task 4: Wire Library + Picker + folder polish

**Files:**
- Modify: `features/media/media-library.tsx`
- Modify: `features/media/media-picker-dialog.tsx`

- [ ] **Step 1: Refactor Library to `useMediaList`**

- Inventory header with scoped title + `total`
- Toolbar unchanged controls
- Skeleton when `isLoading`
- Grid when media loaded
- Load More footer when `total > 0`
- Upload / drawer callbacks call `reload()` or patch local list as today
- Folder sidebar: keep flat + badges; optional spacing/active polish only

- [ ] **Step 2: Refactor Picker similarly**

- Same inventory / skeleton / Load More
- Preserve multi-select `selectedIds` + drawer `mode="picker"`
- Preserve URL-string `onSelect` / `onSelectMany` contracts
- Keep V1 upload

- [ ] **Step 3: Manual acceptance**

1. Library All Files shows `{total} assets` matching grid scope  
2. Filter Images → total updates; page resets  
3. Search → title Search Results; total matches hits  
4. Load More appends; Showing X of Y updates; button hides at end  
5. Query change shows skeleton, not empty flash  
6. Picker mirrors behavior; select still returns `path`  
7. Empty scope → empty state, no Load More  

- [ ] **Step 4: Commit**

```bash
git add features/media/media-library.tsx features/media/media-picker-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(media): wire paginated browse UX into Library and Picker

EOF
)"
```

---

### Task 5: QA & regression

**Files:**
- Modify/extend: `tests/media-pagination.test.ts` (edge cases if gaps)
- Optionally: thin unit tests for title helper if extracted

- [ ] **Step 1: Run media-focused tests**

```bash
cd paseo-cms && node --import tsx --test tests/media-pagination.test.ts tests/media-where.test.ts tests/media-metadata.test.ts tests/upload.test.ts
```

Expected: all pass

- [ ] **Step 2: Regression checklist**

- Soft-deleted never appear (`deletedAt: null`)
- Sort change reorders but does not invent a different total for same filters
- Drawer library/picker modes unchanged
- No `counts`, cursor, infinite scroll, nested folders introduced

- [ ] **Step 3: Commit if any test polish**

```bash
git add tests/
git commit -m "$(cat <<'EOF'
test(media): harden pagination edge cases for layout refinement

EOF
)"
```

(Skip empty commit if nothing changed.)

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| page/take + response meta | 1 |
| Inventory = current query scope | 2–4 |
| Sort does not affect total | 1 (count uses `where` only) |
| Load More + Showing X of Y | 2, 4 |
| Skeleton loading rules | 2, 4 |
| Shared Library + Picker | 4 |
| Grid minmax(220px) | 3 |
| Flat folders only | 4 |
| No Media Platform extras | Global constraints |

## Placeholder / consistency review

- No TBD in steps
- Endpoint remains `/api/media`
- `totalPages` may be 0 documented in helpers/tests

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-12-media-layout-refinement.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task + review gates  
2. **Inline Execution** — implement in this session with checkpoints  

Which approach?
