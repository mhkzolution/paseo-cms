# Post Banner + Album Design

**Date:** 2026-07-10  
**Status:** Approved  
**Scope:** `paseo-cms` admin posts editor, post write API, public `/news/[slug]`

## Problem

Posts support a cover/thumbnail (`featuredImage`) for list cards and `/admin/posts`, but editors cannot:

1. Set per-post **banner desktop** and **banner mobile** images
2. Attach a multi-image **album** like events

The news detail page currently always shows the shared home banner carousel and has no album section.

## Goals

- Admin can set optional `bannerDesktop` and `bannerMobile` on a post
- Admin can manage an album of images (upload / media library, reorder, alt, caption) like events
- Public `/news/[slug]` shows the post’s banners when set; otherwise falls back to the home carousel
- Public `/news/[slug]` shows the album below content with grid + lightbox (same UX as event album)
- Cover (`featuredImage`) remains the thumbnail for post lists and admin table only

## Non-goals

- Multi-slide carousel per post (one desktop + one mobile image)
- Changing TipTap in-content image gallery behavior
- Adding banners/album to promotions
- Replacing cover with banner fields

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Architecture | Approach A — mirror event patterns |
| Cover vs banner | Separate; cover = list/admin thumbnail |
| Banner public display | Full: use post banners when present, else home carousel |
| Album public display | Full: like event album under content |
| Album storage | Existing `PostImage` model |

## Data model

### Post fields (new)

```prisma
bannerDesktop String?
bannerMobile  String?
```

### Album (existing)

`PostImage` already exists (`url`, `alt`, `caption`, `sortOrder`, soft delete). Wire it through validator, `syncPostRelations`, admin form, and news page — same pattern as `EventImage`.

## Admin UX (`PostEditorForm`)

On Content tab, after Cover fields:

1. **Banner desktop** — `CoverImageField` bound to `bannerDesktop`
2. **Banner mobile** — `CoverImageField` bound to `bannerMobile`

After Content rich text:

3. **อัลบั้มรูปภาพ** — `AlbumImagesField` bound to `images` (reuse shared component)

New/edit pages pass default values for the new fields and load `images` ordered by `sortOrder`.

## API / write path

- Extend `postSchema` with `bannerDesktop`, `bannerMobile` (optional text) and `images` array (`url`, `alt?`, `caption?`) matching event schema
- Create/update post API routes persist banner fields on `Post` and pass `images` into `syncPostRelations`
- `syncPostRelations` deletes existing `PostImage` rows for the post and recreates from the payload (same as events)

## Public `/news/[slug]`

### Banner

Update `NewsPageBanner` (or page wiring) to accept optional post banner URLs:

- If `bannerDesktop` or `bannerMobile` is set → render a static responsive banner:
  - Desktop image: visible from `md` up (`hidden md:block` or picture/`srcset` pattern)
  - Mobile image: visible below `md`
  - If only one size is set, use that image for both breakpoints
- If neither is set → keep current `getBannersForPlacement("home")` + `BannerCarousel` compact

Stay inside `NewsPostScrollShell` (locked banner, scroll content below).

### Album

- Include `images` on the post query (`deletedAt: null`, `orderBy: sortOrder`)
- Below post content (inside the scroll area, before OTHER NEWS), render album gallery
- Prefer extracting shared gallery from `EventAlbumGallery` (rename/generalize props + default title) or thin `NewsAlbumGallery` wrapper reusing the same lightbox UX
- Default title: e.g. `อัลบั้มรูปภาพ` (or pass from page)
- Hide section when `images.length === 0`

### Cover in article body

`NewsPostSection` may still show `featuredImage` as in-article cover if that is current behavior — do not swap it for banner fields.

## File touch list (expected)

- `prisma/schema.prisma` — `bannerDesktop`, `bannerMobile` on `Post`
- Prisma migration
- `validators/content.validator.ts` — `postSchema`
- `lib/post-write.ts` — sync `images`
- `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`
- `features/content/post-editor-form.tsx`
- `app/admin/posts/new/page.tsx`, `app/admin/posts/[id]/edit/page.tsx`
- `features/news/news-page-banner.tsx` (and/or new post banner component)
- `app/(site)/news/[slug]/page.tsx`
- Shared or news-specific album gallery component
- Tests: content validator for new post fields if covered today

## Testing

- Create/edit post with both banners + album → reload admin → values persist
- Post with no banners → news page still shows home carousel
- Post with only desktop banner → mobile breakpoint still shows that image
- Post with album → grid under content; lightbox prev/next/thumbnails/Esc work
- Post with empty album → no album section
- Cover still drives list cards and `/admin/posts` table thumbnails

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Only one banner size set | Fall back to the other size for both breakpoints |
| `PostImage` unused historically | Wire carefully; empty default `[]` for old posts |
| Duplicating event gallery code | Extract shared album gallery or thin wrapper |
| Aspect ratio mismatch vs carousel | Match compact banner frame classes used on news page |

## Success criteria

- Admin can save banner desktop, banner mobile, and album on posts
- News detail uses post banners when present, else home carousel
- News detail shows album with lightbox when images exist
- Cover remains list/admin thumbnail only
