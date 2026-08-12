# Media Library V2 — UI Specification

**Status:** Spec locked  
**Route:** `/admin/media`  
**Related:** [01-overview.md](./01-overview.md) · [04-mvp-scope.md](./04-mvp-scope.md)

---

## Design principle

```txt
Library  = Asset Management
Picker   = Asset Selection + View
```

Both surfaces share the **Media UX Kit** so preview and asset information behave consistently.

---

## Media UX Kit (shared)

| Component | Responsibility |
|-----------|----------------|
| Search | Match `filename`, `title`, `altText` |
| Filter | All · Images · PDF · Videos |
| Sort | Newest · Oldest · Name A–Z · Name Z–A |
| Media Grid | Thumbnail / type icon cards |
| Asset Drawer | Preview, metadata sections, actions |

Filter mapping uses existing `Media.type` (`IMAGE` | `PDF` | `VIDEO`) only. Do not add a separate “Documents” filter in V2 MVP — it would duplicate PDF given the current enum. Additional document types are a future concern if `MediaType` expands.

---

## Library — `/admin/media`

### Layout

```txt
┌──────────────┬────────────────────────────┐
│ Flat folders │ Toolbar                    │
│              │ Search · Filter · Sort     │
│ Create       │ Upload (V1 Choose File)    │
│ Rename       ├────────────────────────────┤
│ Delete       │ Grid                       │
│              │ Click card → Asset Drawer  │
└──────────────┴────────────────────────────┘
```

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Side folder list + main grid |
| Tablet / Mobile | Stacked; folders collapsible; Drawer full-screen or large sheet |

### Folder panel

- Flat list only
- Actions: Create, Rename, Delete
- No tree, expand/collapse hierarchy, or breadcrumbs

### Toolbar

- Search placeholder: `Search media...`
- Filters and sort as defined in the Media UX Kit
- Upload: **V1 Choose File → Upload** only

### Grid cards

Display:

- Thumbnail (images) or type icon (PDF / video)
- Filename
- Size
- Upload date

Hover may emphasize the card; **do not** place Copy URL on the card itself.

```txt
Copy URL is available only from the Drawer,
not directly from grid cards.
```

---

## Asset Drawer (shared)

Opened by selecting an asset in Library or opening details in Picker.

### Sections

#### 1. Preview

| Type | Behavior |
|------|----------|
| IMAGE | Inline image preview |
| PDF | Icon + open/preview affordance (browser-capable) |
| VIDEO | Placeholder / basic preview if already feasible; no new video player project in MVP |

#### 2. Asset Information (system metadata)

| Field | Empty display |
|-------|---------------|
| Filename | always present |
| Original name | `—` if null |
| Size | formatted bytes |
| Mime type | `—` if null |
| Extension | `—` if null |
| Dimensions | `W × H` for images; `—` when null / non-image |
| Created At | always present (read-only) |
| Updated At | always present (read-only) |

Missing system metadata is **not** an error state.

#### 3. SEO Metadata (editorial)

Editable **in Library only**:

- Alt Text
- Title
- Caption

#### 4. Actions

| Action | Library | Picker |
|--------|---------|--------|
| Copy URL | Yes | Yes |
| Download | Yes | Yes |
| Rename | Yes | No |
| Move (folder) | Yes | No |
| Delete | Yes | No |
| Save Metadata | Yes | No |
| Select / Insert | — | Yes (primary) |

### Save Metadata (Library)

Normative flow — must not be ambiguous:

```txt
Edit Metadata
 ↓
Save Metadata (explicit button)
 ↓
Persist to database
 ↓
Drawer shows saved values
```

```txt
Metadata changes are explicitly saved.
No auto-save in V2 MVP.
```

- Editorial fields use an explicit **Save Metadata** control
- Typing in Alt / Title / Caption must **not** persist until Save
- Unsaved changes should warn on Drawer close when dirty (recommended UX; exact pattern is implementation detail)

### Delete flow (Library)

```txt
Delete
 → Confirm dialog
 → Soft-delete (deletedAt)
 → Asset removed from default Library / Picker queries
```

Confirm dialog must not mention usage counts or references.

---

## Media Picker

Used by content editors (Post, Event, Promotion, Banner, Page, SEO image flows, and any existing consumer of `MediaPickerDialog`).

### Capabilities

| Capability | Supported |
|------------|-----------|
| Search / Filter / Sort | Yes (shared kit) |
| Preview via Drawer | Yes |
| View system + editorial metadata | Yes (read-focused) |
| Copy URL (Drawer only) | Yes |
| Download | Yes |
| Select / Insert | Yes → returns **URL string** |
| Edit + Save metadata | No (manage in Library) |
| Upload | V1 Choose File only |

### Picker manage actions (explicit)

```txt
Rename  ❌
Move    ❌
Delete  ❌
Save Metadata ❌
```

These controls must not appear in Picker Drawer mode. Asset lifecycle management stays on `/admin/media` only.

### Return value

```txt
Picker Result → URL String
```

Content fields remain:

```txt
featuredImage / bannerDesktop / coverImage / … = string URL
```

No `mediaId` / `featuredImageId` in this phase.

### Why Picker cannot manage assets

Editors selecting an image while writing content must not rename, move, or delete library assets. Ownership of asset lifecycle stays on `/admin/media`.

---

## Search, filter, sort behavior

| Rule | Detail |
|------|--------|
| Folder scope | Current folder (plus existing V1 “all / unfiled” behavior if already present) |
| Nested recursion | None — folders are flat |
| Soft-deleted | Excluded from all default queries |
| Null metadata | Search matches only fields that have values; nulls do not error |
| Sort newest/oldest | By `createdAt` |
| Sort name | By `filename` (A–Z / Z–A) |

---

## Upload UX (unchanged)

```txt
Choose File → Upload
```

Out of scope for UI:

```txt
Drag & drop
Paste upload
Multi-file queue UI
Progress / Cancel / Retry pipeline
```

New uploads must still populate supported system metadata on the server (see domain model).

---

## Explicit UI non-goals

```txt
Multi-select actions
Bulk metadata editing
Bulk download ZIP
Asset version history
Restore from trash UI
“Used in” / usage panel
Replace file preserving URL
Nested folder tree / breadcrumbs
Copy URL on grid cards
Auto-save editorial metadata
```

---

## Consistency requirement

Media Picker and Media Library must render the same asset information and preview behavior through the shared Asset Drawer component.
