# SEO-A6.0 — Test Plan & Acceptance Criteria

**Status:** Locked  
**Aligns with:** [SEO-A6.0-09-admin-ui.md](./SEO-A6.0-09-admin-ui.md)

---

## Purpose

Verification requirements for SEO Workspace A6.0:

- Snapshot builder + cache
- Workspace API
- Attention table + filters (including `?issue=` queue mode)
- Recoverable potential aggregation (A4 reuse)
- Internal link coverage parsing
- UI rendering + RBAC

---

## Test categories

1. Unit tests
2. Integration tests
3. API tests
4. Permission tests
5. Performance tests
6. UI acceptance tests

---

## Unit tests

### Audit coverage

```txt
Input:  published = 1240, audited = 967
Expect: coveragePercent = 78.0 (rounded 1dp)
        fraction display = "967 / 1240"
```

### Average SEO score (audited only)

```txt
Input:  scores [80, 60, null-unaudited-excluded]
Expect: avg = 70
```

Unaudited items must **never** enter average or band counts.

### Recoverable potential (per item)

Reuse `recoverableSeoPoints` from `lib/seo-assistant.ts`:

```txt
Input:  checks = [
          { id: "desc-length", group: "seo", status: "bad", maxWeight: 12, weight: 0 },
          { id: "image-alt", group: "seo", status: "bad", maxWeight: 14, weight: 0 },
          { id: "sentence-length", group: "readability", status: "bad", maxWeight: 5, weight: 0 },
        ]
Expect: recoverablePotential = 12 + 14 = 26
        readability check excluded (group !== "seo")
```

### Projected score (display only)

```txt
Input:  seoScore = 42, recoverablePotential = 26
Expect: projected = 68
```

```txt
Input:  seoScore = 90, recoverablePotential = 20
Expect: projected = 100 (capped)
```

### Quick win aggregation

```txt
Input:  84 items fail image-alt, avg recoverable = 14
Expect: opportunity row { checkId: "image-alt", affectedCount: 84, avgImpact: 14 }
        sort key = 84 × 14
```

### Internal link count parser

```txt
Input:  check { id: "internal-links", status: "good", reason: "พบลิงก์ภายใน 3 ลิงก์" }
Expect: count = 3, coverageLabel = "3+ links"

Input:  check { id: "internal-links", status: "bad", reason: "เพิ่มลิงก์ภายในในเนื้อหา" }
Expect: count = 0, coverageLabel = "0 links"
```

### Coverage band mapping

| Count | Label |
|-------|-------|
| 0 | `0 links` |
| 1 | `1 link` |
| 2 | `2 links` |
| ≥3 | `3+ links` |

### Attention table sort

```txt
Input:  [{ score: 61 }, { score: 42, potential: 26 }, { score: 42, potential: 10 }]
Expect: order = [42/26, 42/10, 61]  (score ASC, potential DESC tiebreak)
```

### Issue filter (`?issue=image-alt`)

```txt
Input:  item A fails image-alt, item B fails desc-length only
Filter: issue=image-alt
Expect: only item A returned
```

---

## Integration tests

### Latest audit resolver

Given Post with Audit₁ (Jan) and Audit₂ (May) → use Audit₂ only.

### Snapshot builder output

`WorkspaceSnapshot` must include:

```ts
{
  coverage: { audited, total, percent },
  health: { totalPublished, avgSeoScore, excellentCount, needsAttentionCount },
  quickWins: SeoQuickWinRow[],
  // attention + internal links fetched via paginated endpoints or embedded first page
}
```

### Cache resolver

- Cache hit → builder not called
- Cache miss → single build, cached
- Concurrent requests → single-flight (one build)

---

## API tests

### `GET /api/admin/seo/workspace`

- 200 for authorized roles
- Body contains: `coverage`, `health`, `quickWins`, `generatedAt`
- Payload &lt; 20 KB (first page only)

### `GET /api/admin/seo/workspace/attention`

Query params: `types`, `band`, `category`, `branch`, `tag`, `issue`, `page`, `pageSize`

- Default sort: `score ASC`, `potential DESC`
- Pagination: 50/page
- `issue=image-alt` filters correctly

### `POST /api/admin/seo/workspace/recalculate`

- Triggers rebuild
- Returns new `generatedAt`
- Second concurrent POST waits or returns in-progress status

### Unknown `issue` checkId

- Filter ignored or 400 with message — implementation choice; must not 500

---

## Permission tests

| Role | Access |
|------|--------|
| SUPER_ADMIN, ADMIN, EDITOR, MARKETING | 200 |
| STAFF, USER | 403 |

Module: `seo` (same as `/admin/seo` settings).

---

## Performance tests

| Metric | Target |
|--------|--------|
| Snapshot build (10k posts + 2k events + 1k promos) | &lt; 5s (&lt; 2s preferred) |
| Cache hit response | &lt; 100ms |
| Memory | No OOM during build |

---

## UI acceptance tests

### Section A — KPI row

- [ ] Exactly 5 cards: Total, Average, **Audit Coverage**, Excellent, &lt;70
- [ ] Coverage shows `967 / 1240` style fraction
- [ ] Warning when coverage &lt; 80%

### Section B — Attention table (primary)

- [ ] Renders above Quick Wins
- [ ] **Potential** column shows `+N pts`
- [ ] Projected score subline when N &gt; 0
- [ ] Sorted lowest score first
- [ ] Edit → correct editor `?tab=seo`

### Section C — Quick Wins

- [ ] Aggregated rows (not per-post list)
- [ ] **View affected items** → `/admin/seo/workspace?issue={checkId}`

### Issue queue mode

- [ ] `?issue=image-alt` filters attention table
- [ ] Active issue chip visible in sidebar
- [ ] Clear issue removes param

### Section D — Internal links

- [ ] **Coverage** column: 0 / 1 / 2 / 3+ links
- [ ] Sorted 0 links first

### Section E — No audit

- [ ] Unaudited counts by type
- [ ] Unaudited excluded from average score

### States

- [ ] Loading skeletons
- [ ] Error state
- [ ] Empty: “Great job. No critical SEO issues found.”
- [ ] Mobile: card layout, filter drawer, no broken horizontal scroll

### Explicit negatives (must NOT exist in A6.0)

- [ ] No 30-day trend graph
- [ ] No pie/bar/histogram distribution chart
- [ ] No assignee dropdown

---

## Definition of done

A6.0 is complete when:

1. All unit + integration tests pass
2. API tests pass including `?issue=` filter
3. Permission tests pass
4. Performance budget met on cache hit
5. UI acceptance checklist complete
6. Principal Engineering Review sign-off

---

## A6.1 forward compatibility

Quick Win deep links in A6.0 use query params. A6.1 adds `/admin/seo/issues/[checkId]` — same filter logic, dedicated layout. Snapshot + attention API must support both without duplicate aggregation logic.
