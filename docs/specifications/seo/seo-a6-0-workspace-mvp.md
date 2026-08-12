# SEO-A6.0 Workspace MVP

> **Principal Review Lock (Aug 2026)**  
> Status: **Locked for implementation** (8.8/10)  
> **Canonical UI:** [SEO-A6.0-09-admin-ui.md](./SEO-A6.0-09-admin-ui.md)  
> **Index:** [SEO-A6.0-index.md](./SEO-A6.0-index.md)  
>
> Workflow: `Discover Problem → Prioritize → Open Editor → Fix With A4`  
> This is a **triage workspace**, not a generic analytics dashboard.  
> UI supersedes older “Site Health Card / itemHealth” wireframes in this doc where they conflict.

---

## 1. Executive Summary

SEO-A6.0 Workspace เป็นศูนย์กลางสำหรับ **ค้นหาและจัดลำดับปัญหา SEO** ของเนื้อหาทั้งระบบใน Paseo CMS

A1–A4 ครอบคลุมการวิเคราะห์และแก้ไขในระดับเนื้อหารายชิ้น (Post, Event, Promotion) แล้ว A6.0 เพิ่มมุมมองระดับเว็บไซต์ที่ช่วยทีม Marketing ทำงานประจำวัน:

```txt
Discover Problem → Prioritize → Open Editor → Fix With A4
```

A6.0 เป็น Read-Only Workspace ที่รวบรวมข้อมูลจาก `SeoAudit` และ reuse `recoverableSeoPoints` จาก A4 — **ไม่เปลี่ยน Schema และไม่สร้าง scoring engine ใหม่**

คำถามที่ Workspace ตอบ:

- เนื้อหาเผยแพร่แล้วได้รับ audit กี่เปอร์เซ็นต์? (**Audit Coverage** — สำคัญกว่า Good band ในช่วง rollout)
- เนื้อหาใดควรแก้ก่อน? (**Content Requiring Attention** — primary section)
- แก้ issue เดียวแล้วกระทบกี่ชิ้น? (**Quick Wins** aggregate)
- เนื้อหาใดยังไม่มี audit? (**No SEO Audit Yet**)
- ลิงก์ภายในขาดแค่ไหน? (**Internal Link Coverage** — 0/1/2/3+)

Workspace ไม่แก้เนื้อหาในหน้า — deep-link ไป editor แท็บ SEO + A4 Assistant เท่านั้น

---

## 2. Goals

### G1 — Audit Visibility

แสดงสัดส่วนเนื้อหาที่ได้รับการตรวจ SEO แล้วเมื่อเทียบกับเนื้อหาที่เผยแพร่ทั้งหมด พร้อมข้อมูลความสดใหม่ของ Audit ล่าสุด

ตัวอย่าง

```txt
Audited: 3,842 / 5,120
Median Audit Age: 18 days
G2 — Health Overview (KPI Row)

แสดง Total Content, Average SEO Score (audited only), **Audit Coverage**, Excellent 90+, Needs Attention &lt;70

ไม่แสดง Good band (70–89) ใน KPI row — Coverage สำคัญกว่าในช่วง rollout

G3 — Opportunity Discovery

แสดงปัญหา SEO ที่พบบ่อยที่สุดในระบบ พร้อมจำนวนเนื้อหาที่ได้รับผลกระทบ

ตัวอย่าง

Missing Meta Description
Missing Alt Text
Missing Internal Links
G4 — Content Prioritization

**Content Requiring Attention** เป็น primary section — เรียง `seoScore ASC`

เพิ่มคอลัมน์ **Potential** (`+N pts`) จาก `recoverableSeoPoints` รวมของ latest audit (A4 engine)

G4b — Quick Win Queue (A6.0)

Quick Win action → `/admin/seo/workspace?issue={checkId}`

A6.1 เพิ่ม `/admin/seo/issues/[checkId]` เป็น full-page queue

G5 — Scalable Performance

Dashboard ต้องสามารถรองรับข้อมูลระดับ Production ได้อย่างมีประสิทธิภาพ

เป้าหมายเบื้องต้น

Posts       10,000+
Events       2,000+
Promotions   1,000+

โดยไม่ทำ Full Aggregation บน Request Path

3. Non Goals

A6.0 ไม่รวมฟีเจอร์ต่อไปนี้

NG1 — Orphan Detection

เลื่อนไป A6.1+

เหตุผล

ยังไม่มี body-link graph
มี false positive สูง
NG2 — Content Decay Analysis

เลื่อนไป A6.1+

เหตุผล

ต้องมี content-type specific rules
ยังไม่มี freshness model
NG3 — Assignee / Task Workflow

เลื่อนไป A6.2+ (หรือ later)

เหตุผล

ไม่มี persistence
ไม่มี assignee model
เร็วเกินไปก่อน validation

NG3b — SEO Queue (full page)

เลื่อนไป **A6.1**

A6.0 ใช้ `?issue=` query param บน workspace แทน

NG4 — Trend Reporting & Distribution Charts

เลื่อนไป A6.2+

เหตุผล

SeoAudit ถูกสร้างเฉพาะตอน Save
ยังไม่มี time-series snapshot
NG5 — AI Recommendations

เลื่อนไป A5 + A6.2

เหตุผล

พึ่งพา Optimization Assistant
NG6 — Database Schema Changes

A6.0 ต้องทำงานบน Schema ปัจจุบันทั้งหมด

ไม่อนุญาตให้เพิ่ม

Rollup Tables
latestAudit Columns
Materialized SEO Aggregates
Scheduled Snapshot Tables

## 4. Definitions
Published Content

เนื้อหาที่ถูกนับใน SEO Workspace

เงื่อนไข

status = PUBLISHED
deletedAt IS NULL

รองรับ

Post
Event
Promotion

ไม่นับ

Draft
Scheduled
Archived
Deleted
Audited Content

เนื้อหาที่มี SeoAudit อย่างน้อย 1 รายการ

latestAudit != null

ใช้สำหรับ

Site Health
Opportunities
Worst Audited Content
Unaudited Content

เนื้อหาที่เผยแพร่แล้วแต่ยังไม่มี SeoAudit

latestAudit == null

จะถูกนับใน

Audit Coverage

แต่จะไม่ถูกนำไปคำนวณ

Site Health
Item Health
Opportunity Counts
Latest Audit

SeoAudit ล่าสุดของเนื้อหาแต่ละรายการ

เลือกจาก

ORDER BY analyzedAt DESC
LIMIT 1

หากมีหลาย Audit ให้ใช้เฉพาะรายการล่าสุด

Opportunity

ปัญหา SEO ที่ตรวจพบจาก Audit Checks

เงื่อนไข

check.status = "bad"

Opportunity 1 รายการคือ

checkId
label
affectedCount
maxWeight
Audit Coverage

สัดส่วนของ Published Content ที่มี SeoAudit

สูตร

coverage =
auditedContent /
publishedContent

ตัวอย่าง

842 / 1200 = 70.2%
Median Audit Age

ค่ากลางของอายุ Audit ล่าสุด

สูตร

today - latestAnalyzedAt

หน่วย

days

คำนวณเฉพาะ Audited Content

## 5b. Workspace-Specific Metrics (A6.0 UI Lock)

### recoverablePotential (per content item)

Reuse A4 — **no new logic**:

```ts
import { recoverableSeoPoints } from "@/lib/seo-assistant";

recoverablePotential = sum(
  recoverableSeoPoints(check)
  for check in latestAudit.checks
  where check.group === "seo" && check.status !== "good"
);
```

Display: `+{n} pts` · optional projected `min(100, seoScore + n)`

### internalLinkCount (per content item)

Parse from latest audit `internal-links` check:

- `status === "bad"` → `0`
- `status === "good"` → extract N from reason `พบลิงก์ภายใน {N} ลิงก์`

Coverage label:

| N | Label |
|---|-------|
| 0 | `0 links` |
| 1 | `1 link` |
| 2 | `2 links` |
| ≥3 | `3+ links` |

Sort internal link opportunities: `internalLinkCount ASC`, then `seoScore ASC`.

### quickWinDeepLink (A6.0)

```txt
/admin/seo/workspace?issue={checkId}
```

`checkId` from `SEO_CHECK_CATALOG` (e.g. `image-alt`, `desc-length`, `internal-links`).

---

## 5. Metric Formulas

seoScore

แหล่งข้อมูล

SeoAudit.score

ช่วงคะแนน

0 - 100
readabilityScore

แหล่งข้อมูล

SeoAudit.readability

ช่วงคะแนน

0 - 100
socialCoverageScore

วัดความครบถ้วนของ Social Metadata

ตรวจ

ogTitle
ogDescription
ogImage

ให้คะแนน

Fields Present	Score
0	0
1	33
2	67
3	100
linkCoverageScore

ใช้เฉพาะ Audit Check

checkId = internal-links

กฎ

good = 100
bad = 0

ห้ามใช้

Related Posts
Navigation Links

ในการคำนวณตัวนี้

(แก้ปัญหา C5)

itemHealth

ใช้สูตรเดียวทั้งระบบ

(
seoScore +
readabilityScore +
socialCoverageScore +
linkCoverageScore
) / 4

ช่วงคะแนน

0 - 100
Site Health

คำนวณจาก

average(itemHealth)

เฉพาะ

Audited Content

เท่านั้น

Health Bands
Score	Band
90-100	Excellent
80-89	Good
70-79	Fair
0-69	Needs Attention
Important Rule

ห้ามใช้

null = 0

ในทุก Metric

เนื้อหาที่ไม่มี Audit ต้องถูกจัดเป็น

Unaudited

และไม่นำไปคำนวณคะแนนใด ๆ

## 6. Audit Coverage Card

Purpose

แสดงคุณภาพและความน่าเชื่อถือของข้อมูลใน SEO Workspace

ผู้ใช้ต้องสามารถตอบได้ว่า

Dashboard นี้อ้างอิงข้อมูล SEO มากน้อยแค่ไหน

ก่อนดูคะแนน Site Health

Data Source

Published Content

Post
Event
Promotion

และ

Latest SeoAudit

Metrics
Audited Content

สูตร

count(published content with latestAudit)
Published Content

สูตร

count(all published content)
Coverage Percentage

สูตร

(audited / published) * 100

ตัวอย่าง

842 / 1200
70.2%
Median Audit Age

สูตร

median(
today - latestAudit.analyzedAt
)

หน่วย

days
Warning Rules
Condition	State
≥ 80%	Healthy
50–79%	Warning
< 50%	Critical
UI Example
+--------------------------------------+
| Audit Coverage                       |
|                                      |
| 842 / 1200 audited                   |
| Coverage: 70.2%                      |
| Median Audit Age: 18 days            |
|                                      |
| Status: Warning                      |
+--------------------------------------+

## 7. Site Health Card

Purpose

แสดงสุขภาพ SEO ระดับเว็บไซต์จากข้อมูล Audit ล่าสุด

Eligibility

คำนวณเฉพาะ

Audited Content

เท่านั้น

Item Health Formula

อ้างอิงจาก Section 5

(
seoScore +
readabilityScore +
socialCoverageScore +
linkCoverageScore
) / 4
Site Health Formula
average(itemHealth)
Component Metrics

เก็บค่าเฉลี่ยแยกด้วย

avgSeoScore
avgReadability
avgSocialCoverage
avgLinkCoverage
Health Bands
Score	Band
90–100	Excellent
80–89	Good
70–79	Fair
<70	Needs Attention
Response Example
{
  "score": 82,
  "band": "GOOD",
  "components": {
    "seo": 84,
    "readability": 79,
    "social": 88,
    "links": 76
  }
}
UI Example
+--------------------------------------+
| Site Health                          |
|                                      |
| Score: 82                            |
| Band: Good                           |
|                                      |
| SEO          84                      |
| Readability  79                      |
| Social       88                      |
| Links        76                      |
+--------------------------------------+

# 8. Snapshot Architecture

## Purpose

A6.0 must never aggregate all SEO audit data on every request.

The workspace uses a cached snapshot model:

```txt
Request
  ↓
Snapshot Resolver
  ↓
Cache Hit? ── Yes → Return Snapshot
  ↓ No
Snapshot Builder
  ↓
Store Snapshot (TTL 15 minutes)
  ↓
Return Snapshot
Goals
Fast dashboard response
Predictable database load
No schema changes
Compatible with future A6.1 and A6.3
Snapshot Structure
export interface WorkspaceSnapshot {
  version: "a6.0-v1"
  generatedAt: string

  coverage: {
    audited: number
    total: number
    percent: number
    medianAuditAgeDays: number
  }

  health: {
    totalPublished: number
    avgSeoScore: number
    excellentCount: number
    needsAttentionCount: number
  }

  quickWins: Array<{
    checkId: string
    label: string
    affectedCount: number
    avgRecoverablePoints: number
    deepLink: string // /admin/seo/workspace?issue={checkId}
  }>
}
Snapshot Builder

Location:

lib/seo-workspace/snapshot-builder.ts

Responsibilities:

Resolve latest audit for each content item
Build coverage metrics
Calculate site health
Aggregate opportunities
Build final snapshot object

The builder performs all expensive calculations.

No React component may calculate SEO aggregates.

Snapshot Resolver

Location:

lib/seo-workspace/snapshot-resolver.ts

Responsibilities:

Check cache
Return cached snapshot when valid
Build new snapshot when expired
Prevent duplicate builds

Pseudo flow:

const snapshot = await getSnapshot()

if (snapshot) {
  return snapshot
}

return await buildSnapshot()
Cache Policy

TTL:

15 minutes

Reason:

SEO metrics do not require real-time updates
Reduces repeated database scans
Acceptable editorial delay
Single Flight Protection

Only one snapshot build may run at a time.

Example:

Request A → build starts
Request B → waits
Request C → waits

Build complete

A/B/C receive same snapshot

Prevents dashboard stampede after cache expiry.

Cache Storage

A6.0:

In-memory cache

Example:

Map<string, WorkspaceSnapshot>

Future:

Redis

Allowed in A6.2+ if multi-instance deployment requires shared cache.

Cache Invalidation

A6.0:

TTL expiration only

No active invalidation.

Future phases may invalidate after:

Post update
Event update
Promotion update
Performance Targets
Metric	Target
Cache hit response	< 100ms
Snapshot build	< 5s
Dashboard payload	< 20 KB
Memory footprint	< 5 MB
Monitoring

Log:

snapshot_generated
snapshot_duration_ms
snapshot_item_count
cache_hit
cache_miss

These logs are required for rollout verification.

Future Compatibility

A6.1:

SEO Queue (`/admin/seo/issues/[checkId]`) — same filter/aggregation as `?issue=`

A6.2:

Reports, trends, distribution charts

A6.3:

rollup tables
body link graph
persistent tasks

All future phases must consume the same snapshot interface when possible