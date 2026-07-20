# News Detail Fixed Banner Scroll Design

**Date:** 2026-07-10  
**Status:** Approved  
**Scope:** `/news/[slug]` scroll behavior only

## Goal

Match a fixed-hero overlay scroll: banner stays fixed behind content; page scroll moves content over the banner.

## Behavior

- Banner: `position: sticky` below site header, `z-index: 0`, full width + `h-[calc(100dvh-4.5rem)]` (no aspect-ratio — avoids mobile width overflow). Sticky (not fixed) so the banner does not paint over the site footer.
- Content (article, album, other news): document scroll, `relative z-10`, opaque background `#FCFAF6`, `overflow-x-clip` on main
- Footer: `relative z-20` so it always stacks above the banner layer
- Remove locked viewport / inner-only scroll and remove viewport-`fixed` banner

## Non-goals

- Redesigning article layout to match The Mall Lifestore
- Changing banner image sources (post banners / home carousel stay)

## Implementation

Update `NewsPostScrollShell` (+ page wiring so Other News sits in the overlay content flow).
