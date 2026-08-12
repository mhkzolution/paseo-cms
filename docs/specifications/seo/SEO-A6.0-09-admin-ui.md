# SEO-A6.0 — Admin UI Specification

**Status:** Locked  
**Canonical:** Yes — UI implementation must match this document  
**Route:** `/admin/seo/workspace`  
**Review score:** 8.8/10

---

## Purpose

Define the desktop-first admin UI for the SEO Workspace.

The page helps editors **discover problems, prioritize fixes, and jump into the A4 Optimization Assistant** — not browse analytics.

### Core workflow

```txt
Discover Problem  →  Prioritize  →  Open Editor  →  Fix With A4
```

### Design constraints

- Desktop-first, responsive collapse on mobile
- TailwindCSS design language (existing admin tokens)
- Prompt font (`font-sans` / `var(--font-prompt)`)
- Clean enterprise SaaS — **no glassmorphism, no flashy gradients**
- Reuse: `SeoScoreBadge`, `AdminTableShell`, `EmptyState`, `AdminPageHeader`

### Not in scope (A6.0)

- Trend graphs, pie/bar/histogram distribution charts
- Assignee / task workflow
- Inline content editing (always deep-link to editor SEO tab)

---

## Navigation

```txt
Marketing & SEO
├── SEO Settings        /admin/seo
└── SEO Workspace       /admin/seo/workspace
```

Editor deep links (all content types):

```txt
/admin/posts/[id]/edit?tab=seo
/admin/events/[id]/edit?tab=seo
/admin/promotions/[id]/edit?tab=seo
```

---

## Page layout

### Desktop (≥1024px)

```txt
┌────────────────────────────────────────────────────────────────────────────┐
│ SEO Workspace                          Last updated: 11 Aug 2026, 15:42    │
│ Discover and fix SEO issues…               [ Recalculate SEO ]              │
├──────────────────┬─────────────────────────────────────────────────────────┤
│ FILTERS (sticky) │ MAIN                                                    │
│                  │                                                         │
│ Content type     │  A — HEALTH OVERVIEW (5 KPI cards)                      │
│ SEO score band   │                                                         │
│ Category         │  B — CONTENT REQUIRING ATTENTION  ← PRIMARY SECTION     │
│ Branch           │                                                         │
│ Tag              │  C — QUICK WINS (aggregated)                            │
│                  │                                                         │
│ [ Clear filters ]│  D — INTERNAL LINK OPPORTUNITIES                        │
│                  │                                                         │
│                  │  E — NO SEO AUDIT YET                                   │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

**Grid:** `lg:grid-cols-[240px_minmax(0,1fr)]` · section gap `gap-8` · page gap `gap-6`

### Mobile (&lt;1024px)

- Filters → right drawer (`w-80`, `fixed inset-y-0 right-0`)
- KPI row → `grid-cols-2` or horizontal scroll
- Tables → card list (title, type, score, potential, issue, Edit)
- Section order unchanged

---

## Header

| Element | Spec |
|---------|------|
| Eyebrow | `Marketing & SEO` — `text-xs font-semibold uppercase tracking-wide text-muted` |
| Title | `SEO Workspace` — `text-2xl font-semibold` |
| Subtitle | One line: operational triage, not analytics |
| Last updated | Snapshot `generatedAt`, relative + absolute on hover |
| Recalculate SEO | Primary button — `bg-paseo` — opens confirm dialog |

**Recalculate behavior:**

1. User confirms
2. `POST /api/admin/seo/workspace/recalculate` (single-flight)
3. Button shows loading; page refreshes snapshot on success
4. Timestamp updates

---

## Sidebar filters

All filters sync to URL search params (shareable bookmarks).

| Filter | Param | Control |
|--------|-------|---------|
| Content type | `types` | Checkbox: `post`, `event`, `promotion` |
| SEO score band | `band` | Radio: `all`, `excellent`, `good`, `needs_attention` |
| Category | `category` | Select |
| Branch | `branch` | Multi-select |
| Tag | `tag` | Multi-select |
| Issue (queue mode) | `issue` | Set by Quick Win deep link — `checkId` from catalog |

**Score bands (match A1 / SeoScoreBadge):**

| Band | Range | Param value |
|------|-------|-------------|
| Excellent | 90–100 | `excellent` |
| Good | 70–89 | `good` |
| Needs Attention | 0–69 | `needs_attention` |

When `?issue=image-alt` is active:

- Show filter chip: `Issue: Missing image alt` with clear (×)
- Section B filters to content where latest audit has `image-alt` check `status !== "good"`
- Sections C–E respect other active filters; C may highlight the active issue row

---

## Section A — Health Overview

**Purpose:** Situational awareness in one glance. **Audit Coverage** prevents misleading averages.

### KPI cards (exactly 5)

| # | Card | Primary value | Subtext |
|---|------|---------------|---------|
| 1 | Total Content | `{publishedCount}` | `Published` |
| 2 | Average Score | `{avgSeoScore}` | `Audited content only` |
| 3 | **Audit Coverage** | `{coveragePercent}%` | `{auditedCount} / {publishedCount}` |
| 4 | Excellent | `{excellentCount}` | `{excellentPercent}% of audited` |
| 5 | Needs Attention | `{needsAttentionCount}` | `{needsAttentionPercent}% of audited` |

**Removed from KPI row:** Good (70–89) band — less actionable during rollout than Coverage.

### Card styling

```txt
rounded-md border border-border bg-surface p-4
```

Accent left border (cards 4–5 only):

- Excellent: `border-l-4 border-l-emerald-500`
- Needs Attention: `border-l-4 border-l-red-500`
- Audit Coverage: `border-l-4 border-l-amber-500` when coverage &lt; 80%

### Coverage warning copy

When `coveragePercent < 80%`:

> Average score reflects audited content only. Run Recalculate SEO or review unaudited items below.

### Metrics source

- `publishedCount` — all published, non-deleted Post + Event + Promotion
- `auditedCount` — published items with ≥1 `SeoAudit`
- `avgSeoScore` — mean of `SeoAudit.score` (latest per item), **audited only**
- Band counts — latest audit `score` per item, audited only

---

## Section B — Content Requiring Attention

**Primary section.** This is what Marketing opens daily.

### Default sort

`seoScore ASC` (lowest first), then `recoverablePotential DESC` as tiebreaker.

### When `?issue=` is set

Same table, pre-filtered to affected items; sort unchanged.

### Columns

| Column | Field | Notes |
|--------|-------|-------|
| Title | `title` | Truncate with tooltip |
| Type | `contentType` | Badge: Post / Event / Promotion |
| SEO Score | `seoScore` | `SeoScoreBadge` |
| **Potential** | `recoverablePotential` | **`+{n} pts`** — see formula below |
| Status | `scoreBand` | Pill: Excellent / Good / Needs Attention |
| Top Issue | `topIssueLabel` | Highest-priority failing check label |
| Updated At | `updatedAt` | Relative time |
| Action | — | `Edit` → editor `?tab=seo` |

### Potential column (Principal Review lock)

**Source:** A4 `recoverableSeoPoints()` — no new scoring logic.

```ts
// lib/seo-assistant.ts — reuse as-is
recoverablePotential = sum(
  recoverableSeoPoints(check)
  for check in latestAudit.checks
  where check.group === "seo" && check.status !== "good"
)
```

**Display:**

```txt
+26 pts
~68 projected        ← optional secondary line when potential > 0
```

- `projectedScore = min(100, seoScore + recoverablePotential)` — display only, not stored
- Helps editors compare: `42 → ~68` (high ROI) vs `68 → ~82` (lower ROI)

**Top Issue** remains the single highest-priority failing check (catalog `issuePriority`), not necessarily the highest recoverable check.

### Status colors

| Band | Pill classes |
|------|----------------|
| Needs Attention | `bg-red-50 text-red-800` |
| Good | `bg-amber-50 text-amber-900` |
| Excellent | `bg-emerald-50 text-emerald-800` |

Must include text label (not color-only).

### Pagination

50 rows/page, server-side.

### Empty state

> Great job. No critical SEO issues found in this filter.

---

## Section C — Quick Wins

**Purpose:** Batch mental model — fix one issue type, improve many contents.

### Sort

`affectedCount × avgRecoverablePoints DESC` (site-wide aggregate).

Display top 5–10 rows.

### Columns

| Column | Notes |
|--------|-------|
| Issue | Catalog `actionLabel` or `issueLabel` |
| Affected Content Count | Items with latest audit failing this `checkId` |
| Estimated Impact | `+{avgRecoverablePoints} pts` avg per affected item |
| Action | **View affected items** |

### Deep link (Principal Review lock)

**Action** navigates to:

```txt
/admin/seo/workspace?issue={checkId}
```

Examples:

```txt
/admin/seo/workspace?issue=image-alt
/admin/seo/workspace?issue=desc-length
/admin/seo/workspace?issue=internal-links
```

This activates **queue mode** on Section B (A6.0). A6.1 adds full-page queue at `/admin/seo/issues/[checkId]`.

### Row example

| Issue | Count | Impact | Action |
|-------|-------|--------|--------|
| Missing image alt text | 84 | +14 pts avg | View affected items → |

---

## Section D — Internal Link Opportunities

**Purpose:** Actionable link coverage — not vague “3 suggestions”.

### Inclusion criteria

Published + latest audit exists, where:

- `internal-links` check `status !== "good"`, **or**
- parsed internal link count ≤ 2

### Link coverage (Principal Review lock)

Derive count from latest audit `internal-links` check:

| Coverage | Condition |
|----------|-----------|
| `0 links` | check `status === "bad"` or count = 0 |
| `1 link` | count = 1 |
| `2 links` | count = 2 |
| `3+ links` | count ≥ 3 |

Parse from check `reason` when good: `พบลิงก์ภายใน {n} ลิงก์`. Fallback: `0` if bad.

### Sort

`internalLinkCount ASC` (0 links first), then `seoScore ASC`.

### Columns

| Column | Notes |
|--------|-------|
| Content | Title |
| Type | Post / Event / Promotion |
| **Coverage** | `0 links` / `1 link` / `2 links` / `3+ links` |
| Suggested Links | Count from A4 `internalLinkSuggestions` if stored in audit suggestions; else `—` |
| Action | Edit → editor SEO tab (Internal Links card) |

### Coverage badge styling

```txt
0 links   → bg-red-50 text-red-800
1 link    → bg-amber-50 text-amber-900
2 links   → bg-amber-50 text-amber-900
3+ links  → bg-emerald-50 text-emerald-800
```

---

## Section E — No SEO Audit Yet

**Purpose:** Surface coverage gap — unaudited content invalidates site-wide averages.

### Display

Summary cards by type:

| Posts | Events | Promotions |
|-------|--------|------------|
| `{count}` unaudited | `{count}` | `{count}` |

Each card: **Review** → applies `types={type}` + shows list (expand table or filter attention).

### Table columns (expanded)

Title · Type · Published At · Action (Edit → triggers save/audit on first edit)

### Empty state

> All published content has been audited.

---

## Component tree

```txt
app/admin/seo/workspace/page.tsx
└── SeoWorkspacePage
    ├── SeoWorkspaceHeader
    │   ├── LastUpdatedTimestamp
    │   └── RecalculateSeoButton
    ├── SeoWorkspaceLayout
    │   ├── SeoWorkspaceSidebar
    │   │   ├── ContentTypeFilter
    │   │   ├── ScoreBandFilter
    │   │   ├── CategoryFilter
    │   │   ├── BranchFilter
    │   │   ├── TagFilter
    │   │   ├── ActiveIssueChip        ← visible when ?issue=
    │   │   └── ClearFiltersButton
    │   └── SeoWorkspaceMain
    │       ├── SeoHealthOverviewSection       (A)
    │       │   └── SeoHealthStatCard × 5
    │       ├── ContentAttentionSection        (B) ← primary
    │       │   ├── ContentAttentionTable
    │       │   └── ContentAttentionCardList   (mobile)
    │       ├── SiteQuickWinsSection           (C)
    │       ├── InternalLinkOpportunitiesSection (D)
    │       └── NoAuditSection                 (E)
    └── shared
        ├── SeoScoreBadge
        ├── AdminTableShell
        └── EmptyState
```

Domain helpers (server only — not in React):

```txt
lib/seo-workspace/
├── snapshot-builder.ts
├── snapshot-resolver.ts
├── recoverable-potential.ts    ← wraps recoverableSeoPoints per item
├── internal-link-count.ts      ← parse from audit checks
└── types.ts
```

---

## Tailwind layout reference

### Page shell

```tsx
<div className="flex flex-col gap-6 font-sans">
  <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
    {/* title + recalculate */}
  </header>
  <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
    <aside className="lg:sticky lg:top-6 lg:self-start rounded-md border border-border bg-surface p-4" />
    <main className="flex min-w-0 flex-col gap-8" />
  </div>
</div>
```

### KPI grid

```tsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
  {/* 5 stat cards */}
</div>
```

### Primary table shell

```tsx
<div className="rounded-md border border-border bg-surface">
  <div className="flex items-center justify-between border-b border-border px-4 py-3">
    <h2 className="text-sm font-semibold text-foreground">Content requiring attention</h2>
    <span className="text-xs text-muted">Sorted by lowest score</span>
  </div>
  <AdminTableShell minWidth="64rem">...</AdminTableShell>
</div>
```

### Potential cell

```tsx
<div className="tabular-nums">
  <span className="text-sm font-semibold text-foreground">+{potential} pts</span>
  {potential > 0 && (
    <p className="text-xs text-muted">~{Math.min(100, score + potential)} projected</p>
  )}
</div>
```

---

## UX rationale

| Decision | Rationale |
|----------|-----------|
| Attention table as hero | Daily job-to-be-done for Marketing — not KPI cards or charts |
| Audit Coverage in KPI row | Prevents false confidence when avg score reflects 20% of corpus |
| Drop Good band from KPIs | Coverage + Needs Attention matter more during rollout |
| Potential column | Surfaces A4 `recoverableSeoPoints` at site level — prioritizes ROI |
| Quick Win → `?issue=` | Queue mental model without A6.1 page yet; shareable URLs |
| Link coverage not suggestion count | Editors need “0 links” urgency, not opaque “3 suggestions” |
| No trends in A6.0 | No validation time-series yet; charts don’t help fix content |
| Deep link to A4 | Workspace discovers; editor + A4 fixes — single pipeline |

---

## Loading, error, empty states

| State | Behavior |
|-------|----------|
| Loading | Skeleton: 5 KPI cards + attention table rows |
| Error | “Unable to load SEO Workspace. Please try again.” |
| No audits (site-wide) | Section E full width; Sections A avg hidden; message to create/update content |
| Filter empty | “No content matches these filters.” |

---

## Accessibility

- All tables: `aria-label` per section
- Status bands: text + color
- Recalculate: `aria-busy` while loading
- Filter drawer: focus trap on mobile

---

## Acceptance criteria (UI)

- [ ] 5 KPI cards including Audit Coverage with fraction subtext
- [ ] Attention table is visually primary (first data section after KPIs)
- [ ] Potential column uses `recoverableSeoPoints` sum from latest audit
- [ ] Quick Win action links to `/admin/seo/workspace?issue={checkId}`
- [ ] `?issue=` filters attention table and shows active chip
- [ ] Internal links table has Coverage column; sorted 0 links first
- [ ] Edit actions deep-link to correct editor with `?tab=seo`
- [ ] No trend charts, pie charts, or assignee UI
- [ ] Mobile: no horizontal scroll on card layout; filter drawer works
