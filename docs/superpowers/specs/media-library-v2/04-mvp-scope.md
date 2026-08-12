# Media Library V2 — MVP Scope Lock

**Status:** Locked  
**Related:** [01-overview.md](./01-overview.md) · [03-ui-spec.md](./03-ui-spec.md) · [05-future-roadmap.md](./05-future-roadmap.md)

---

## One-line definition

```txt
Media Library V2 MVP
= UX + Metadata Layer

NOT
= Media Platform
```

---

## Spec contract

> Media Library V2 MVP enhances the existing media subsystem through a shared Media UX Kit, expanded metadata support, and improved asset management workflows. The upload workflow remains unchanged from V1. Media references, usage tracking, safe delete, storage abstraction, processing pipelines, and advanced upload capabilities are explicitly out of scope and deferred to a future Media Platform initiative.

---

## Direction lock

| Decision | Choice |
|----------|--------|
| Delivery path | `docs/superpowers/specs/media-library-v2/` |
| Approach | Shared Media UX Kit (Library + Picker) |
| Prisma | Expand `Media` in place |
| Folders | Flat only |
| Backfill | Hybrid (nullable + complete new uploads + best-effort command) |
| Delete | Soft-delete + light confirm |
| Content refs | URL strings unchanged |
| Upload | V1 Choose File |
| Metadata save | Explicit Save (no auto-save) |

---

## In scope

| Area | Deliverable |
|------|-------------|
| Schema | Nullable system + editorial metadata on `Media` |
| Folders | Flat Create / Rename / Delete |
| Media UX Kit | Shared Search, Filter, Sort, Grid, Asset Drawer |
| Library `/admin/media` | Full manage: preview, copy URL, download, rename, move, delete (confirm), Save Metadata |
| Picker | Select + view; search/filter/sort; drawer preview/metadata/copy URL; returns URL string |
| Upload | Unchanged V1; new uploads populate supported metadata |
| Backfill | Best-effort `media:backfill` (enrich only) |
| Delete | Soft-delete + confirm; excluded from default queries |

---

## Capability matrix

| Action | Library | Picker |
|--------|---------|--------|
| Search / Filter / Sort | Yes | Yes |
| Preview (Drawer) | Yes | Yes |
| View metadata | Yes | Yes |
| Edit + Save metadata | Yes | No |
| Copy URL (Drawer only) | Yes | Yes |
| Download | Yes | Yes |
| Rename / Move / Delete | Yes | No |
| Select / Insert | — | Yes → URL string |
| Upload | V1 | V1 |

---

## Out of scope (explicit)

### Media Platform concerns

```txt
- Media references (media_id / featuredImageId / …)
- Content model migrations away from URL strings
- MediaReference / MediaUsage models
- Usage tracking / “Used in”
- Safe delete / dependency checks
- Storage abstraction / CDN
- Asset variants / WebP / AVIF pipelines
- Upload pipeline redesign (drag-drop, paste, queue, retry, cancel)
- Media → MediaAsset table rename
```

### Organization / security / ops

```txt
- Nested folders / folder trees / breadcrumbs / recursive search
- Folder permissions
- Asset ownership / uploaded-by restrictions
```

### UX extras

```txt
- Multi-select actions
- Bulk metadata editing
- Bulk download ZIP
- Asset version history
- Replace file preserving URL
- Restore-from-trash UI
- Copy URL on grid cards
- Auto-save editorial metadata
```

### Deletion note

```txt
Deletion remains soft-delete based.

The system does not check content usage,
references, dependencies, or relationships
before deletion.

Usage-aware deletion is deferred to a future
Media Platform initiative.
```

---

## Success criteria

1. Library and Picker use the same Media UX Kit component set  
2. New uploads have complete supported system metadata; historical assets may be partial; backfill is best-effort  
3. Editorial metadata can be edited and explicitly saved in the Library Drawer  
4. Soft-deleted assets do not appear in default Library or Picker queries  
5. Content modules continue to work with URL strings without migration  
6. Media Picker and Media Library render the same asset information and preview behavior through the shared Asset Drawer component  

---

## Non-goals reminder for implementers

```txt
Media Library V2 MVP introduces a shared Media UX Kit
used by both the Media Library and Media Picker.

Upload workflow remains unchanged from V1.

Advanced upload pipeline features are explicitly
out of scope.
```

Do not start Media Platform P1 (`media_id` migration) under this MVP ticket unless a separate initiative is opened.

---

## Suggested implementation slices (planning aid)

Not a substitute for the formal implementation plan:

1. Prisma expand + upload metadata write path  
2. Asset Drawer + Library integration (incl. Save Metadata, delete confirm)  
3. Shared search/filter/sort wiring  
4. Picker adoption of UX Kit (select + view; no manage actions)  
5. `media:backfill` command  

---

## Exit to next phase

After V2 MVP ships and is accepted, planning continues under **Media Platform Initiative** starting at **P1 Media References** — see [05-future-roadmap.md](./05-future-roadmap.md).
