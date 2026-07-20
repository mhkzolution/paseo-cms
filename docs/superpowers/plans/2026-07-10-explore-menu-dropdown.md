# Explore Menu Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change Explore menu from full-screen overlay to a dropdown panel with click-outside (backdrop) dismiss, matching `SiteSearchPanel`.

**Architecture:** Refactor `ExploreMenuOverlay` to render a translucent backdrop button + content-height panel under the tier-1 header. Move the overlay into the header stacking context alongside search.

**Tech Stack:** React, Next.js, Tailwind CSS (existing `site-header.tsx`)

---

### Task 1: Refactor ExploreMenuOverlay layout

**Files:**
- Modify: `paseo-cms/features/layout/site-header.tsx`
- Reference: `paseo-cms/features/search/site-search-panel.tsx` (backdrop + panel pattern)

- [x] **Step 1:** Replace full-screen white shell with:
  - `button.fixed.inset-0.z-40.bg-black/20` → `onClick={onClose}`
  - Panel: `absolute left-0 right-0 top-full z-50 border-b border-black/8 bg-white shadow-lg`
- [x] **Step 2:** Drop redundant inner title/logo bar; keep nav list + utility links; add `max-h-[min(70vh,640px)] overflow-y-auto` on nav
- [x] **Step 3:** Render overlay inside tier-1 header `div` (next to `SiteSearchPanel`), remove sibling render at bottom of component
- [x] **Step 4:** Remove unused `siteLogo` prop from overlay if no longer needed; keep Escape handler
- [x] **Step 5:** Manually verify: open menu → not full white screen; click backdrop → closes; Escape/hamburger/link still close

**Done when:** Acceptance criteria in `docs/superpowers/specs/2026-07-10-explore-menu-dropdown-design.md` pass.
