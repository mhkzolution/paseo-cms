# Media Library V2 — Layout Refinement

**Status:** Spec locked — awaiting implementation plan  
**Phase:** V2 UX addendum (browse density + pagination)  
**Type:** Design specification  
**Date:** 2026-08-12  
**Parent:** [01-overview.md](./01-overview.md) · [03-ui-spec.md](./03-ui-spec.md) · [04-mvp-scope.md](./04-mvp-scope.md)

---

## Purpose

Refine Media Library and Media Picker browsing so assets are easier to scan and large libraries remain responsive, while preserving the Media Library V2 architecture and Shared Media UX Kit.

This is a **UX/UI refinement only**.

It does **not** introduce Media Platform concepts (references, usage, safe delete, storage providers, nested folders, upload redesign, governance workflows).

---

## Spec contract

> Media Library V2 Layout Refinement improves browse density, inventory awareness, and paginated loading for both Library and Picker via the shared Media UX Kit and an extended `GET /api/media` page contract. It does not introduce Media Platform concepts.
>
> All inventory values represent the current query scope and are not global library totals.

---

## Approach (locked)

**API + Shared Kit Patch**

- Extend existing `GET /api/media` (do **not** create `/api/media/browse`)
- Update shared `MediaGrid` / toolbar-adjacent inventory / Load More used by **Library and Picker**
- Do **not** invent parallel browse components

---

## Architecture & API

### Endpoint

```http
GET /api/media?folderId=&q=&type=&sort=&page=1&take=40
```

Same endpoint for:

- `/admin/media` (Library)
- Media Picker dialog

### Query scope (single `where`)

Inventory, grid, and pagination **must** share the identical **filtering** scope:

```txt
folderId (optional)
q / search (optional)
type filter (optional)
deletedAt: null
```

```txt
Inventory must use the identical filtering scope.

folderId
q
type
deletedAt:null

Sort affects ordering only and must not affect total counts.
```

`sort` is applied only to `findMany` ordering. It must **not** change `total` / inventory.

### Pagination

| Param | Default | Notes |
|-------|---------|--------|
| `page` | `1` | 1-based offset page |
| `take` | `40` | Clamp server-side (e.g. 1–100). UI uses 40. |
| `sort` | `newest` | Existing sort keys unchanged |

```txt
skip = (page - 1) * take
```

Strategy: **Offset / Page** (not cursor). Suitable for libraries in the hundreds to low thousands; cursor deferred until enterprise-scale needs.

### Response contract

```json
{
  "media": [],
  "total": 238,
  "page": 1,
  "take": 40,
  "totalPages": 6,
  "hasMore": true
}
```

| Field | Meaning |
|-------|---------|
| `media` | Page of assets for current scope |
| `total` | Count of assets in **current query scope** |
| `page` | Current page |
| `take` | Page size |
| `totalPages` | `ceil(total / take)` (**may be `0` when `total` is `0`**) |
| `hasMore` | `page * take < total` |

```txt
totalPages may be 0 when total is 0.
Consumers must not assume totalPages >= 1.
```

**Not included:** `counts` (images/videos/documents breakdown) — deferred; avoid analytics payload creep.

### Client pagination behavior

| Event | Behavior |
|-------|----------|
| Folder / search / filter / sort change | Reset to `page = 1`, replace list |
| Load More | Request `page + 1`, **append** results |
| Empty (`total === 0`) | Empty state; do not show confusing `0 of N` |

Library and Picker must share this behavior.

---

## UI

### Grid density (shared `MediaGrid`)

```css
grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
```

Expected approximate density:

```txt
1920px  → ~5 columns
1440px  → ~4–5 columns
1280px  → ~4 columns
768px   → ~3 columns
390px   → ~2 columns
```

Requirements:

- Image-first browsing; preserve square (1:1) thumbnail aspect
- Filename readable; lightweight metadata only (e.g. size · date)
- Lazy image loading (`sizes` aligned to ~220px+ cards)
- No management controls on cards — Drawer remains the action surface
- Selection indicators for Picker multi-select (existing) remain allowed

### Inventory header (Library + Picker)

Inventory answers: **“How many assets are in this scope?”**

| Context | Title | Subtitle |
|---------|-------|----------|
| All files | All Files | `{total} assets` |
| Folder | `{folder.name}` | `{total} assets` |
| Active search | Search Results | `{total} assets` |
| Empty | — | Empty state copy |

Do **not** use global library totals when filters are active.  
Do **not** require “across N folders” copy in this refinement.

Loaded-count copy belongs with pagination (footer), not the inventory subtitle.

### Load More (shared)

Footer pattern:

```txt
Showing {loadedCount} of {total} assets
[ Load More ]
```

- Hide Load More when `!hasMore` or `total === 0`
- While loading more: keep existing cards; button shows loading / disabled
- `loadedCount` = number of items currently in the client list

### Loading states

| Event | Behavior |
|-------|----------|
| Initial load | Show grid skeleton |
| Query change (folder / search / filter / sort) | Clear items → show grid skeleton → load page 1 |
| Load More | Keep existing items → loading on button only |

Do **not** flash empty state (“No assets found”) for 200–500ms during query transitions.

### Folder sidebar (Library only)

- Flat folders only (unchanged architecture)
- Count badges allowed; improve spacing / active state
- **Not allowed:** nested folders, tree navigation, breadcrumb hierarchy

### Asset Drawer

Unchanged responsibilities:

- Preview, metadata, Copy URL, Download
- Library: Rename, Move, Delete, Save Metadata
- Picker: select + view only (no manage actions)

### Picker

Uses the same:

- MediaToolbar (search / filter / sort)
- Inventory header semantics
- MediaGrid density
- Load More + pagination API

Differs only by Drawer `mode="picker"` and URL-string selection contract.

---

## Success criteria

A content editor should be able to:

1. Find and recognize assets faster via larger thumbnails  
2. See inventory for the **current** scope immediately  
3. Browse hundreds/thousands of assets without loading the full set  
4. Experience the same browse behavior in Library and Picker  
5. Manage assets only through the Drawer  
6. Avoid empty-state flash on query changes (skeleton instead)

Target library sizes: 500 · 1,000 · 5,000+ assets (paginated; no full-library render).

---

## Explicit non-goals

```txt
✗ media_id / MediaReference
✗ Usage tracking / Used In / Unused
✗ Safe delete / ownership / Needs Review
✗ Bulk actions / new multi-select workflows / ZIP download
✗ Upload redesign / drag-drop / queues
✗ Nested folders / tree / breadcrumbs
✗ Storage providers / CDN / variants
✗ Infinite scroll
✗ counts{} analytics payload
✗ “across N folders” inventory copy
✗ New browse endpoint or parallel MediaBrowsePanel
```

---

## Relationship to V2 MVP docs

| Doc | Relationship |
|-----|----------------|
| [03-ui-spec.md](./03-ui-spec.md) | Base UI; this addendum overrides grid density and adds pagination/inventory/loading rules |
| [04-mvp-scope.md](./04-mvp-scope.md) | Foundation MVP remains; this is a scoped refinement, not a new initiative |
| [05-future-roadmap.md](./05-future-roadmap.md) | Cursor pagination, nested folders, usage, etc. stay deferred |

---

## Acceptance gate

Implementation planning may begin when:

- [x] Section 1 — API / pagination / inventory scope approved  
- [x] Section 2 — UI density / Load More / skeleton approved  
- [x] Section 3 — Success criteria / non-goals / location approved  
- [x] Spec file reviewed by product/engineering  
- [x] Implementation plan written (`docs/superpowers/plans/2026-08-12-media-layout-refinement.md`)  

---

## Suggested implementation slices (planning aid)

1. Extend `mediaListSchema` + `GET /api/media` with `page`/`take` + response metadata  
2. Shared Load More + inventory + skeleton wiring in Library and Picker  
3. `MediaGrid` density + lazy image sizes  
4. Folder sidebar polish (flat only)  
5. Focused tests for pagination math / `hasMore` / query reset behavior  
