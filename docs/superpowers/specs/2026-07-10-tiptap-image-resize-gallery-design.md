# TipTap Image Resize + Gallery Design

**Date:** 2026-07-10  
**Status:** Approved for implementation (pending user review of this spec)  
**Scope:** `paseo-cms` rich text editor + public HTML content styles

## Problem

Editors can insert images into TipTap content, but cannot:

1. Resize images in the editor
2. Place 2–3 images side-by-side in a column layout

Images always render full-width as stacked blocks.

## Goals

- Resize a selected image via drag handle **and** preset width buttons (25% / 50% / 75% / 100%)
- Create an image gallery that auto-columns by image count (2 → 2 cols, 3 → 3 cols; max 3)
- Insert gallery via toolbar multi-pick **or** wrap existing consecutive images
- Persist layout in saved HTML so public pages render the same way
- Keep existing single-image insert flow working

## Non-goals

- 4+ column galleries
- Drag-and-drop reordering inside a gallery (v1)
- Per-image crop / focal point
- Inline (text-wrapping) images
- Changing cover/featured image fields (only body rich text)

## Decisions (confirmed)

| Topic | Choice |
|-------|--------|
| Resize UX | Drag handle + preset buttons |
| Column count | Auto from image count, max 3 |
| Insert gallery | Both: multi-pick toolbar + wrap existing images |
| Architecture | Custom TipTap nodes (Approach A) |

## Architecture

### 1. Resizable Image extension

Replace / extend `@tiptap/extension-image` with a custom node view:

- Attributes: `src`, `alt`, `title`, `width` (percentage string, e.g. `"50%"`; default `"100%"`)
- When selected: show bottom-right resize handle
- Drag updates `width` (clamped ~15%–100% of editor content width)
- Toolbar presets call `updateAttributes({ width })` when an image is active
- Serialized HTML example:

```html
<img src="/uploads/..." alt="" width="50%" style="width: 50%; height: auto;" />
```

Existing content without `width` continues to render at 100%.

### 2. Image Gallery node

New TipTap node `imageGallery`:

- Content: one or more `image` nodes (min 2, max 3 for insert UX; schema may allow 1–3 for editing edge cases)
- Attribute: `columns` derived from child count (`Math.min(childCount, 3)`, minimum 2 when wrapping)
- Serialized HTML:

```html
<div class="image-gallery" data-columns="3">
  <img src="..." alt="" />
  <img src="..." alt="" />
  <img src="..." alt="" />
</div>
```

- Commands:
  - `insertImageGallery({ images: string[] })` — from multi-pick (2–3 paths)
  - `wrapImagesInGallery` — when selection/cursor context has 2–3 consecutive image nodes, wrap them
- Toolbar:
  - **Gallery** button → multi-select media picker (2–3 images)
  - **Columns** (or same Gallery when images selected) → wrap consecutive images

### 3. Media picker multi-select

Extend `MediaPickerDialog`:

- Optional `multiple?: boolean` and `maxSelections?: number` (default 3 for gallery)
- `onSelect` stays single-select for existing callers
- Add `onSelectMany?: (media: MediaItem[]) => void` when `multiple` is true
- Confirm button enabled when selection count is 2–3 (gallery) or 1+ as configured

### 4. RichTextEditor API

```ts
onPickImage?: () => Promise<string | null>;
onPickImages?: (max: number) => Promise<string[] | null>;
```

Forms that already wire `pickEditorImage` + `MediaPickerDialog` also wire multi-pick for gallery (posts, events, promotions, settings about fields).

### 5. Public / editor CSS

Shared rules (editor `.tiptap` + public prose content):

```css
.image-gallery {
  display: grid;
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.image-gallery[data-columns="2"] { grid-template-columns: repeat(2, 1fr); }
.image-gallery[data-columns="3"] { grid-template-columns: repeat(3, 1fr); }
.image-gallery img { width: 100%; height: auto; object-fit: cover; }

@media (max-width: 640px) {
  .image-gallery[data-columns="2"],
  .image-gallery[data-columns="3"] {
    grid-template-columns: 1fr;
  }
}
```

Public pages that use `dangerouslySetInnerHTML` for rich text must include these classes (global CSS is enough if selectors are not scoped only to `.tiptap`).

Override prose full-width image rules where needed so gallery children and percentage-width images are not forced to `w-full` incorrectly — gallery images stay `width: 100%` of their cell; standalone resized images honor inline `style="width: …%"`.

## UX details

### Resize

1. Click image → selection ring + handle
2. Drag handle horizontally → live width update
3. Or click 25 / 50 / 75 / 100 in toolbar
4. Deselect → handle hides; width remains

### Gallery create (picker)

1. Click Gallery toolbar button
2. Multi-select 2 or 3 images in media library → Confirm
3. Insert `imageGallery` at cursor with those images
4. `data-columns` = number of images

### Gallery create (wrap)

1. Place cursor among / select 2–3 consecutive block images
2. Click Columns / Gallery wrap action
3. Those images move into one `imageGallery` node

### Editing gallery (v1)

- Click gallery to select the block
- Delete gallery deletes the whole block
- Optional: delete individual image inside gallery via backspace (TipTap default node behavior)
- No reorder UI in v1

## File touch list (expected)

- `components/editor/rich-text-editor.tsx` — toolbar + extensions wiring
- `components/editor/extensions/resizable-image.ts` (or `.tsx` NodeView)
- `components/editor/extensions/image-gallery.ts`
- `features/media/media-picker-dialog.tsx` — multi-select mode
- Content/settings forms using `RichTextEditor` — `onPickImages`
- `app/globals.css` — gallery + resized image styles
- Possibly prose class tweaks on news/event/about content wrappers if `prose-img:w-full` fights percentage widths

## Testing

- Insert single image → resize via drag and presets → save → reload editor → width preserved
- Public post/event/about page shows same width
- Insert gallery of 2 and of 3 → columns correct on desktop, stacked on mobile
- Wrap two existing images into gallery
- Single-image picker still works for cover fields and editor Image button
- Empty / 1-image multi-select cannot confirm gallery insert

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `prose-img:w-full` overrides width | Scope CSS / use `!` or more specific `.image-gallery img` / `img[style*="width"]` rules |
| Old HTML without gallery class | Unchanged; still stacks as today |
| Multi-pick API churn across forms | Shared helper or small hook for editor image picking |
| NodeView complexity | Keep resize NodeView minimal; gallery can be non-NodeView container first if needed |

## Success criteria

- Editor can resize images with drag + presets
- Editor can create 2–3 column galleries via picker and via wrap
- Saved HTML round-trips correctly
- Public pages render galleries and widths without layout breakage on mobile
