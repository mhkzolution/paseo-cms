# SEO Score Design

**Date:** 2026-07-13  
**Status:** Approved for implementation

## Goal

Add Yoast-style SEO + readability scoring for Posts, Events, and Promotions — live in the editor, badge on list pages, warn (but allow) publish when SEO score &lt; 50.

## Approach: Hybrid

1. Shared analyzer `lib/seo-score.ts` computes `seoScore`, `readabilityScore`, and checklist items.
2. Editor: realtime panel (debounced watch) + publish confirm when SEO &lt; 50.
3. On save: persist snapshot to `SeoAudit` (extended for event/promotion).
4. List pages: badge from latest audit snapshot.

## Scoring bands

- Red: &lt; 50  
- Yellow: 50–79  
- Green: ≥ 80  

## Out of scope

- Blocking publish  
- External APIs (Google, Ahrefs)  
- Per-site customizable rule weights UI  
