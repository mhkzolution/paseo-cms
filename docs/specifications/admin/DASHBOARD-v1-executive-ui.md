# Executive Dashboard V1 — Admin UI Specification

**Status:** Locked  
**Canonical:** Yes  
**Route:** `/admin/dashboard`  
**Review score:** 9/10

---

## Purpose

Executive overview of platform content health and activity.

**Single question:** ตอนนี้เนื้อหาในระบบเป็นอย่างไร และมีอะไรต้องสนใจไหม?

**Not in scope:** SEO triage, issue queues, per-item editing — see `/admin/seo/workspace`.

### Design constraints

- Desktop-first, responsive
- TailwindCSS + Prompt (`font-sans`)
- Enterprise admin — no glassmorphism, no flashy gradients
- Reuse: `StatCard` (extended), `AdminTableShell`, `SeoScoreBadge`, `EmptyState`

---

## Information architecture

```txt
/admin/dashboard
│
├── Header
│   ├── Title + subtitle
│   └── Quick Actions → /admin/posts|events|promotions/new
│
├── L1 — Platform Pulse (6 KPIs)
│   ├── Total Posts
│   ├── Total Events
│   ├── Total Promotions
│   ├── Published %          (rollup, all 3 types)
│   ├── Audit Coverage %     (published with ≥1 SeoAudit)
│   └── Average SEO Score    (audited only; subtext shows coverage)
│
├── L2 — Content Activity (30 days)
│   ├── Content Published (chart)
│   ├── Content Created (chart)
│   └── Content Updated (chart)
│
├── L3 — Insight band (lg:grid-cols-2)
│   ├── SEO Overview (mini)
│   │   ├── Avg SEO
│   │   ├── Coverage %
│   │   ├── Excellent %
│   │   ├── Needs Attention %  → link workspace
│   │   └── [ View SEO Workspace ]
│   │
│   └── Content Health
│       └── Top 5 issue types (aggregate counts)
│
├── L3b — Content Inventory (3 cards)
│   ├── Posts: total · published · draft
│   ├── Events: total · published · draft
│   └── Promotions: total · published · draft
│
└── L4 — Awareness band (lg:grid-cols-2)
    ├── Recent Activity (timeline)
    └── Recently Published (tabbed tables)
```

### Outbound deep links

| From | To |
|------|-----|
| Needs Attention % / count | `/admin/seo/workspace?band=needs_attention` |
| Content Health row (optional v1.1) | `/admin/seo/workspace?issue={checkId}` |
| View SEO Workspace | `/admin/seo/workspace` |
| Timeline item | Editor or list page |
| Recently Published row | Editor `?tab=seo` or list |

---

## L1 — Platform Pulse (locked KPI row)

Exactly **6 cards** — no raw Published/Draft totals.

| # | Card | Primary | Subtext |
|---|------|---------|---------|
| 1 | Total Posts | `{count}` | All statuses |
| 2 | Total Events | `{count}` | All statuses |
| 3 | Total Promotions | `{count}` | All statuses |
| 4 | **Published** | `{percent}%` | `{published} of {total} content` |
| 5 | **Audit Coverage** | `{percent}%` | `{audited} of {published} published` |
| 6 | **Avg SEO** | `{score}` or `—` | Audited only · `{coverage}% coverage` |

### Formulas

```txt
totalContent     = posts + events + promotions (deletedAt: null)
publishedContent = count(status = PUBLISHED)
publishedPercent = round(published / total * 100)

auditCoverage    = round(auditedPublished / publishedContent * 100)
avgSeoScore      = mean(latest SeoAudit.score) — audited published only
```

### Why not Draft % in L1

Published % already communicates rollout health (`96%` → draft is `4%`).  
Draft detail lives in **Content Inventory** (L3b) per content type.

### Visual accents

- Audit Coverage &lt; 80% → `border-l-4 border-l-amber-500`
- Avg SEO with coverage &lt; 50% → warning subtext (same amber treatment)

---

## L2 — Content Activity

Three equal cards, **last 30 rolling days**, simple bar chart (monochrome `paseo`).

| Chart | Query field | Y-axis |
|-------|-------------|--------|
| Published | `publishedAt` | count per day |
| Created | `createdAt` | count per day |
| Updated | `updatedAt` | count per day |

Header shows period total (e.g. `38 this period`).

**Note:** Updated chart is aggregate momentum — distinct from Recent Activity which filters event types.

---

## L3 — SEO Overview (mini)

Compact card — **not** a duplicate of L1. Focus on distribution + handoff.

| Metric | Display | Action |
|--------|---------|--------|
| Avg SEO | `74` | — |
| Coverage | `78%` | — |
| Excellent | `18%` | of audited |
| **Needs Attention** | `30%` (`48 items`) | **Link** → `/admin/seo/workspace?band=needs_attention` |

Primary CTA:

```txt
[ View SEO Workspace → ]  →  /admin/seo/workspace
```

Bands match A6 workspace: Excellent 90+, Good 70–89, Needs Attention &lt;70.

---

## L3 — Content Health

Top **5** issue types by `affectedCount` (same aggregation as A6 quick wins / catalog).

| Issue | Count |
|-------|-------|
| Missing cover image | 84 |
| Missing SEO title | 112 |
| … | … |

Display only — no "Fix" buttons on dashboard. Optional v1.1: row links to `?issue=`.

---

## L3b — Content Inventory (locked addition)

Three mini cards — answers *"เรามี content อยู่กี่ชิ้น"* per type.

```txt
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Posts      842  │  │ Events     128  │  │ Promotions  94  │
│ ├ Published 790 │  │ ├ Published 110 │  │ ├ Published  84 │
│ └ Draft     52  │  │ └ Draft     18  │  │ └ Draft     10 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Optional footer link per card: `View all posts →` `/admin/posts`

---

## L4 — Recent Activity (locked event filter)

**Do not** show generic `updated` events — too noisy.

### Allowed event types only

| Event | Trigger | Icon color |
|-------|---------|------------|
| **Published** | status → PUBLISHED (or first publish) | emerald |
| **Unpublished** | status leaves PUBLISHED | amber |
| **Created** | record created | paseo |
| **Deleted** | soft-delete (`deletedAt` set) | red/muted |

### Example timeline

```txt
● Post published — Summer Food Festival          2h ago
● Event unpublished — Food Truck Weekend         5h ago
● Promotion created — Buffet Campaign            1d ago
```

Limit: **15 items**. Link title to editor or admin list.

### MVP data source

If audit log table does not exist V1:

- Derive from `publishedAt`, `createdAt`, `deletedAt`, `status` changes on latest N records
- V1.1: dedicated `ContentActivityLog` table

---

## L4 — Recently Published (not "Top Content")

**Renamed** — MVP has no analytics; avoid implying traffic rank.

Tabbed panel: **Posts | Events | Promotions**

| Column | Notes |
|--------|-------|
| Title | Link to editor |
| SEO Score | `SeoScoreBadge` or `—` |
| Published At | Relative + absolute on hover |

Sort: `publishedAt DESC`, limit **5 per tab**.

Footer: `View all posts →`

---

## Desktop wireframe (locked)

```txt
┌────────────────────────────────────────────────────────────────────────────┐
│ Dashboard                              [Create Post][Event][Promotion]   │
│ ตอนนี้เนื้อหาในระบบเป็นอย่างไร และมีอะไรต้องสนใจไหม?                        │
├────────────────────────────────────────────────────────────────────────────┤
│ L1  Posts 842 │ Events 128 │ Promos 94 │ Published 96% │ Coverage 78% │ SEO 74 │
├────────────────────────────────────────────────────────────────────────────┤
│ L2  [Published 30d]    [Created 30d]    [Updated 30d]                      │
├────────────────────────────────────────────────────────────────────────────┤
│ L3  [ SEO Overview + Needs Attn link ]    [ Content Health top 5 ]         │
├────────────────────────────────────────────────────────────────────────────┤
│ L3b [ Posts inventory ] [ Events inventory ] [ Promotions inventory ]      │
├────────────────────────────────────────────────────────────────────────────┤
│ L4  [ Recent Activity ]                   [ Recently Published tabs ]      │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile wireframe

```txt
Quick Actions (stacked)
L1 KPI 2×3 horizontal scroll
L2 Published chart only; Created/Updated in accordion
L3 SEO Overview → Content Health (stacked)
L3b Inventory cards stacked
L4 Activity timeline → Recently Published cards
```

---

## Component tree

```txt
app/admin/dashboard/page.tsx
└── DashboardPage (Server)
    ├── getDashboardSnapshot()     lib/dashboard/get-dashboard-snapshot.ts
    │
    ├── DashboardHeader
    │   └── QuickActionsBar
    │
    ├── PlatformPulseSection       (L1) — DashboardKpiCard × 6
    ├── ContentActivitySection     (L2) — ActivityChartCard × 3
    ├── InsightBand                (L3)
    │   ├── SeoOverviewMiniCard
    │   └── ContentHealthCard
    ├── ContentInventorySection    (L3b) — InventoryCard × 3
    └── AwarenessBand              (L4)
        ├── RecentActivityTimeline
        └── RecentlyPublishedPanel
```

### Snapshot shape (engineering contract)

```ts
type DashboardSnapshot = {
  generatedAt: string;
  pulse: {
    posts: number;
    events: number;
    promotions: number;
    publishedPercent: number;
    publishedCount: number;
    totalCount: number;
    auditCoveragePercent: number;
    auditedPublishedCount: number;
    averageSeoScore: number;
  };
  activity: {
    published: DailyCount[];
    created: DailyCount[];
    updated: DailyCount[];
  };
  seoOverview: {
    averageScore: number;
    coveragePercent: number;
    excellentPercent: number;
    needsAttentionPercent: number;
    needsAttentionCount: number;
  };
  contentHealth: Array<{ checkId: string; label: string; count: number }>;
  inventory: {
    posts: { total: number; published: number; draft: number };
    events: { total: number; published: number; draft: number };
    promotions: { total: number; published: number; draft: number };
  };
  recentActivity: ActivityEvent[];
  recentlyPublished: {
    posts: PublishedItem[];
    events: PublishedItem[];
    promotions: PublishedItem[];
  };
};
```

Build SEO slices by calling shared helpers from `lib/seo-workspace` (or embedded snapshot fields).

Cache: `unstable_cache`, 15 min TTL, tag `dashboard-snapshot`.

---

## Tailwind reference

```tsx
// L1 grid
<div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">

// L3 band
<div className="grid gap-6 lg:grid-cols-2">

// Inventory card
<div className="rounded-md border border-border bg-surface p-4">
  <p className="text-sm font-semibold">Posts <span className="tabular-nums">842</span></p>
  <ul className="mt-2 space-y-1 text-sm text-muted">
    <li className="flex justify-between"><span>Published</span><span className="tabular-nums text-foreground">790</span></li>
    <li className="flex justify-between"><span>Draft</span><span className="tabular-nums text-foreground">52</span></li>
  </ul>
</div>

// Needs attention link
<Link href="/admin/seo/workspace?band=needs_attention" className="text-sm font-medium text-paseo-dark hover:underline">
  48 items need attention
</Link>
```

---

## KPI hierarchy (locked)

```txt
Tier 1 — L1 Platform Pulse
  Volume by type (Posts, Events, Promotions)
  Rollup health (Published %, Audit Coverage %)
  Quality signal (Avg SEO)

Tier 2 — L2 Momentum
  Published → Created → Updated (30d)

Tier 3 — L3 Risk summary
  SEO distribution + Needs Attention handoff
  Content Health top issues

Tier 3b — L3b Inventory detail
  Per-type published/draft breakdown

Tier 4 — L4 Narrative + recency
  Meaningful activity events only
  Recently published lists (not "top")
```

---

## UX rationale

| Decision | Why |
|----------|-----|
| Published % not raw counts | Executives read ratios faster than reconciling 1024 vs 842+128+94 |
| Audit Coverage in L1 | Same lesson as A6 — Avg SEO without coverage misleads |
| Needs Attention in L3 with link | Answers "มีของแดงกี่ชิ้น" without duplicating attention table |
| No Draft % in L1 | Redundant with Published %; detail in Inventory |
| Activity events filtered | `updated` noise hides real publish/unpublish signal |
| Recently Published not Top | No analytics yet — honest labeling |
| Content Inventory | Marketing asks inventory counts daily, not SEO |
| No traffic in V1 | CMS first; analytics is Dashboard V2 |

---

## Acceptance criteria

- [ ] L1 exactly 6 KPIs per locked list
- [ ] Published % and Audit Coverage show fraction subtexts
- [ ] L3 Needs Attention links to `/admin/seo/workspace?band=needs_attention`
- [ ] Recent Activity excludes generic "updated" events
- [ ] Section titled "Recently Published" not "Top Content"
- [ ] Content Inventory shows per-type published/draft
- [ ] View SEO Workspace CTA present
- [ ] No traffic/views/GA4 widgets
- [ ] Mobile layout usable without horizontal scroll (except KPI scroll)
