# Media Library V2 — Future Roadmap

**Status:** Deferred work only — not part of V2 MVP execution  
**Related:** [01-overview.md](./01-overview.md) · [04-mvp-scope.md](./04-mvp-scope.md)

---

## Boundary

```txt
Media Library V2 MVP
= UX + Metadata on existing Media

Media Platform Initiative
= References + Usage + Processing + Storage + Enterprise
```

Nothing in this document is required to close Media Library V2 MVP.

---

## Media Platform Initiative — recommended sequence

| Phase | Focus | Depends on |
|-------|--------|------------|
| **P1** | Media references (`media_id` / `*ImageId`) | V2 MVP shipped |
| **P2** | Usage tracking (`MediaUsage` / “Used in”) | P1 |
| **P3** | Safe delete (usage-aware confirm / block / force) | P2 |
| **P4** | Image processing (sizes + modern formats) | V2 metadata stable |
| **P5** | Storage abstraction (+ optional CDN) | P4 preferred, not strictly required |
| **P6** | Enterprise features | P2+ |

Dependency chain that must not be inverted:

```txt
P1 Media References
 → P2 Usage Tracking
 → P3 Safe Delete
```

Without durable media references, usage and safe delete cannot be trustworthy.

---

## P1 — Media references

Migrate content modules from URL strings to media IDs as the primary reference, for example:

```txt
Post.featuredImageId
Banner.desktopImageId
Banner.mobileImageId
Page.coverImageId
```

### Success condition

```txt
Media references become the canonical source of truth.

URL strings become derived values rather than primary references.
```

### Design note (not a migration plan)

```txt
Future: Content modules should migrate from URL strings
to media references.

Detailed migration planning belongs to Media Platform P1,
not Media Library V2 MVP.
```

---

## P2 — Usage tracking

Once references exist, record and display where assets are used:

```txt
Used in:
- Homepage Banner
- Summer Campaign
- Post #12
```

Enables analytics and safe-delete prerequisites.

---

## P3 — Safe delete

Before delete:

```txt
This asset is currently used in N locations.
```

Options may include Cancel, unlink, or Force Delete — exact UX is defined in a future P3 spec.

---

## P4 — Image processing

On upload / reprocess, generate derivatives:

```txt
Original
Large
Medium
Thumbnail
```

Format policy for the first processing phase:

```txt
WebP required
AVIF optional
```

AVIF remains optional because of higher operational/debug cost relative to WebP.

---

## P5 — Storage abstraction

Introduce a provider-agnostic storage layer:

```txt
StorageProvider
 → Local
 → Amazon S3
 → Cloudflare R2
 → MinIO
```

### Hard rule

```txt
Storage abstraction must be provider-agnostic.

No content module may depend on a specific storage provider.
```

CDN integration may follow once storage URLs are stably abstracted.

---

## P6 — Enterprise

Candidates after reference + usage foundations:

- Audit log (upload, rename, move, replace, delete)
- Version history / replace preserving public URL
- AI-assisted alt text / title / description
- Duplicate / similarity detection
- Smart content search
- Asset insights
- Restore-from-trash UI
- Bulk actions (move, delete, ZIP, bulk metadata)

---

## Also deferred (callouts)

### Nested folders

Potential enhancements (not V2):

```txt
- Nested folders (parentId)
- Folder tree navigation
- Breadcrumb navigation
- Recursive search
- Circular / self-parent validation
- Folder permissions
```

### Optional rename cleanup

```txt
Potential future changes:
Media → MediaAsset
media → media_assets

Not part of Media Library V2 MVP.
```

### Upload pipeline redesign

```txt
Drag & drop
Paste image
Multi-file queue
Progress / Cancel / Retry
Chunked upload
```

### Security misconceptions to avoid early

```txt
Folder permissions
Asset ownership / uploaded-by restrictions as folder security
```

In V2, folders are organizational only. Any permission model is a future initiative with its own threat model.

---

## Why this order

V1 content stores URL strings. Jumping to usage tracking, safe delete, replace-preserving-URL, or CDN without references leaves the system unable to answer:

```txt
Where is this file used?
```

Therefore Media Platform starts at **P1 references**, not at AI, CDN, or WebP.
