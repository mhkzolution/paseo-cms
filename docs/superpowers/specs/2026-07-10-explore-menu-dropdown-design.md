# Explore Menu Dropdown Design

**Date:** 2026-07-10  
**Status:** Approved  
**Scope:** `paseo-cms/features/layout/site-header.tsx` — Explore menu overlay only

## Goal

Replace the full-screen Explore menu with a dropdown panel under the header, and allow closing by clicking the translucent backdrop (outside the panel).

## Behavior

- Panel: white dropdown anchored below tier-1 header (`absolute left-0 right-0 top-full`), height follows content, with `max-h` + internal scroll if needed
- Backdrop: `fixed inset-0` translucent (`bg-black/20`), click closes menu
- Close triggers: backdrop click, hamburger toggle, X button, Escape, selecting a nav link/section
- Keep `body { overflow: hidden }` while menu is open
- Mirror the existing `SiteSearchPanel` pattern for consistency

## Non-goals

- Redesigning nav items, labels, or utility links
- Changing search panel behavior
- Animation polish beyond matching search (optional later)

## Implementation

Refactor `ExploreMenuOverlay` in `site-header.tsx`:

1. Render overlay inside the tier-1 header container (same stacking context as search), not as a sibling full-viewport white sheet
2. Structure: backdrop button + panel (like `SiteSearchPanel`)
3. Remove full-viewport white `fixed inset-0 bg-white` shell and the redundant inner logo/title bar if it duplicates the sticky header (keep X if useful; hamburger toggle already closes)
4. Preserve section-nav vs route-nav content and utility footer links

## Acceptance

- Menu is not full-screen white
- Page content remains visible under the dimmed backdrop
- Click outside the panel closes the menu without using the hamburger/X
- Escape and item selection still close the menu
