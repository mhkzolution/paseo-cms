# Post Banner + Album Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-post banner desktop/mobile fields and an event-style album to admin posts, and show them on `/news/[slug]`.

**Architecture:** Mirror the event album write path (`PostImage` + `syncPostRelations`). Store banners as optional string columns on `Post`. Public news page uses post banners when set, otherwise the home carousel; album reuses the event lightbox gallery pattern.

**Tech Stack:** Next.js, Prisma, Zod, react-hook-form, existing `CoverImageField` / `AlbumImagesField` / `EventAlbumGallery`

---

### Task 1: Schema + validator

**Files:**
- Modify: `prisma/schema.prisma` (`Post` model)
- Create: migration via `npx prisma migrate dev`
- Modify: `validators/content.validator.ts` (`postSchema`)
- Modify: `tests/content-validator.test.ts` if post fixtures exist

- [ ] Add `bannerDesktop String?` and `bannerMobile String?` to `Post`
- [ ] Add to `postSchema`:
  - `bannerDesktop: optionalText`
  - `bannerMobile: optionalText`
  - `images` array identical to `eventSchema.images`
- [ ] Update validator test fixtures with empty banners/`images: []` if required
- [ ] Run migrate

### Task 2: Write path

**Files:**
- Modify: `lib/post-write.ts` — sync `postImage` like `event-write.ts`
- Modify: `app/api/posts/route.ts`
- Modify: `app/api/posts/[id]/route.ts`

- [ ] Extend `syncPostRelations` values with `images` and delete/create `postImage`
- [ ] Destructure `images` from parsed data; pass into sync; persist banner fields on post create/update

### Task 3: Admin form

**Files:**
- Modify: `features/content/post-editor-form.tsx`
- Modify: `app/admin/posts/new/page.tsx`
- Modify: `app/admin/posts/[id]/edit/page.tsx`

- [ ] Import `AlbumImagesField`
- [ ] Add Banner desktop / Banner mobile `CoverImageField` controllers
- [ ] Add album field after content
- [ ] Default values: `bannerDesktop: ""`, `bannerMobile: ""`, `images: []` (edit: map from DB)

### Task 4: Public banner

**Files:**
- Modify: `features/news/news-page-banner.tsx`
- Possibly create: `features/news/news-post-banner.tsx`
- Modify: `app/(site)/news/[slug]/page.tsx`

- [ ] Accept optional `bannerDesktop` / `bannerMobile`
- [ ] If either set: responsive static images (mobile `< md`, desktop `md+`; single-size fallback)
- [ ] Else: existing home `BannerCarousel`
- [ ] Match compact frame aspect classes

### Task 5: Public album

**Files:**
- Modify: `features/events/event-album-gallery.tsx` → generalize title/props (or thin news wrapper)
- Modify: `app/(site)/news/[slug]/page.tsx`
- Modify: `features/news/news-post-section.tsx` if album should sit inside section; otherwise place after `NewsPostSection` inside scroll shell

- [ ] Include `images` in post query
- [ ] Render gallery when non-empty with title `อัลบั้มรูปภาพ`

### Task 6: Smoke check

- [ ] Typecheck / relevant tests
- [ ] Manual checklist from spec Testing section
