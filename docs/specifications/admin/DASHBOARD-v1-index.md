# Executive Dashboard V1

**Status:** In development (Engineering started — Aug 2026)  
**Route:** `/admin/dashboard`  
**Score:** 9/10 — approved for implementation  
**Type:** Specification

---

## Overview

The Executive Dashboard answers one question:

> **"ตอนนี้เนื้อหาในระบบเป็นอย่างไร และมีอะไรต้องสนใจไหม?"**

It is **not** an SEO operations page. Triage and fixes live at `/admin/seo/workspace` (A6.0).

```txt
Dashboard          →  "What is the state of our content?"
SEO Workspace      →  "What should we fix first?"
```

ThePaseo CMS is a **Content Management Platform**, not a Marketing Analytics Platform.

---

## Relationship to A6.0

| Concern | Dashboard V1 | SEO Workspace A6.0 |
|---------|--------------|-------------------|
| Role | Executive overview | Operations / triage |
| SEO detail | Mini summary + CTA | Attention table, queues, filters |
| Needs attention | Count / % + deep link | Full filtered table |
| Content health | Top 5 issue types (counts) | Quick wins + per-item fixes |
| Recalculate | No | Yes |

**Shared metrics:** Reuse `lib/seo-workspace` health builders where possible — do not duplicate aggregation logic.

---

## Locked layout (V1)

| Layer | Section |
|-------|---------|
| **Header** | Greeting + Quick Actions (Create Post / Event / Promotion) |
| **L1** | Platform Pulse — 6 KPI cards |
| **L2** | Content Activity — 3 charts (30 days) |
| **L3** | SEO Overview + Content Health (2-column) |
| **L3b** | Content Inventory (3 mini cards) |
| **L4** | Recent Activity + Recently Published (2-column) |

---

## Documents

| Document | Purpose |
|----------|---------|
| [Executive UI Spec](./DASHBOARD-v1-executive-ui.md) | **Canonical** — wireframes, components, Tailwind |
| [Test Plan](./DASHBOARD-v1-test-plan.md) | Acceptance criteria |

---

## Explicitly deferred (Dashboard V2+)

Requires real analytics integration:

- Traffic / pageviews
- Views, CTR
- Search Console
- GA4
- "Top Content" by engagement (rename avoided in V1 — use **Recently Published**)

---

## Principal review — locked refinements

1. **Published %** instead of raw Published/Draft counts in KPI row  
2. **Audit Coverage** in L1 KPI row (alongside Avg SEO)  
3. **Needs Attention** in L3 SEO Overview (clickable → workspace filter)  
4. **Recent Activity** — only Published, Unpublished, Created, Deleted (no generic "updated")  
5. **Recently Published** — not "Top Content" (no analytics yet)  
6. **Content Inventory** — Posts/Events/Promotions with published/draft breakdown  

---

## Acceptance gate

- [x] Principal Product Review — UX locked  
- [ ] Principal Engineering Review — snapshot API contract  
- [ ] Implementation against [DASHBOARD-v1-executive-ui.md](./DASHBOARD-v1-executive-ui.md)
