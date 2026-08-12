# Media Library V2 — Overview

**Status:** Spec locked — awaiting implementation plan  
**Phase:** Foundation MVP (UX + Metadata)  
**Type:** Design specification  
**Route:** `/admin/media`  
**Date:** 2026-08-12

---

## Purpose

Media Library V2 MVP enhances the existing ThePaseo CMS media subsystem with a shared **Media UX Kit**, expanded asset metadata, and improved management workflows.

```txt
Media Library V2 MVP enhances the existing
media subsystem.

It is not a Media Platform replacement.
```

It is **not** a replacement architecture and **not** the Media Platform Initiative.

```txt
Media Library V2 MVP
= UX + Metadata Layer on existing Media

Media Platform Initiative (future)
= References + Usage + Processing + Storage
```

---

## Current state (V1)

| Area | Today |
|------|--------|
| Prisma | `Media` — `filename`, `path`, `type`, `size`, `folderId?` |
| Folders | Flat `MediaFolder` — `name`, `slug` |
| Library | `/admin/media` — grid, upload, soft-delete |
| Picker | Used by Post / Event / Promotion / Banner editors |
| Content fields | URL strings (`featuredImage`, `bannerDesktop`, `bannerMobile`, etc.) |
| Storage | Local path — no provider abstraction |

Content modules do **not** store `media_id`. Usage tracking and safe delete are therefore not reliable yet and are deferred.

---

## Architecture overview

```txt
┌─────────────────────────────────────────────┐
│              Media UX Kit (shared)          │
│  Asset Drawer · Search · Filter · Sort      │
└───────────────┬───────────────┬─────────────┘
                │               │
        /admin/media      Media Picker
        (full manage)     (select + light view)
                │               │
                └───────┬───────┘
                        ▼
              Prisma `Media` (expanded)
              + flat `MediaFolder`
              + local path storage (unchanged)
```

### Architecture notes

```txt
Media Library V2 MVP is an enhancement of the existing
Media subsystem and not a replacement architecture.

No content model migrations are included.

No MediaReference, MediaUsage, or MediaAsset
domain separation is introduced in this phase.
```

---

## Goals

1. Centralize preview and asset actions through a shared Asset Drawer
2. Expand Media metadata (system + editorial) without renaming the Prisma model
3. Improve discoverability via shared search, filter, and sort
4. Keep Library = manage and Picker = select + view
5. Preserve V1 upload and URL-string content contracts
6. Ship within a 1–2 sprint Foundation scope

---

## Rules

| Rule | Detail |
|------|--------|
| Domain language | Spec term **Media Asset**; Prisma model **`Media`** |
| Content references | Modules continue to store **URL strings** |
| Upload | Unchanged from V1 (Choose File → Upload) |
| Folders | Flat only — no `parentId`, tree, or breadcrumbs |
| Metadata | Optional for historical assets; **new uploads must populate all supported metadata** |
| Delete | Soft-delete + light confirm; no usage check |
| IDs | Preserve existing UUID strategy on `Media` |

---

## Out of scope

```txt
- Media references (media_id)
- Usage tracking
- Safe delete
- Asset variants
- CDN integration
- Storage abstraction
- Upload pipeline redesign
- Nested folders / folder trees
- Media → MediaAsset table rename
- Folder permissions
- Asset ownership / uploaded-by restrictions
- Multi-select / bulk actions
- Restore-from-trash UI
```

See [04-mvp-scope.md](./04-mvp-scope.md) for the full lock and [05-future-roadmap.md](./05-future-roadmap.md) for deferred work.

---

## Documents

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Overview](./01-overview.md) | Vision, architecture, boundaries |
| 02 | [Domain model](./02-domain-model.md) | `Media`, folders, metadata, backfill, delete |
| 03 | [UI spec](./03-ui-spec.md) | Library, Picker, Drawer, search/filter/sort |
| 04 | [MVP scope](./04-mvp-scope.md) | In / out of scope, success criteria |
| 05 | [Future roadmap](./05-future-roadmap.md) | Media Platform Initiative phases |
| 06 | [Layout refinement](./06-layout-refinement.md) | Grid density, inventory, page pagination, Load More (Library + Picker) |

---

## Spec contract

> Media Library V2 MVP enhances the existing media subsystem through a shared Media UX Kit, expanded metadata support, and improved asset management workflows. The upload workflow remains unchanged from V1. Media references, usage tracking, safe delete, storage abstraction, processing pipelines, and advanced upload capabilities are explicitly out of scope and deferred to a future Media Platform initiative.

---

## Acceptance gate

Implementation planning may begin when:

- [x] Architecture overview approved
- [x] Domain model approved
- [x] UI specification approved
- [x] MVP scope locked
- [x] Future roadmap approved
- [ ] Spec files reviewed by product/engineering
- [ ] Implementation plan written (`docs/superpowers/plans/…`)
