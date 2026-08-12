# Media Library V2 — Domain Model

**Status:** Spec locked  
**Related:** [01-overview.md](./01-overview.md) · [04-mvp-scope.md](./04-mvp-scope.md)

---

## Naming convention

| Concept | Spec / product term | Prisma implementation |
|---------|---------------------|------------------------|
| Uploaded file | Media Asset | `Media` |
| Organization unit | Media Folder | `MediaFolder` |

```txt
Media Asset
(represents an uploaded file)

Current Prisma implementation:
Media
```

- Do **not** rename `Media` → `MediaAsset` in V2 MVP
- Do **not** rename table `media` → `media_assets`
- Optional rename remains a future Media Platform cleanup item

---

## Prisma strategy: expand in place

V2 MVP extends the existing `Media` model. No domain separation into `MediaAsset`, `MediaReference`, or `MediaUsage`.

Preserve:

- Existing `@id` UUID strategy (do not switch to `cuid()` in this phase)
- Existing `MediaType` enum (`IMAGE` | `PDF` | `VIDEO`) for filter/type UX
- Existing soft-delete via `deletedAt`
- Existing `path`-based local storage

---

## `Media` model (target shape)

Conceptual Prisma shape for V2 MVP:

```prisma
model Media {
  id        String     @id @default(uuid())
  folderId  String?
  filename  String
  path      String
  type      MediaType
  size      Int

  // System metadata (nullable for historical assets)
  originalName String?
  mimeType     String?
  extension    String?
  width        Int?
  height       Int?

  // Editorial / SEO metadata (nullable)
  altText   String?
  title     String?
  caption   String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  folder MediaFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)

  @@index([folderId])
  @@index([deletedAt])
  @@map("media")
}
```

Exact migration SQL is an implementation concern; field intent above is normative.

### Metadata categories

| Category | Fields | Purpose |
|----------|--------|---------|
| **System** | `originalName`, `mimeType`, `extension`, `width`, `height` | File facts — populated on upload / backfill |
| **Editorial** | `altText`, `title`, `caption` | SEO / content — edited in Library Drawer |

Drawer UI must present these as separate sections:

```txt
Asset Information   → system metadata
SEO Metadata        → editorial metadata
```

### Dimension rules

```txt
width and height are only populated for image assets.

Non-image assets must store null values.
```

Do not attempt dimension extraction for PDF or VIDEO in V2 MVP.

### Type vs mime

| Field | Role |
|-------|------|
| `type` (`MediaType`) | Coarse filter: All / Images / PDF / Videos |
| `mimeType` | Fine-grained MIME when known |
| `extension` | File extension without requiring path parsing at read time |

---

## `MediaFolder` model (flat only)

```prisma
model MediaFolder {
  id        String    @id @default(uuid())
  name      String
  slug      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  media Media[]

  @@index([deletedAt])
  @@map("media_folders")
}
```

### Explicit folder constraints

```txt
NO parentId
NO nested folders
NO folder tree
NO folder breadcrumbs
NO recursive search across hierarchy
```

Example flat list (illustrative):

```txt
logo
posts
events
directory
floor-plans
```

Folder actions in MVP: **Create**, **Rename**, **Delete**.

Folders are an **organization** aid only — not a security boundary (no folder permissions in V2).

---

## Metadata population rules

| Case | Behavior |
|------|----------|
| Schema migration | All new metadata fields are **nullable** |
| New uploads | Must populate all supported system metadata (`originalName`, `mimeType`, `extension`, and `width`/`height` when `type = IMAGE`) |
| Historical assets | Remain valid with nulls; UI shows `—` |
| Editorial fields | Optional; empty until editors Save from Library |

```txt
Media metadata is optional for historical assets.

New uploads must populate all supported metadata.
```

---

## Hybrid backfill

**Strategy:** Hybrid (leaning toward safe deploy)

1. Deploy schema with nullable columns — no blocking data migration
2. New uploads write complete supported metadata immediately
3. Optional best-effort command enriches historical rows

### Command

```txt
media:backfill
```

(Exact npm script name is an implementation detail; behavior is normative.)

### Behavior

```txt
Read Media row
 → File exists on disk?
 → Extract metadata
 → Update row
```

Best-effort rules:

- Missing file → skip + log warning + continue
- Corrupted / unreadable image → skip + log warning + continue
- Job must **not** fail the entire run on individual errors
- Must **not** block deployment or application startup

### Backfill scope lock

```txt
media:backfill only enriches metadata.
It must not rename, move, or modify file paths.
```

---

## Soft delete

### Flow

```txt
Delete action
 → Light confirm dialog
 → deletedAt = now()
 → Hidden from Media Library and Picker
```

### Confirm copy (normative intent)

```txt
Delete Asset

This asset will be removed from the Media Library.

You can restore it later if recovery is supported by the system.

[Cancel]  [Delete]
```

Do **not** claim usage counts or reference checks. The system cannot know content usage in V2 MVP.

### Visibility rule

```txt
Soft-deleted assets must be excluded from
all default Library and Picker queries.
```

### Explicit non-goals for delete

```txt
Usage Tracking
Used In
Dependency Check
Safe Delete
Reference Validation
Restore-from-trash UI
```

```txt
Deletion remains soft-delete based.

The system does not check content usage,
references, dependencies, or relationships
before deletion.

Usage-aware deletion is deferred to a future
Media Platform initiative.
```

---

## Content module contract (unchanged)

Content continues to store URL strings, for example:

```txt
featuredImage      String?
bannerDesktop      String?
bannerMobile       String?
coverImage         String?   // conceptual; field names vary by model
```

Picker selection still returns a **URL string** (typically derived from `Media.path`), not a media ID.

---

## Explicitly not introduced

| Model / concern | Status |
|-----------------|--------|
| `MediaAsset` table | Not introduced |
| `MediaReference` | Deferred |
| `MediaUsage` | Deferred |
| `storageProvider` | Deferred |
| Variants / `thumbnailUrl` | Deferred |
| `uploadedBy` restrictions | Deferred |
| Folder `parentId` | Deferred |

---

## Implementation notes

- Keep existing indexes on `folderId` and `deletedAt`
- Consider indexes for search fields only if query plans require them after measurement
- `type` remains the primary filter key; do not replace it with `mimeType` parsing in MVP
