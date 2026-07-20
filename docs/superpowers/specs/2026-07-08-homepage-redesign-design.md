# Homepage Redesign Design

**Date:** 2026-07-08  
**Status:** Approved

## Summary

Replace the homepage with a dedicated shell: section navbar, banner, five anchor sections, and shared footer. Remove legacy home sections (Trend Update, Promotions, Brand Loyalty).

## Decisions

| Topic | Decision |
|-------|----------|
| Architecture | Home-only shell in `app/page.tsx`; delete `app/(site)/page.tsx` |
| Navbar | Sticky section links only (no Site Header) |
| Banner | Keep `BannerCarousel` above sections |
| Legacy sections | Remove Trend / Promotions / Brand Loyalty |
| Events | 3 latest; image, title, date, time, branch; link `/events` |
| News | 3 latest; 16:9 image, title, date; link `/news` |
| Introduction | Left: `paseo-frontviewmail.jpg`; right: `aboutDetail1` truncated; expand shows 3 branches |
| Directory | Branch + floor (zone/placeholder) + search + store list; floorplan placeholder |
| Membership | Static PaseoLife placeholder (Android/iOS) |

## Section order

1. `#events` — กิจกรรมน่าสนใจ  
2. `#news` — บทความน่าสนใจ  
3. `#introduction` — Introduction  
4. `#directory` — Directory  
5. `#membership` — Membership PaseoLife  
