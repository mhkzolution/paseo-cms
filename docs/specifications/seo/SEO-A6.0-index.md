# SEO-A6.0 Workspace

**Status:** In development (Engineering started — Aug 2026)  
**Phase:** A6.0  
**Type:** Specification  
**Score:** 8.8/10 — approved for implementation

---

## Overview

SEO Workspace is a **triage-first operational page** for discovering and fixing SEO issues across Posts, Events, and Promotions.

It is **not** a generic analytics dashboard. The workflow is:

```txt
Discover Problem → Prioritize → Open Editor → Fix With A4
```

A6.0 reuses existing A1 scoring and A4 `recoverableSeoPoints` — **no new scoring engine**.

---

## Roadmap

| Phase | Name | Route | Scope |
|-------|------|-------|-------|
| **A6.0** | SEO Workspace | `/admin/seo/workspace` | Health KPIs, attention table, quick wins, internal links, no-audit — **this spec** |
| **A6.1** | SEO Queue | `/admin/seo/issues/[checkId]` | Dedicated issue queue per `checkId` (e.g. `image-alt`) |
| **A6.2** | SEO Reports | `/admin/seo/reports` | Trends, distribution charts — deferred until validation data exists |

### Explicitly deferred (not A6.0)

- Trend graphs (30-day score history)
- Ranking distribution charts (pie / bar / histogram)
- Assignee workflow
- Orphan detection / body-link graph
- AI recommendations (A5)
- Database schema changes

---

## Navigation

```txt
Marketing & SEO
├── SEO Settings        /admin/seo              (global metadata — existing SeoForm)
└── SEO Workspace       /admin/seo/workspace    (A6.0 — operational triage)
```

---

## Documents

| # | Document | Status |
|---|----------|--------|
| 1 | [Workspace MVP (engineering)](./seo-a6-0-workspace-mvp.md) | Locked — snapshot + metrics |
| 9 | [Admin UI Wireframe](./SEO-A6.0-09-admin-ui.md) | **Canonical UI spec** |
| 10 | [Test Plan](./SEO-A6.0-10-test-plan.md) | Locked |

Split docs (`SEO-A6.0-01` … `08`) are optional extractions from the MVP doc.

---

## A6.0 Deliverables

### Page — `/admin/seo/workspace`

| Section | Purpose |
|---------|---------|
| **A — Health Overview** | Total, Average Score, **Audit Coverage**, Excellent 90+, Needs Attention &lt;70 |
| **B — Content Requiring Attention** | Primary table — sorted lowest score first; includes **Potential** column |
| **C — Quick Wins** | Aggregated opportunities with **deep-link filters** |
| **D — Internal Link Opportunities** | **Link coverage** bands; sort 0 links first |
| **E — No SEO Audit Yet** | Unaudited published content |
| **Sidebar** | Content type, score band, category, branch, tag |

### Header actions

- Last updated timestamp (snapshot `generatedAt`)
- **Recalculate SEO** — triggers snapshot rebuild (with confirm)

### APIs (implementation)

- `GET /api/admin/seo/workspace` — snapshot payload (coverage, KPIs, sections)
- `GET /api/admin/seo/workspace/attention` — paginated attention table (filters + `issue` query)
- `POST /api/admin/seo/workspace/recalculate` — single-flight snapshot rebuild

A6.0 quick-win drill-down uses **query params** on the workspace:

```txt
/admin/seo/workspace?issue=image-alt
```

A6.1 adds dedicated queue routes at `/admin/seo/issues/[checkId]`.

### Snapshot system

- `WorkspaceSnapshot` builder + resolver
- 15-minute TTL, single-flight rebuild
- See [seo-a6-0-workspace-mvp.md](./seo-a6-0-workspace-mvp.md) §8

---

## Principal Review — Locked refinements

These four changes are **required** for A6.0 (not optional polish):

1. **Audit Coverage KPI** in the health row — prevents misleading average when only 20% of content is audited
2. **Potential column** in attention table — `recoverableSeoPoints` sum from latest audit (A4 engine)
3. **Quick Win deep links** — `View affected items` → `/admin/seo/workspace?issue={checkId}`
4. **Internal Link Coverage column** — `0 / 1 / 2 / 3+` links; sort ascending

---

## Acceptance gate

Implementation may begin when:

- [x] Principal Product Review — UX locked
- [ ] Principal Engineering Review — API + snapshot contracts
- [x] Acceptance criteria finalized — see [SEO-A6.0-10-test-plan.md](./SEO-A6.0-10-test-plan.md)
