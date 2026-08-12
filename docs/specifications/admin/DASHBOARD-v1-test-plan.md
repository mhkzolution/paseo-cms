# Executive Dashboard V1 — Test Plan

**Status:** Locked  
**Aligns with:** [DASHBOARD-v1-executive-ui.md](./DASHBOARD-v1-executive-ui.md)

---

## Unit tests

### Published percent

```txt
posts=100, events=20, promotions=10, published=120, total=130
→ publishedPercent = 92.3 (1dp)
```

### Audit coverage

```txt
published=100, audited=78
→ auditCoveragePercent = 78
```

### Average SEO

```txt
Excludes unaudited and non-published content
null audits excluded from mean
```

### Needs attention count

```txt
Matches seo-workspace band: score < 70 on latest audit
needsAttentionPercent = count / audited * 100
```

### Recent activity filter

```txt
Only includes: published, unpublished, created, deleted
Excludes: generic updated-only events
```

### Recently published sort

```txt
publishedAt DESC, limit 5 per type
```

---

## UI acceptance

- [ ] L1: Posts, Events, Promotions, Published %, Audit Coverage, Avg SEO
- [ ] No raw Published/Draft totals in L1
- [ ] L3 Needs Attention clickable → workspace `?band=needs_attention`
- [ ] Section name "Recently Published"
- [ ] Content Inventory with published/draft per type
- [ ] Quick Actions: Create Post, Event, Promotion
- [ ] No analytics/traffic widgets

---

## Integration

- [ ] Dashboard snapshot builds in &lt; 5s on production-scale data
- [ ] Cache hit &lt; 100ms
- [ ] SEO metrics consistent with workspace snapshot (same builders)

---

## Definition of done

Dashboard V1 complete when all acceptance criteria pass and Principal Engineering signs off on `DashboardSnapshot` contract.
