# TipTap Image Resize + Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image resize (drag + presets) and 2–3 column auto galleries to the TipTap rich text editor, with matching public-page CSS.

**Architecture:** Custom TipTap `ResizableImage` NodeView + `ImageGallery` container node; extend `MediaPickerDialog` for multi-select; wire `onPickImages` through content/settings forms; global CSS for `.image-gallery` and percentage-width images.

**Tech Stack:** TipTap 2 (`@tiptap/react`, `@tiptap/extension-image`), React 19, Next.js 16, Tailwind

**Spec:** `paseo-cms/docs/superpowers/specs/2026-07-10-tiptap-image-resize-gallery-design.md`

---

## File map

| File | Role |
|------|------|
| `paseo-cms/components/editor/extensions/resizable-image.tsx` | Image node + resize NodeView |
| `paseo-cms/components/editor/extensions/image-gallery.ts` | Gallery container node + commands |
| `paseo-cms/components/editor/rich-text-editor.tsx` | Toolbar presets, gallery buttons, extensions |
| `paseo-cms/features/media/media-picker-dialog.tsx` | Multi-select mode |
| `paseo-cms/features/content/post-editor-form.tsx` | `onPickImages` wiring |
| `paseo-cms/features/content/event-editor-form.tsx` | same |
| `paseo-cms/features/content/promotion-editor-form.tsx` | same |
| `paseo-cms/features/settings/settings-form.tsx` | same |
| `paseo-cms/app/globals.css` | Gallery + resized image styles |
| `paseo-cms/features/news/news-post-section.tsx` | Soften `prose-img:w-full` conflict |
| `paseo-cms/app/(site)/events/[slug]/page.tsx` | Soften `prose-img:w-full` conflict |

---

### Task 1: ResizableImage extension

**Files:**
- Create: `paseo-cms/components/editor/extensions/resizable-image.tsx`

- [ ] **Step 1:** Create extension extending TipTap Image with `width` attribute and React NodeView (selection ring, bottom-right drag handle, clamp 15–100%).

- [ ] **Step 2:** Serialize `width` to HTML `style="width: X%; height: auto"` and parse back from style/width attrs.

---

### Task 2: ImageGallery extension

**Files:**
- Create: `paseo-cms/components/editor/extensions/image-gallery.ts`

- [ ] **Step 1:** Node `imageGallery` with content `image+`, attr `columns` (2|3), HTML `div.image-gallery[data-columns]`.

- [ ] **Step 2:** Commands `insertImageGallery({ srcs })` and `wrapImagesInGallery` (2–3 consecutive images).

---

### Task 3: Media picker multi-select

**Files:**
- Modify: `paseo-cms/features/media/media-picker-dialog.tsx`

- [ ] **Step 1:** Add `multiple?: boolean`, `maxSelections?: number`, `minSelections?: number`, `onSelectMany?: (items) => void`.

- [ ] **Step 2:** Toggle selection UI + Confirm button when multi mode; keep single-click select for existing callers.

---

### Task 4: Wire RichTextEditor toolbar

**Files:**
- Modify: `paseo-cms/components/editor/rich-text-editor.tsx`

- [ ] **Step 1:** Register ResizableImage + ImageGallery; add `onPickImages`.

- [ ] **Step 2:** Preset width buttons when image active; Gallery insert; Wrap-as-columns when 2–3 images available.

---

### Task 5: Wire forms

**Files:**
- Modify post/event/promotion/settings editor forms

- [ ] **Step 1:** Dual picker mode (single vs multi) sharing one dialog, or two dialogs; pass `onPickImages` to RichTextEditor.

---

### Task 6: CSS + public prose

**Files:**
- Modify: `paseo-cms/app/globals.css`
- Modify news/event prose wrappers

- [ ] **Step 1:** Global `.image-gallery` grid + mobile stack; `.tiptap` resize handle styles.

- [ ] **Step 2:** Ensure percentage-width standalone images are not forced full width by `prose-img:w-full`.

---

### Task 7: Manual verify

- [ ] Insert/resize/save/reload image
- [ ] Gallery 2 and 3 from picker
- [ ] Wrap existing images
- [ ] Public page renders correctly
