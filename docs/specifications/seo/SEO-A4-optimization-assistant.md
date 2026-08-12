# SEO-A4 — Optimization Assistant

**Status:** Implementation Approved  
**Phase:** A4  
**Type:** Specification  
**Depends on:** SEO-A1 (Audit Engine), SEO-A2 (Editor Preview Parity)  
**Blocks:** SEO-A5 (AI Assistant), SEO-A6 (Workspace MVP)

---

## 1. Executive Summary

SEO-A4 Optimization Assistant เป็นเลเยอร์ช่วยกรอกและปรับปรุง SEO **ในระดับเนื้อหารายชิ้น** ภายในหน้าแก้ไข Post, Event และ Promotion

ก่อนหน้านี้ A1 ให้ระบบคำนวณคะแนนและตรวจสอบ SEO อัตโนมัติเมื่อบันทึก และ A2 ทำให้คะแนนในหน้าแก้ไขตรงกับที่เซิร์ฟเวอร์จะบันทึก แต่ผู้ใช้ยังต้อง **แปลผล checklist เอง** ว่าควรแก้อะไรก่อน แก้อย่างไร และจะได้คะแนนกลับมาเท่าไร

A4 เปลี่ยน SEO Score Panel จาก "รายงานสถานะ" เป็น **ผู้ช่วยทำงาน (Optimization Assistant)** ที่:

- สรุปคะแนนและระยะห่างจากเป้าหมายถัดไป (เช่น อีก 8 คะแนนจะถึง Good)
- แสดง Issues ที่สำคัญที่สุดในรูปแบบอ่านง่าย
- เสนอข้อความแก้ไขที่ copy ได้ทันที (rule-based ไม่ใช้ AI)
- แนะนำ Internal Link ที่เหมาะสมกับประเภทเนื้อหา
- จัดลำดับ Quick Wins ตามคะแนนที่จะได้กลับมา

เป้าหมายหลักของ A4 คือ **ลด friction ในการกรอก SEO** ไม่ใช่สร้าง dashboard ระดับเว็บไซต์ (เลื่อนไป A6) และไม่ใช่สร้างข้อความด้วย LLM (เลื่อนไป A5)

A4 v1 ทำงานบน `analyzeSeoScore()` และ `SeoCheck` ที่มีอยู่แล้ว **โดยไม่เปลี่ยนสูตรคำนวณคะแนน** ไม่เพิ่ม Prisma schema และ **ไม่เพิ่ม API endpoint ใหม่** — scoring รันจาก form state (parity กับ A2) ส่วน Internal Link Suggestions ดึงจาก DB query บน editor page (server component / loader) โดยตรง

### ขอบเขตหน้าจอ

| Route | Content Type |
|-------|--------------|
| `/admin/posts/[id]/edit` | Post |
| `/admin/events/[id]/edit` | Event |
| `/admin/promotions/[id]/edit` | Promotion |

Assistant แสดงในแท็บ SEO ของ editor แต่ละประเภท แทนที่หรือขยายจาก `SeoScorePanel` ปัจจุบัน

### สิ่งที่ผู้ใช้จะเห็น (ภาพรวม — Editor Assistant)

A4 ตอบคำถามเดียว: **"ฉันควรแก้อะไรต่อ?"** (ไม่ใช่ analytics dashboard)

```txt
┌──────────────────────┐
│ SEO Score Summary    │  ← คะแนน + gap + top blockers (≤3)
├──────────────────────┤
│ Quick Wins           │  ← Impact ก่อน (recoverable points)
├──────────────────────┤
│ Fix Suggestions      │  ← ข้อความ copy ได้
├──────────────────────┤
│ Internal Links       │  ← ลิงก์แนะนำ + reason
├──────────────────────┤
│ Diagnostics          │  ← Root cause (collapsed default)
└──────────────────────┘
```

รายละเอียด layout: **Section 8**

### ความสัมพันธ์กับ roadmap

```txt
A1 Audit Engine          ✅ คำนวณ checks + คะแนน
A2 Preview Parity        ✅ editor เห็นคะแนนก่อน save
A4 Optimization Assistant  ← ช่วยให้แก้ไขได้ง่ายขึ้น (เฟสนี้)
A3 Preview Transparency    (SERP/OG — ทำคู่ขนานได้)
A5 AI Assistant            (LLM generation — หลัง A4)
A6 Workspace MVP           (site-wide — หลัง A4 หรือคู่ขนาน)
```

---

## 2. Goals

### G1 — Actionable SEO Guidance

เปลี่ยนจาก checklist ทางเทคนิค เป็นคำแนะนำที่ **ทำตามได้ทันที** ผู้ใช้ต้องรู้ว่าปัญหาคืออะไร ควรแก้ที่ฟิลด์ไหน และลำดับความสำคัญเป็นอย่างไร

**Block 1 (Diagnosis)** บอกว่า **อะไรเสีย** — ไม่เรียงตามคะแนน

```txt
Top Issues:
❌ Meta Description missing
❌ No internal links
⚠️ Missing alt text
```

**Block 4 (Prioritization)** บอกว่า **ทำอะไรก่อนคุ้มสุด** — เรียงตาม recoverable score

```txt
Best Improvements:
+8 Add Meta Description
+5 Add Internal Links
+2 Add Alt Text
```

### G2 — Score Gap Visibility

แสดงคะแนนปัจจุบันและ **ระยะห่างจาก progress milestone ถัดไปเท่านั้น** — เป็น UX แยกจาก A1 score bands

#### A1 Score Bands (Audit / Meter)

ใช้สำหรับสี meter และ publish warning — **ไม่ใช้** ข้อความ gap

| Band | ช่วงคะแนน | ข้อความ UI |
|------|-----------|------------|
| Poor | 0–69 | ต้องปรับปรุง |
| Good | 70–89 | พอใช้ / ดี |
| Excellent | 90–100 | ดีมาก |

#### A4 Progress Bands (Gap Motivation)

ใช้เฉพาะ `scoreGapMessage` — **ไม่ผูกกับ A1 band**

| Milestone | Threshold | Gap Message |
|-----------|-----------|-------------|
| Fair | 70 | อีก X คะแนนจะถึง Fair |
| Good | 80 | อีก X คะแนนจะถึง Good |
| Excellent | 90 | อีก X คะแนนจะถึง Excellent |
| Max | 90+ | คุณผ่านเกณฑ์สูงสุดแล้ว |

**ตัวอย่าง**

```txt
62  → อีก 8 คะแนนจะถึง Fair
78  → อีก 2 คะแนนจะถึง Good
84  → อีก 6 คะแนนจะถึง Excellent
95  → คุณผ่านเกณฑ์สูงสุดแล้ว
```

สูตร: `gap = nextMilestone - seoScore` (ไม่แสดงเมื่อ `seoScore >= 90`)

**เหตุผล:** คะแนน 78 + "อีก 2 คะแนนจะถึง Good" สร้างแรงจูงใจมากกว่า "คุณอยู่ Good แล้ว" (ตาม A1 band 70–89)

### G3 — Copy-Ready Fix Suggestions

สำหรับฟิลด์ SEO หลัก (เริ่มจาก meta description, SEO title, focus keyword) แสดง:

- ค่าปัจจุบัน (จาก form + auto-fill preview ตาม A2)
- ค่าที่แนะนำ (rule-based จากเนื้อหา, title, excerpt, tags)
- ปุ่ม **Copy** เพื่อนำไปวางในฟิลด์

ผู้ใช้เป็นคนตัดสินใจ apply — ระบบ **ไม่ auto-save** ค่าที่แนะนำ

### G4 — Internal Link Discovery (DB Query)

เมื่อ check `internal-links` ไม่ผ่าน แสดงรายการลิงก์ภายในจาก **DB query แบบ rule-based** ไม่ใช่ static catalog และไม่ใช่ AI

ตัวอย่างกฎ: Post ในหมวด Restaurant → ดึง published posts หมวดเดียวกัน, SEO score > 70, ล่าสุด 5 รายการ

```txt
Suggested Internal Links:
- ร้านอาหารญี่ปุ่นยอดนิยม
- โปรโมชั่นร้านอาหารล่าสุด
- รวมร้านอาหารในเดอะพาซิโอ
```

Query รันบน editor page (server-side) — ไม่ต้องสร้าง API endpoint ใหม่

### G5 — Best Improvements (SEO Quick Wins)

จัดลำดับการแก้ไขตาม **คะแนน SEO ที่ recover ได้** จาก checks ใน group `seo` เท่านั้น (`bad` หรือ `ok`)

```txt
+8 Add Meta Description
+5 Add Internal Links
+2 Add Alt Text
```

**ไม่รวม readability** ใน Block 4 — readability แสดงใน Top Issues (Block 1) เท่านั้น; coaching ละเอียดเลื่อนไป A4.1

อัปเดตแบบ real-time เมื่อผู้ใช้แก้ form (debounce เดียวกับ A2)

### G6 — Editor Parity Preserved

คะแนน Issues Quick Wins และ Suggestions ต้องคำนวณจาก **preview payload เดียวกับ A2** (`buildPreviewSeoPayload` + `analyzeSeoScore`) เพื่อไม่ให้เกิดความไม่สอดคล้องระหว่าง Assistant กับคะแนนที่ save จริง

### G7 — Content-Type Aware

พฤติกรรม Assistant ปรับตาม `post` | `event` | `promotion`:

- threshold ความยาวเนื้อหา (post ยาวกว่า event/promotion)
- internal link query rules ต่างกัน
- ข้อความแนะนำอ้างอิงฟิลด์ที่มีจริงในแต่ละ editor

---

## 3. Non Goals

### NG1 — AI-Generated Copy

A4 v1 **ไม่ใช้ LLM** ไม่เรียก OpenAI หรือ API ภายนอก ข้อความแนะนำมาจาก template + rule engine เท่านั้น

→ การสร้างข้อความเชิงสร้างสรรค์ด้วย AI อยู่ใน **SEO-A5**

### NG2 — Site-Wide SEO Dashboard

ไม่มีหน้า workspace ระดับเว็บไซต์ ไม่ aggregate ข้าม content ไม่มี coverage card / worst content table

→ อยู่ใน **SEO-A6** (หยุดชั่วคราวตาม roadmap ปัจจุบัน)

### NG3 — Scoring Formula Changes

ห้ามแก้ `analyzeSeoScore()` weights thresholds หรือ check definitions ใน A4 Assistant อ่านผลจาก engine เดิมเท่านั้น

### NG4 — New API Endpoints (v1)

A4 v1 **ไม่เพิ่ม API endpoint ใหม่** (`/api/...`)

อนุญาต:

- DB query จาก editor page (server component / page loader)
- ไม่เพิ่ม Prisma model หรือ migration

Suggestion rules และ `SeoCheckCatalog` อยู่ใน codebase (`lib/seo-check-catalog.ts`, `lib/seo-recommendations.ts`)

### NG5 — Auto-Apply Without Consent

ระบบไม่แก้ form fields อัตโนมัติเมื่อผู้ใช้เปิดหน้า ไม่ save แทนผู้ใช้ ปุ่ม Apply (ถ้ามีในเฟสถัดไป) ต้อง explicit click เท่านั้น

Copy ใน v1 = clipboard เท่านั้น

### NG6 — SERP / Social Preview UI

ไม่รวม Google snippet preview, OG card mockup, หรือคำอธิบาย auto-fill แบบละเอียด

→ อยู่ใน **SEO-A3** (Preview Transparency)

### NG7 — Bulk / Batch Optimization

ไม่มีการเลือกหลายเนื้อหาแล้ว optimize พร้อมกัน ไม่มี task queue หรือ assignee

### NG8 — Orphan / Decay / Trend Analysis

ไม่วิเคราะห์ inbound links, content freshness หรือแนวโน้มคะแนนตามเวลา

### NG9 — Readability in Quick Wins

Readability issues แสดงได้ใน **Top Issues (Block 1)** เช่น `❌ Readability ต่ำ`

แต่ **Block 4 (Best Improvements) = SEO group only** เพราะ readability fixes ไม่ actionable ชัด (เช่น "ใช้ประโยคสั้นลง" ไม่บอกได้ชัดว่าจะได้กี่คะแนน)

**Readability Tips** เป็น section แยกในอนาคต (A4.1) — ไม่อยู่ใน v1 scope

---

## 4. User Stories

บทบาทอ้างอิงจาก RBAC ปัจจุบัน: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `MARKETING` (events/promotions)

---

### US-01 — เห็นคะแนนและเป้าหมายถัดไป

**ในฐานะ** Content Editor  
**เมื่อ** เปิดแท็บ SEO ในหน้าแก้ไข Post  
**ฉันต้องการ** เห็นคะแนน SEO ปัจจุบันและระยะห่างจาก band ถัดไป  
**เพื่อ** รู้ว่าต้องปรับอีกเท่าไรก่อนถือว่าพอใจ

**Acceptance hints**

- แสดง `seoScore` จาก preview result
- แสดงข้อความ gap เช่น "อีก 8 คะแนนจะถึง Good"
- อัปเดตภายใน ~300ms หลังแก้ form

---

### US-02 — เห็น Diagnosis (อะไรเสีย)

**ในฐานะ** Marketing user  
**เมื่อ** แก้ไข Promotion ที่คะแนนต่ำ  
**ฉันต้องการ** เห็นรายการปัญหาที่สำคัญ 3–5 รายการแรก  
**เพื่อ** เข้าใจสถานะโดยไม่ต้องอ่าน checklist ยาว 15 รายการ

**Acceptance hints**

- Block 1 = **Diagnosis** ไม่ใช่ Prioritization
- แสดง `bad` ก่อน `ok` (readability รวมได้)
- เรียงตาม catalog `issuePriority` ไม่ใช่ recoverable score
- จำกัด top 5 ใน Block 1

---

### US-03 — Copy ข้อความ Meta Description ที่แนะนำ

**ในฐานะ** Editor  
**เมื่อ** meta description สั้นเกินไป  
**ฉันต้องการ** เห็นข้อความปัจจุบันและข้อความที่แนะนำ พร้อมปุ่ม Copy  
**เพื่อ** วางในช่อง SEO Description ได้ทันทีโดยไม่ต้องคิดเอง

**Acceptance hints**

- Current มาจาก preview SEO description (รวม auto-fill)
- Recommended มาจาก rule engine (ไม่ใช่ AI)
- กด Copy แล้วได้ข้อความบน clipboard
- ไม่เปลี่ยน form จนกว่าผู้ใช้วางเอง

---

### US-04 — รู้ว่าควรใส่ Internal Link ไปไหน

**ในฐานะ** Editor  
**เมื่อ** เนื้อหาไม่มีลิงก์ภายใน  
**ฉันต้องการ** เห็นรายการหน้าที่แนะนำให้ลิงก์  
**เพื่อ** เพิ่ม internal link ได้โดยไม่ต้องจำ URL เอง

**Acceptance hints**

- แสดงเมื่อ check `internal-links` เป็น `bad`
- แต่ละรายการมี label + URL/path
- คลิกแล้ว copy URL หรือเปิดหน้าเป้าหมายในแท็บใหม่ (พฤติกรรมระบุใน Section 8)

---

### US-05 — จัดลำดับงานด้วย Best Improvements

**ในฐานะ** Editor ที่มีเวลาจำกัด  
**เมื่อ** มีหลาย SEO issues  
**ฉันต้องการ** เห็นรายการ Best Improvements เรียงตามคะแนน SEO ที่จะได้กลับมา  
**เพื่อ** แก้สิ่งที่คุ้มค่าที่สุดก่อน

**Acceptance hints**

- Block 4 = **Prioritization** — ต่างจาก Block 1 ชัดเจน
- เฉพาะ checks ใน group `seo` ที่ `quickWinEligible`
- แต่ละรายการแสดง `+N คะแนน` และ `actionLabel` จาก catalog
- เรียงตาม `recoverableSeoPoints` DESC
- รายการหายไปเมื่อ check กลายเป็น `good`

---

### US-06 — คะแนนตรงกับตอน Save

**ในฐานะ** Editor ที่ไว้ใจระบบ  
**เมื่อ** ปรับเนื้อหาตามคำแนะนำแล้วกด Save  
**ฉันต้องการ** คะแนนที่บันทึกตรงกับที่เห็นใน Assistant ก่อน save  
**เพื่อ** ไม่สับสนระหว่าง preview กับ audit จริง

**Acceptance hints**

- ใช้ preview pipeline เดียวกับ A2
- ไม่มี client-only scoring path แยกต่างหาก

---

### US-07 — ทำงานได้ทั้ง 3 content types

**ในฐานะ** Admin  
**เมื่อ** แก้ไข Post, Event หรือ Promotion  
**ฉันต้องการ** เห็น Optimization Assistant ในทุก editor  
**เพื่อ** ได้ประสบการณ์เดียวกันไม่ว่าจะทำ content ประเภทใด

**Acceptance hints**

- UI structure เหมือนกันทั้ง 3 หน้า
- ข้อความและ link catalog ปรับตาม `contentType`

---

### US-08 — ไม่รบกวนผู้ที่คะแนนดีแล้ว

**ในฐานะ** Editor ที่ SEO ผ่านเกณฑ์แล้ว (≥ 80)  
**เมื่อ** เปิด Assistant  
**ฉันต้องการ** เห็นสถานะ positive และ Quick Wins น้อยหรือไม่มี  
**เพื่อ** ไม่รู้สึกว่าถูกบังคับแก้สิ่งที่ไม่จำเป็น

**Acceptance hints**

- แสดงข้อความยืนยันเมื่อ band = green
- Fix Suggestions แสดงเฉพาะ checks ที่ยังไม่ `good` (ถ้ามี)

---

### US-09 — เข้าถึงได้ตามสิทธิ์เดิม

**ในฐานะ** MARKETING user  
**เมื่อ** แก้ไข Event หรือ Promotion  
**ฉันต้องการ** ใช้ Optimization Assistant ได้  
**เพื่อ** ปรับ SEO ได้โดยไม่ต้องขอ ADMIN

**Acceptance hints**

- ไม่เพิ่ม permission module ใหม่
- ใช้สิทธิ์ editor เดิมของแต่ละ content type

---

### US-10 — เข้าใจว่าทำไมถึงแนะนำ

**ในฐานะ** Editor  
**เมื่อ** เห็นคำแนะนำ SEO  
**ฉันต้องการ** รู้เหตุผลสั้น ๆ ว่าทำไมเรื่องนี้สำคัญ  
**เพื่อ** ไว้ใจคำแนะนำและตัดสินใจ apply ได้

**Acceptance hints**

- แต่ละ suggestion แสดง `reason` จาก `SeoCheckCatalog`
- ตัวอย่าง: "Search engines use meta descriptions to understand page summaries."

---

### US-11 — Copy คำแนะนำด้วยคลิกเดียว

**ในฐานะ** Editor  
**เมื่อ** เห็นข้อความที่แนะนำ  
**ฉันต้องการ** กด Copy แล้วได้ข้อความบน clipboard ทันที  
**เพื่อ** ไม่ต้องพิมพ์ใหม่เอง

**Acceptance hints**

- ปุ่ม Copy บน Block 2 (Fix Suggestions)
- ไม่เปลี่ยน form field อัตโนมัติ
- แสดง feedback สั้น ๆ หลัง copy สำเร็จ (เช่น "Copied")

---

## 5. SeoCheckCatalog

### 5.1 Purpose

`SeoCheckCatalog` เป็น **แหล่ง metadata กลาง** ที่ map `checkId` จาก A1 (`analyzeSeoScore`) ไปยังพฤติกรรมของ A4 Assistant

ไม่มี catalog นี้ A4 จะ hard-code กระจายใน UI และต่อยอด A5/A6 ไม่ได้

```txt
A1 analyzeSeoScore()  →  SeoCheck { id, status, weight, maxWeight, ... }
                                    ↓
                         SeoCheckCatalog[id]
                                    ↓
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
        Block 1 Issues      Block 2 Suggestions    Block 4 Quick Wins
        (A4)                (A4)                   (A4)
              │                     │                     │
              └─────────────────────┴─────────────────────┘
                                    ↓
                         A5 AI Assistant (future)
                         A6 Opportunities (future)
```

**กฎสำคัญ:** `maxWeight` ใน catalog ต้องตรงกับ A1 เสมอ — catalog ไม่ redefine scoring

### 5.2 Location & File Boundaries

```
lib/
  seo-check-catalog.ts    — WHAT: metadata, priorities, capabilities
  seo-recommendations.ts  — HOW:  generate suggested text (Section 6)
  seo-assistant.ts        — ORCHESTRATION: buildAssistantState() (Section 6)
  seo-score.ts            — frozen (A1) — ไม่แก้
```

**Separation of concerns**

| Module | รู้เรื่อง | ไม่รู้เรื่อง |
|--------|----------|-------------|
| `seo-check-catalog.ts` | check metadata, labels, priorities | วิธีสร้าง recommendation |
| `seo-recommendations.ts` | rule-based text generation | UI, React, API routes |
| `seo-assistant.ts` | รวม catalog + score + recommendations → state | DB queries (รับ links จากภายนอก) |

### 5.3 Catalog Versioning

```ts
export const SEO_CHECK_CATALOG_VERSION = "a4-v1" as const;
```

ทุก `SeoCheckCatalogEntry` อยู่ภายใต้ version นี้

**เหตุผล:** เมื่อ A1 เพิ่ม check ใหม่ (เช่น `schema-markup`, `faq-structured-data`) version ใหม่จะบังคับให้:

1. เพิ่ม catalog entry หรือ
2. ระบุชัดว่า check นั้น `showInIssues: false` โดยตั้งใจ

**Validation test:** ถ้า `analyzeSeoScore()` emit `checkId` ที่ไม่มีใน catalog → build ล้มเหลวใน dev/test

เมื่อเพิ่ม check ใน A1 ต้อง bump เป็น `a4-v2` (หรือ `a5-v1` ถ้าเปลี่ยน major behavior)

### 5.4 Type Definitions

```ts
export type SeoCheckGroup = "seo" | "readability";

export type RecommendationType =
  | "none"       // แสดงใน Issues เท่านั้น ไม่มี suggestion block
  | "generated"  // สร้างข้อความแนะนำ (title, desc, keyword, alt)
  | "links"      // Block 3 — DB query internal links
  | "content"    // แก้ใน rich text (subheadings, body length, manual link)
  | "field"      // กรอกฟิลด์ธรรมดา (title, slug, focus keyword)
  | "image";     // อัปโหลดรูปปก

export type SeoCheckCatalogEntry = {
  /** ต้องตรงกับ SeoCheck.id จาก analyzeSeoScore() */
  id: string;

  /** ชื่อสำหรับ checklist เดิม (ภาษาไทย) */
  label: string;

  /** ข้อความ diagnosis ใน Block 1 — อะไรเสีย */
  issueLabel: string;

  /** ข้อความ action ใน Block 4 — ทำอะไร */
  actionLabel: string;

  group: SeoCheckGroup;

  /** ต้องตรงกับ A1 maxWeight (SEO checks รวม = 100) */
  maxWeight: number;

  /** แสดงใน Block 1 Top Issues */
  showInIssues: boolean;

  /** แสดงใน Block 4 Best Improvements (v1 = seo group only) */
  quickWinEligible: boolean;

  /** แสดงใน Block 2 Fix Suggestions */
  hasFixSuggestion: boolean;

  recommendationType: RecommendationType;

  /** US-10 — เหตุผลสั้น ๆ ว่าทำไมสำคัญ */
  reason: string;

  /** ลำดับใน Block 1 เมื่อ status เท่ากัน (ต่ำ = สำคัญกว่า) */
  issuePriority: number;

  /** ฟิลด์ form ที่เกี่ยวข้อง (ถ้ามี) */
  targetField?: string;
};
```

### 5.5 Recommendation Capability Matrix

กำหนดว่าแต่ละ `recommendationType` ทำอะไรได้ใน UI — ช่วย Section 6 และ Section 8

| Type | Block 2 (Fix Suggestions) | Block 3 (Links) | Block 4 (Quick Wins) | หมายเหตุ |
|------|---------------------------|-----------------|----------------------|----------|
| `generated` | Current → Recommended + Copy | — | ✓ | title, desc, alt text |
| `field` | แสดง target field + คำแนะนำสั้น | — | ✓ | title, slug, focus keyword |
| `links` | — | Suggested links list | ✓ | DB query (Section 7) |
| `image` | แจ้งเตือนอัปโหลดรูปปก | — | ✓ | ไม่ generate binary |
| `content` | Issue only (ไม่มี generated text) | — | ✓ | subheadings, body length, topic-in-content |
| `none` | — | — | — | readability only — Issues (Block 1) |

**กฎ:**

- `hasFixSuggestion = true` เฉพาะ `generated` และ `field`
- `content` → `hasFixSuggestion = false` แต่ยังอยู่ใน Issues + Quick Wins
- `links` → suggestions อยู่ใน Block 3 ไม่ใช่ Block 2

### 5.6 A1 vs A4 Score Bands

| Layer | Purpose | Bands |
|-------|---------|-------|
| **A1** | Audit truth, meter color, publish warning | Poor &lt; 70 · Good 70–89 · Excellent ≥ 90 |
| **A4** | Progress motivation (gap message only) | Milestones at 70, 80, 90 |

ห้ามใช้ A1 band label ใน `scoreGapMessage`

### 5.7 Recoverable Score Formula

คะแนน SEO รวม 100 มาจาก SEO checks ที่ `maxWeight` รวม = 100 (A1)

```ts
function recoverableSeoPoints(check: SeoCheck): number {
  if (check.group !== "seo") return 0;
  if (check.status === "good") return 0;
  return check.maxWeight - check.weight;
}
```

| Status | weight (A1) | recoverable |
|--------|-------------|-------------|
| `bad` | 0 | `maxWeight` |
| `ok` | `round(maxWeight × 0.5)` | `maxWeight - weight` |
| `good` | `maxWeight` | 0 |

**ตัวอย่าง:** `desc-length` (maxWeight 12) status `bad` → **+12 คะแนน** บน SEO score

Block 4 แสดงเป็น `+{recoverableSeoPoints} {actionLabel}`

### 5.8 issuePriority (Required — Full Table)

ลำดับใน Block 1 เมื่อ status เท่ากัน — **ค่าคงที่ใน spec ห้าม dev ตัดสินเอง**

ค่าสูง = แสดงก่อน (ภายในกลุ่ม `bad` หรือ `ok` เดียวกัน)

#### SEO Group

| checkId | issuePriority | หมายเหตุ |
|---------|---------------|----------|
| `title-length` | 100 | สัญญาณหลักใน SERP |
| `title-exists` | 99 | ต้องมี title ก่อน |
| `desc-length` | 95 | Meta description |
| `topic-in-title-desc` | 90 | คำสำคัญใน title/description |
| `topic-clarity` | 88 | ต้องมี focus keyword ก่อน |
| `internal-links` | 80 | ลิงก์ภายใน |
| `image-alt` | 70 | Alt text |
| `subheadings` | 60 | โครงสร้าง H2/H3 |
| `content-length` | 55 | ความยาวเนื้อหา |
| `topic-in-content` | 50 | คำสำคัญในเนื้อหา — อยู่ Issues + Quick Wins |
| `slug-exists` | 45 | URL slug |
| `social-ready` | 38 | รูปแชร์โซเชียล |

#### Readability Group

| checkId | issuePriority | หมายเหตุ |
|---------|---------------|----------|
| `sentence-length` | 30 | ประโยคยาวเกินไป |
| `content-present` | 28 | เนื้อหาสั้นเกินไป |
| `paragraph-length` | 25 | ย่อหน้ายาว |
| `sentence-variety` | 22 | สัดส่วนประโยคสั้น |
| `heading-structure` | 20 | โครงสร้างหัวข้อ (readability) |

**Block 1 sort order:**

1. `status`: `bad` ก่อน `ok` (ข้าม `good`)
2. `issuePriority` DESC
3. `checkId` ASC (tie-breaker)

### 5.9 Full Catalog (A1 Parity)

ทุก `id` ต้องมี entry — ห้ามขาด

#### SEO Group (12 checks)

| id | maxWeight | priority | showInIssues | quickWin | hasFix | recommendationType | targetField |
|----|-----------|----------|--------------|----------|--------|-------------------|-------------|
| `title-length` | 12 | 100 | ✓ | ✓ | ✓ | `generated` | `seo.seoTitle` |
| `title-exists` | 5 | 99 | ✓ | ✓ | ✓ | `field` | `title` |
| `desc-length` | 12 | 95 | ✓ | ✓ | ✓ | `generated` | `seo.seoDescription` |
| `topic-in-title-desc` | 8 | 90 | ✓ | ✓ | ✓ | `generated` | `seo.seoTitle` |
| `topic-clarity` | 5 | 88 | ✓ | ✓ | ✓ | `field` | `seo.focusKeyword` |
| `internal-links` | 10 | 80 | ✓ | ✓ | — | `links` | `content` |
| `image-alt` | 14 | 70 | ✓ | ✓ | ✓ | `generated` | `coverImageAlt` |
| `subheadings` | 8 | 60 | ✓ | ✓ | — | `content` | `content` |
| `content-length` | 10 | 55 | ✓ | ✓ | — | `content` | `content` |
| `topic-in-content` | 5 | 50 | ✓ | ✓ | — | `content` | `content` |
| `slug-exists` | 6 | 45 | ✓ | ✓ | ✓ | `field` | `slug` |
| `social-ready` | 5 | 38 | ✓ | ✓ | — | `image` | `featuredImage` |

#### Readability Group (5 checks)

| id | maxWeight | priority | showInIssues | quickWin | hasFix | recommendationType |
|----|-----------|----------|--------------|----------|--------|-------------------|
| `sentence-length` | 8 | 30 | ✓ | — | — | `none` |
| `content-present` | 8 | 28 | ✓ | — | — | `none` |
| `paragraph-length` | 8 | 25 | ✓ | — | — | `none` |
| `sentence-variety` | 4 | 22 | ✓ | — | — | `none` |
| `heading-structure` | 8 | 20 | ✓ | — | — | `none` |

`quickWinEligible = false` สำหรับ readability ทั้งหมดใน v1 (NG9)

**`topic-in-content`:** `hasFixSuggestion = false` แต่ยังอยู่ใน Top Issues และ Best Improvements

### 5.10 Issue & Action Labels (ตัวอย่างหลัก)

| id | issueLabel (Block 1) | actionLabel (Block 4) | reason (US-10) |
|----|----------------------|----------------------|----------------|
| `desc-length` | Meta Description สั้นหรือยาวเกินไป | เพิ่ม Meta Description | Search engines ใช้ meta description สรุปหน้าในผลการค้นหา |
| `internal-links` | ไม่มี Internal Link | เพิ่ม Internal Link | Internal links ช่วยให้ search engine และผู้อ่านค้นพบเนื้อหาที่เกี่ยวข้อง |
| `image-alt` | ไม่มี Alt Text | เพิ่ม Alt Text | Alt text ช่วย accessibility และช่วย search engine เข้าใจรูปภาพ |
| `title-length` | SEO Title สั้นหรือยาวเกินไป | ปรับ SEO Title | Title เป็นสัญญาณหลักที่ search engine ใช้จัดอันดับหน้า |
| `topic-clarity` | ไม่มีคำสำคัญหลัก | ตั้งคำสำคัญหลัก | Focus keyword ช่วยจัดโฟกัสเนื้อหาและ metadata ให้สอดคล้องกัน |
| `topic-in-content` | คำสำคัญไม่อยู่ในเนื้อหา | เพิ่มคำสำคัญในเนื้อหา | คำสำคัญในช่วงต้นเนื้อหาช่วย search engine เข้าใจหัวข้อหลัก |
| `subheadings` | ไม่มีหัวข้อย่อย (H2/H3) | เพิ่มหัวข้อย่อย | หัวข้อย่อยช่วยโครงสร้างเนื้อหาและให้ search engine เข้าใจหัวข้อหลัก |
| `sentence-length` | ประโยคยาวเกินไป | — | ประโยคสั้นอ่านง่ายขึ้น — แสดงใน Issues เท่านั้น (A4.1 สำหรับ tips) |

### 5.11 Catalog Entry Examples

```ts
"desc-length": {
  id: "desc-length",
  label: "ความยาว meta description",
  issueLabel: "Meta Description สั้นหรือยาวเกินไป",
  actionLabel: "เพิ่ม Meta Description",
  group: "seo",
  maxWeight: 12,
  showInIssues: true,
  quickWinEligible: true,
  hasFixSuggestion: true,
  recommendationType: "generated",
  reason:
    "Search engines ใช้ meta description สรุปหน้าในผลการค้นหา — ความยาว 70–165 ตัวอักษรเหมาะสมที่สุด",
  issuePriority: 95,
  targetField: "seo.seoDescription",
},
```

```ts
"topic-in-content": {
  id: "topic-in-content",
  label: "คำสำคัญในเนื้อหา",
  issueLabel: "คำสำคัญไม่อยู่ในเนื้อหา",
  actionLabel: "เพิ่มคำสำคัญในเนื้อหา",
  group: "seo",
  maxWeight: 5,
  showInIssues: true,
  quickWinEligible: true,
  hasFixSuggestion: false,
  recommendationType: "content",
  reason: "คำสำคัญในช่วงต้นเนื้อหาช่วย search engine เข้าใจหัวข้อหลัก",
  issuePriority: 50,
  targetField: "content",
},
```

```ts
"internal-links": {
  id: "internal-links",
  label: "ลิงก์ภายใน",
  issueLabel: "ไม่มี Internal Link",
  actionLabel: "เพิ่ม Internal Link",
  group: "seo",
  maxWeight: 10,
  showInIssues: true,
  quickWinEligible: true,
  hasFixSuggestion: false,
  recommendationType: "links",
  reason:
    "Internal links ช่วยให้ search engine และผู้อ่านค้นพบเนื้อหาที่เกี่ยวข้องภายในเว็บไซต์",
  issuePriority: 80,
  targetField: "content",
},
```

### 5.12 Helper Functions

```ts
/** Block 1 — Diagnosis: bad ก่อน ok, เรียง issuePriority */
function getTopIssues(checks: SeoCheck[], limit = 5): SeoIssue[];

/** Block 4 — Prioritization: seo only, เรียง recoverableSeoPoints DESC */
function getBestImprovements(checks: SeoCheck[]): SeoImprovement[];

/** Block 2 — checks ที่ hasFixSuggestion && status !== good */
function getFixSuggestions(checks: SeoCheck[]): SeoFixSuggestion[];

/** Lookup + validate catalog ครบทุก id จาก A1 */
function getCatalogEntry(checkId: string): SeoCheckCatalogEntry;

/** Gap messaging — A4 progress milestones 70 / 80 / 90 (ไม่ใช้ A1 bands) */
function getScoreGapMessage(seoScore: number): string;
```

### 5.13 Validation Rules

1. **Catalog completeness** — ทุก `id` ที่ `analyzeSeoScore()` emit ต้องมี entry (test บังคับ)
2. **Weight parity** — `entry.maxWeight` === runtime `check.maxWeight` (test บังคับ)
3. **No scoring in catalog** — catalog ไม่คำนวณ status; อ่านจาก A1 เท่านั้น
4. **ID stability** — ห้ามเปลี่ยน `id` โดยไม่ migrate A1 + persisted `SeoAudit.checks` JSON
5. **Readability boundary** — `quickWinEligible` ต้อง `false` เมื่อ `group === "readability"` ใน v1
6. **Catalog version** — `SEO_CHECK_CATALOG_VERSION` ต้องตรงกับชุด entries ที่ ship
7. **issuePriority immutability** — ค่าใน Section 5.8 เป็น spec contract; เปลี่ยนต้อง bump catalog version

### 5.14 Future Consumers

| Phase | ใช้ Catalog อย่างไร |
|-------|---------------------|
| **A4** | Issues, Suggestions, Quick Wins, gap labels |
| **A5** | AI prompt context — รู้ว่า check ไหนแก้ได้และ target field คืออะไร |
| **A6** | Opportunities aggregation — `affectedCount` group by `checkId`, sort by `maxWeight × count` |
| **A4.1** | Readability Tips — เพิ่ม `readabilityTip` field ใน catalog entries |

### 5.15 Tests (Section 10 preview)

- Catalog covers all A1 check IDs
- Unknown checkId fails when catalog version mismatches
- `recoverableSeoPoints` สำหรับ `desc-length` bad = 12
- `getTopIssues` เรียง `issuePriority` ไม่ใช่ recoverable score
- `getBestImprovements` รวม `topic-in-content` แต่ไม่รวม readability
- `getScoreGapMessage(78)` = "อีก 2 คะแนนจะถึง Good"
- `getScoreGapMessage(95)` = "คุณผ่านเกณฑ์สูงสุดแล้ว"

**Section 5 Status: ✅ Locked (Principal Review approved)**

---

## 6. Suggestion Engine

### 6.1 Purpose

Suggestion Engine เป็น **Engine Layer** ที่แปลง input จาก editor เป็น `AssistantState` object เดียว

UI ทั้งหน้า consume state นี้ — **ห้าม** ให้ component แต่ละตัว query catalog หรือคำนวณคะแนนเอง

```txt
Product Layer (§1–4)     →  what users need
Domain Layer (§5)        →  SeoCheckCatalog
Engine Layer (§6)        →  buildAssistantState()   ← this section
Data Layer (§7)          →  internal link DB query
UI Layer (§8)            →  render AssistantState
```

### 6.2 Location

```
lib/
  seo-shared.ts              — shared text helpers (A2 + A4)
  seo-assistant.ts           — buildAssistantState(), types
  seo-recommendations.ts     — generateRecommendation() per check
  seo-check-catalog.ts       — catalog lookups (§5)
  seo-internal-links.ts      — DB query (§7, server only)
```

**Properties:**

- Pure TypeScript — ไม่ import React (`seo-assistant`, `seo-recommendations`, `seo-shared`)
- ไม่เรียก DB ใน engine — รับ `internalLinkSuggestions` จาก page server component
- ไม่เรียก API จาก React hooks
- **Deterministic** — input เดียวกัน → output เดียวกันเสมอ (§6.11)

### 6.2.1 Shared Helpers — seo-shared.ts

**ห้าม** `seo-recommendations.ts` เรียก `seo-auto-fill.ts` โดยตรง (coupling A4 → A2 implementation)

แยก shared helpers ที่ทั้ง A2 และ A4 ใช้ร่วมกัน:

```txt
seo-shared.ts
     ↑
     │
 ┌───┴────────┐
 │            │
A2           A4
seo-auto-fill   seo-recommendations
```

```ts
// lib/seo-shared.ts (ตัวอย่าง)
export function buildRecommendedTitle(...): string;
export function buildRecommendedDescription(...): string;
export function extractKeywords(...): string[];
export function truncateMetaDescription(...): string;
```

`seo-auto-fill.ts` และ `seo-recommendations.ts` เรียก helper ชุดเดียวกัน — logic ไม่ duplicate แต่ dependency ไม่ข้าม layer

### 6.3 Input Contract

```ts
export type BuildAssistantStateInput = {
  /** Raw form values จาก editor */
  formState: PreviewSeoFormInput;

  /** ผลจาก A2 preview pipeline — มี scoreInput + previewSeo แล้ว */
  previewPayload: PreviewSeoPayload;

  /** ผลจาก analyzeSeoScore(previewPayload.scoreInput) */
  scoreResult: SeoScoreResult;

  /** จาก Section 7 — server-side DB query; ว่างได้ถ้า internal-links = good */
  internalLinkSuggestions: InternalLinkSuggestion[];

  /** Optional — default 5 */
  topIssuesLimit?: number;
};
```

**Pipeline ที่ caller ต้องทำก่อนเรียก engine:**

```txt
formState
  → buildPreviewSeoPayload(formState)     // A2
  → analyzeSeoScore(scoreInput)           // A1
  → resolveInternalLinkSuggestions(...)   // §7, server only
  → buildAssistantState({ ... })
```

### 6.4 Output Contract — AssistantState

```ts
export const SEO_ASSISTANT_VERSION = "a4-v1" as const;

export type AssistantState = {
  assistantVersion: typeof SEO_ASSISTANT_VERSION;
  catalogVersion: typeof SEO_CHECK_CATALOG_VERSION;

  score: {
    seoScore: number;
    readabilityScore: number;
    band: SeoScoreResult["band"];
    scoreGapMessage: string;
  };

  /** Block 1 — Diagnosis */
  issues: AssistantIssue[];

  /** Block 4 — Prioritization (SEO only) */
  bestImprovements: AssistantImprovement[];

  /** Block 2 — Fix Suggestions */
  fixSuggestions: AssistantFixSuggestion[];

  /** Block 3 — Internal Links */
  internalLinkSuggestions: InternalLinkSuggestion[];

  /** แสดงเมื่อ category/tag เปลี่ยนแต่ยังไม่ save */
  linkSuggestionsStale?: boolean;
};

export type AssistantIssue = {
  checkId: string;
  status: SeoCheckStatus;
  issueLabel: string;
  reason: string;
  issuePriority: number;
};

export type AssistantImprovement = {
  checkId: string;
  actionLabel: string;
  recoverablePoints: number;
  reason: string;
};

export type AssistantFixSuggestion = {
  checkId: string;
  targetField: string;
  reason: string;
  current: string;
  recommended: string;
  recommendationType: "generated" | "field";
};

export type InternalLinkSuggestion = {
  title: string;
  href: string;
  contentType: "post" | "event" | "promotion" | "hub";
  reason: string;
  source: "db" | "hub";
  rankScore?: number; // dev/debug only
  tier?: "A" | "B";   // dev/debug only
};
```

Hub entries ใช้ type เดียวกัน — ดู §7.11, §7.13

### 6.5 buildAssistantState()

```ts
export function buildAssistantState(
  input: BuildAssistantStateInput,
): AssistantState {
  const { scoreResult, internalLinkSuggestions, topIssuesLimit = 5 } = input;

  const issues = buildIssues(scoreResult.checks, topIssuesLimit);
  const bestImprovements = buildBestImprovements(scoreResult.checks);
  const fixSuggestions = buildFixSuggestions(scoreResult.checks, input);

  return {
    assistantVersion: SEO_ASSISTANT_VERSION,
    catalogVersion: SEO_CHECK_CATALOG_VERSION,
    score: {
      seoScore: scoreResult.seoScore,
      readabilityScore: scoreResult.readabilityScore,
      band: scoreResult.band,
      scoreGapMessage: getScoreGapMessage(scoreResult.seoScore),
    },
    issues,
    bestImprovements,
    fixSuggestions,
    internalLinkSuggestions:
      shouldShowLinkSuggestions(scoreResult.checks)
        ? internalLinkSuggestions
        : [],
  };
}
```

### 6.6 Sub-Builders

#### buildIssues(checks, limit)

```ts
function buildIssues(checks: SeoCheck[], limit: number): AssistantIssue[] {
  return checks
    .filter((c) => c.status !== "good")
    .map((c) => ({ check: c, entry: getCatalogEntry(c.id) }))
    .filter(({ entry }) => entry.showInIssues)
    .sort((a, b) => {
      const statusOrder = { bad: 0, ok: 1, good: 2 };
      const statusDiff = statusOrder[a.check.status] - statusOrder[b.check.status];
      if (statusDiff !== 0) return statusDiff;
      return b.entry.issuePriority - a.entry.issuePriority;
    })
    .slice(0, limit)
    .map(({ check, entry }) => ({
      checkId: check.id,
      status: check.status,
      issueLabel: entry.issueLabel,
      reason: entry.reason,
      issuePriority: entry.issuePriority,
    }));
}
```

#### buildBestImprovements(checks)

```ts
function buildBestImprovements(checks: SeoCheck[]): AssistantImprovement[] {
  return checks
    .filter((c) => c.status !== "good")
    .map((c) => ({ check: c, entry: getCatalogEntry(c.id) }))
    .filter(({ entry }) => entry.quickWinEligible)
    .map(({ check, entry }) => ({
      checkId: check.id,
      actionLabel: entry.actionLabel,
      recoverablePoints: recoverableSeoPoints(check),
      reason: entry.reason,
    }))
    .filter((item) => item.recoverablePoints > 0)
    .sort((a, b) => b.recoverablePoints - a.recoverablePoints);
}
```

#### buildFixSuggestions(checks, input)

```ts
function buildFixSuggestions(
  checks: SeoCheck[],
  input: BuildAssistantStateInput,
): AssistantFixSuggestion[] {
  return checks
    .filter((c) => c.status !== "good")
    .map((c) => ({ check: c, entry: getCatalogEntry(c.id) }))
    .filter(({ entry }) => entry.hasFixSuggestion)
    .map(({ check, entry }) => {
      const generated = generateRecommendation(check.id, input);
      return {
        checkId: check.id,
        targetField: entry.targetField!,
        reason: entry.reason,
        current: generated.current,
        recommended: generated.recommended,
        recommendationType:
          entry.recommendationType === "field" ? "field" : "generated",
      };
    });
}
```

#### shouldShowLinkSuggestions(checks)

```ts
function shouldShowLinkSuggestions(checks: SeoCheck[]): boolean {
  const linkCheck = checks.find((c) => c.id === "internal-links");
  return linkCheck != null && linkCheck.status !== "good";
}
```

### 6.7 generateRecommendation() — seo-recommendations.ts

Engine เรียก `generateRecommendation(checkId, input)` สำหรับ checks ที่ `hasFixSuggestion = true`

```ts
export type RecommendationResult = {
  current: string;
  recommended: string;
};

export function generateRecommendation(
  checkId: string,
  input: BuildAssistantStateInput,
): RecommendationResult;
```

**v1 rules (ไม่ใช้ AI):**

| checkId | Strategy |
|---------|----------|
| `desc-length` | ตัด/ขยายจาก `title` + `excerpt` + ประโยคแรกของ content → เป้า 70–165 ตัวอักษร |
| `title-length` | ตัด/ขยายจาก `title` → เป้า 25–65 ตัวอักษร |
| `topic-clarity` | infer จาก title/tags/category ผ่าน `seo-shared.ts` |
| `topic-in-title-desc` | แทรก focus keyword ใน seoTitle หรือ seoDescription |
| `image-alt` | สร้างจาก title + focus keyword (`seo-shared.ts`) |
| `title-exists` | แนะนำใช้ draft title |
| `slug-exists` | แนะนำ slug จาก title (`generateSlug` ใน `lib/seo.ts`) |

`current` มาจาก preview values (รวม auto-fill จาก A2)  
`recommended` มาจาก `seo-shared.ts` + rule engine — **ไม่เรียก** `applyAutoSeoFields()` โดยตรง

### 6.8 React Integration

```ts
// hooks/use-seo-assistant.ts
export function useSeoAssistant(
  formState: PreviewSeoFormInput,
  /** จาก server props — ห้าม fetch ใน hook */
  internalLinkSuggestions: InternalLinkSuggestion[],
  options?: { linkSuggestionsStale?: boolean },
): AssistantState {
  // ... buildPreviewSeoPayload + analyzeSeoScore + buildAssistantState
}
```

**v1 rules สำหรับ internal links:**

```txt
Page Server Component
        ↓
resolveInternalLinkSuggestions()   // §7, ครั้งเดียวตอน load
        ↓
internalLinkSuggestions (props)
        ↓
useSeoAssistant(formState, internalLinkSuggestions)
```

- Debounce ที่ hook level (~300ms) — เฉพาะ score/suggestions ที่คำนวณจาก form
- **ห้าม** `useSeoAssistant` → `fetch()` หรือ query DB
- เมื่อ user เปลี่ยน category/tag **ไม่ live-update** links
- แสดงข้อความใน Block 3: *"บันทึกแบบร่างเพื่ออัปเดตคำแนะนำลิงก์"* หรือ *"Suggestions refresh after save"*

**เหตุผล:** A4 คือ SEO guidance ไม่ใช่ real-time recommendation engine

### 6.9 Error Handling

| สถานการณ์ | พฤติกรรม |
|-----------|----------|
| checkId ไม่มีใน catalog — **dev/test** | `throw new Error(\`[SEO-A4] Unknown checkId: ${checkId}\`)` |
| checkId ไม่มีใน catalog — **production** | `console.error` หรือ `logger.error(\`[SEO-A4] Unknown checkId: ${checkId}\`)` แล้ว **skip entry** (ไม่เงียบ) |
| `generateRecommendation` ไม่รู้ checkId | throw — catalog/engine mismatch |
| `internalLinkSuggestions` ว่าง + links bad | Block 3 empty state: "ไม่พบเนื้อหาที่แนะนำ" |
| ทุก check `good` | `issues = []`, `bestImprovements = []`, positive score message |

```ts
function getCatalogEntryOrSkip(checkId: string): SeoCheckCatalogEntry | null {
  try {
    return getCatalogEntry(checkId);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") throw error;
    console.error(`[SEO-A4] Unknown checkId: ${checkId}`);
    return null;
  }
}
```

### 6.10 Deterministic Output Requirement

**MUST:** `buildAssistantState()` ต้อง deterministic — ห้ามใช้ random, `Date.now()` ใน output, หรือ external I/O

Given **identical** inputs:

- `formState`
- `previewPayload`
- `scoreResult`
- `internalLinkSuggestions`

`buildAssistantState()` **MUST** return identical `AssistantState` (ยกเว้น fields ที่ spec อนุญาตให้เปลี่ยนในอนาคต)

**เหตุผล:**

- Snapshot tests ได้
- Unit tests stable
- Parity กับ A1/A2 ตรวจสอบได้จริง

**ห้ามใน engine layer:**

- `Math.random()`
- `new Date()` ใน output fields
- Async DB/API calls

### 6.11 Tests (Section 10 preview)

- `buildAssistantState` returns stable shape for golden fixture (snapshot test)
- Identical inputs → identical output (determinism test)
- `assistantVersion` และ `catalogVersion` present in output
- `issues` sorted bad → ok, then issuePriority DESC
- `bestImprovements` excludes readability, includes `topic-in-content`
- `fixSuggestions` only for `hasFixSuggestion` checks
- `internalLinkSuggestions` hidden when `internal-links` is good
- `scoreGapMessage(78)` independent of A1 `band`
- Unknown checkId throws in test env, logs + skips in production mock

**Section 6 Status: ✅ Locked (Principal Review approved)**

---

## 7. Internal Link Suggestions

### 7.1 Purpose & Trust Requirement

Internal Link Suggestions เป็น **ส่วนที่มีความเสี่ยงทาง Product สูงสุด** ของ A4

ถ้าแนะนำลิงก์มั่ว ผู้ใช้จะเลิกเชื่อระบบทันที

**หลักการ:**

1. **แนะนำเฉพาะเนื้อหาจริงใน DB** — ไม่ใช่ static catalog แบบ "ร้านอาหารทั้งหมด"
2. **กรองคุณภาพก่อนแนะนำ** — published, ไม่ deleted, SEO score ผ่านเกณฑ์
3. **จับคู่ตาม context** — category, tags, content type ก่อน fallback
4. **Ranking โปร่งใส** — rule-based score ไม่ใช่ AI
5. **Deterministic** — query + rank เดิม → ผลลัพธ์เดิม

### 7.2 Location & Server Integration

```
lib/seo-internal-links.ts   — resolveInternalLinkSuggestions() (server only)
```

เรียกจาก **page server component** เท่านั้น:

```ts
// app/admin/posts/[id]/edit/page.tsx
const internalLinkSuggestions = await resolveInternalLinkSuggestions({
  contentType: "post",
  contentId: post.id,
  categoryId: post.categoryId,
  tagIds: post.tags.map((t) => t.tagId),
  branchIds: post.branches.map((b) => b.branchId),
});

<PostEditorForm
  internalLinkSuggestions={internalLinkSuggestions}
  ...
/>
```

**ห้าม:**

- เรียกจาก client component
- สร้าง API route ใหม่ใน v1
- เรียกจาก `useSeoAssistant` hook

### 7.3 Input Context

```ts
export type InternalLinkQueryContext = {
  contentType: "post" | "event" | "promotion";
  contentId: string;

  /** Post */
  categoryId?: string | null;
  postKind?: PostKind;

  /** Promotion */
  promotionCategory?: PromotionCategory;

  /** Shared */
  tagIds?: string[];
  branchIds?: string[];

  /** Optional — default SUGGESTION_TARGET (5), capped by SUGGESTION_MAX (8) */
  limit?: number;
};

/** Output sizing — locked constants */
export const SUGGESTION_TARGET = 5;
export const SUGGESTION_MIN = 3;
export const SUGGESTION_MAX = 8;
```

Context มาจาก **saved DB state ตอน page load** — ไม่ใช่ unsaved form values

### 7.4 When to Query

| สถานการณ์ | พฤติกรรม |
|-----------|----------|
| `internal-links` check = `good` | ไม่ query (engine ซ่อน Block 3) |
| `internal-links` check ≠ `good` | query ตอน page load |
| User เปลี่ยน category/tag ใน form | **ไม่ re-query** — แสดง stale notice |
| User save draft/publish | reload page → query ใหม่ |

**Stale notice (Block 3 footer):**

```txt
บันทึกแบบร่างเพื่ออัปเดตคำแนะนำลิงก์
(Suggestions refresh after save)
```

### 7.5 Hard Filters (Candidate Pool)

ทุก candidate ต้องผ่าน **baseline filters** ก่อนเข้า ranking:

| Filter | Rule |
|--------|------|
| Status | `status = PUBLISHED` |
| Soft delete | `deletedAt IS NULL` |
| Self exclusion | `id !== contentId` |
| noindex | `seo.noindex = false` (ถ้ามี seo record) |
| Promotion active | `startDate <= now AND endDate >= now` (promotion only) |

หลัง baseline แบ่งเป็น **2 quality tiers** — ไม่ exclude "no audit" ทิ้งทั้งหมด

#### Tier A — Audited (คะแนนเต็มใน ranking)

| Rule | Value |
|------|-------|
| มี latest `SeoAudit` | ใช่ |
| `SeoAudit.score` | `>= 70` |
| `auditBonus` ใน rankScore | **+20** |

#### Tier B — Unaudited (อนุญาตช่วง rollout)

| Rule | Value |
|------|-------|
| ไม่มี `SeoAudit` | ใช่ |
| `auditBonus` ใน rankScore | **0** |

**ห้ามแนะนำ:** มี audit แต่ `score < 70` (คุณภาพต่ำเกินไป)

**เหตุผล:** ช่วงแรกที่ audit coverage ต่ำ (เช่น 40/500 posts) Block 3 ยังใช้งานได้ — เมื่อ A1 coverage สูงขึ้น Tier A จะ dominate เอง

**Latest audit lookup:**

```ts
seoAudits: {
  orderBy: { analyzedAt: "desc" },
  take: 1,
  select: { score: true },
}
```

### 7.6 Query Strategy by Content Type

Pools ดึงทั้ง Tier A และ Tier B — **ไม่ filter audit ใน SQL** (filter tier ใน ranking)

#### Post (`contentType: "post"`)

**Pool 1 — same category** (ถ้ามี `categoryId`):

```sql
WHERE status = PUBLISHED AND deletedAt IS NULL AND id != :contentId
  AND categoryId = :categoryId
ORDER BY publishedAt DESC
LIMIT 30
```

**Pool 2 — shared tags** (ถ้ามี `tagIds`):

```sql
JOIN post_tags ... WHERE tagId IN (:tagIds) AND id != :contentId
ORDER BY publishedAt DESC
LIMIT 30
```

**Pool 3 — recent published** (ถ้า pool 1+2 รวม < SUGGESTION_TARGET):

```sql
WHERE status = PUBLISHED AND publishedAt >= now() - 90 days
ORDER BY publishedAt DESC
LIMIT 30
```

#### Event (`contentType: "event"`)

**Pool 1 — shared tags** + relevant dates (`eventDate >= now() - 30d` OR `eventEndDate >= now()`)

**Pool 2 — same branch** (`branchIds` overlap)

**Pool 3 — upcoming** (`showOnHome = true`, `eventDate >= now()`)

#### Promotion (`contentType: "promotion"`)

**Pool 1 — same `PromotionCategory`** + active date window

**Pool 2 — shared tags** + active date window

**Pool 3 — active promotions** (`publishedAt` within 90 days)

### 7.7 Cross-Type — CONTENT_TYPE_COMPATIBILITY

ใช้ **penalty matrix** แทน `crossType = -30` ค่าเดียว

เมื่อ `candidate.contentType !== ctx.contentType` นำ penalty มาหักใน `rankScore`:

```ts
export const CONTENT_TYPE_COMPATIBILITY: Record<
  "post" | "event" | "promotion",
  Record<"post" | "event" | "promotion", number>
> = {
  post: {
    post: 0,
    event: -10,
    promotion: -20,
  },
  event: {
    post: -10,
    event: 0,
    promotion: -20,
  },
  promotion: {
    post: -10,
    event: -40,   // discouraged — มักไม่เกี่ยวข้อง
    promotion: 0,
  },
};
```

| From → To | post | event | promotion |
|-----------|------|-------|-----------|
| **post** | 0 | −10 | −20 |
| **event** | −10 | 0 | −20 |
| **promotion** | −10 | −40 | 0 |

**Allowed patterns (penalty ต่ำ):** Post↔Post/Event/Promotion, Event↔Event/Post, Promotion↔Promotion/Post

**Discouraged:** Promotion→Event (−40)

Cross-type pools เปิดเมื่อ same-type candidates < `SUGGESTION_MIN` หลัง ranking

### 7.8 Ranking Rules

หลังรวม candidates จาก pools แล้ว dedupe by `(contentType, id)`:

```ts
function computeRankScore(candidate, ctx): number {
  const tier = candidate.latestAuditScore != null ? "A" : "B";
  if (tier === "A" && candidate.latestAuditScore! < 70) return -Infinity; // exclude

  const compatibilityPenalty =
    CONTENT_TYPE_COMPATIBILITY[ctx.contentType][candidate.contentType];

  return (
    (sameCategoryOrPromotionCategory ? 40 : 0) +
    Math.min(sharedTagCount * 15, 45) +
    (sameBranch ? 10 : 0) +
    (tier === "A" ? 20 : 0) +                    // auditBonus — Tier A only
    (tier === "A" && candidate.latestAuditScore! >= 80 ? 10 : 0) + // high-quality audited
    (publishedWithin90Days ? 10 : 0) +
    compatibilityPenalty
  );
}
```

เรียง `rankScore DESC` → `publishedAt DESC` → `id ASC` (deterministic)

**เลือก top `SUGGESTION_TARGET` (5)** จาก DB candidates, ไม่เกิน `SUGGESTION_MAX` (8)

### 7.9 Output Sizing

| Constant | Value | ความหมาย |
|----------|-------|----------|
| `SUGGESTION_TARGET` | 5 | เป้าหมายจำนวน DB suggestions |
| `SUGGESTION_MIN` | 3 | พยายามให้มีอย่างน้อย 3 รายการรวม (ก่อน hub) |
| `SUGGESTION_MAX` | 8 | สูงสุดทั้งหมด (DB + hub) |

- ถ้ามี candidates มาก → แสดง **5** (ไม่ใส่ 40 รายการ — user ไม่อ่าน)
- ถ้ามีน้อยกว่า 3 → เปิด cross-type pools + hub safety net (§7.10)
- รวม hub แล้วไม่เกิน **8**

### 7.10 Hub Safety Net (ไม่ใช่ Ranking Tier)

Hub pages เป็น **Safety Net** — ไม่แข่ง rank กับ DB candidates

**กฎ:**

```ts
if (dbSuggestions.length < SUGGESTION_MIN) {
  injectHubPages(max: 2);
}
```

**ห้าม:** เอา hub เข้า `rankScore` หรือ pool query

**UI layout ตัวอย่าง:**

```txt
Suggested Internal Links

1. ข่าวเปิดสาขาใหม่ลาดพร้าว
   Same category · SEO Score 88

2. โปรโมชั่นบุฟเฟต์
   Shares 2 tags · SEO Score 82

3. Event Summer Sale
   Recent high-performing content

────────────────────────────
Explore all news          →  /news
```

| Current contentType | Hub href | Hub title | Hub reason |
|--------------------|----------|-----------|------------|
| `post` | `/news` | ดูข่าวสารทั้งหมด | Explore all news |
| `event` | `/events` | ดูกิจกรรมทั้งหมด | Explore all events |
| `promotion` | `/promotions` | ดูโปรโมชั่นทั้งหมด | Explore all promotions |

Hub entries: `source: "hub"`, `contentType: "hub"` — แสดงแยกใต้เส้นคั่นใน Block 3 (§8)

### 7.11 Explainability — `reason` Field

ทุก suggestion **ต้องมี** `reason: string` (US-10 trust)

**DB suggestions** — สร้างจาก ranking signals:

| Signal | reason fragment |
|--------|-----------------|
| Same category | `Same category` |
| Shared tags | `Shares {n} tags` |
| Same branch | `Popular in this branch` |
| Tier A + score | `SEO Score {score}` |
| Tier B (no audit) | `Recently published` |
| Recency | `Published {n} days ago` |

**รวมเป็น string:** `"Same category · SEO Score 88"`

**Hub suggestions:**

```txt
reason: "Explore all news"
```

**UI ตัวอย่าง (§8):**

```txt
เปิดสาขาใหม่ลาดพร้าว
Same category · SEO Score 88
[Copy link]
```

### 7.12 Public URL Mapping

| contentType | href pattern |
|-------------|--------------|
| `post` | `/news/{slug}` |
| `event` | `/events/{slug}` |
| `promotion` | `/promotions/{slug}` |

ใช้ relative path — ไม่ hardcode domain

### 7.13 Output Shape

```ts
export type InternalLinkSuggestion = {
  title: string;
  href: string;
  contentType: "post" | "event" | "promotion" | "hub";
  reason: string;              // required — §7.11
  source: "db" | "hub";
  rankScore?: number;          // dev/debug only — ไม่แสดงใน UI v1
  tier?: "A" | "B";            // dev/debug only
};
```

### 7.14 resolveInternalLinkSuggestions()

```ts
export async function resolveInternalLinkSuggestions(
  ctx: InternalLinkQueryContext,
): Promise<InternalLinkSuggestion[]> {
  const target = ctx.limit ?? SUGGESTION_TARGET;

  const pools = await fetchCandidatePools(ctx);        // §7.6
  const filtered = applyBaselineFilters(pools, ctx); // §7.5
  const ranked = rankCandidates(filtered, ctx);      // §7.7–7.8
  const dbTop = ranked.slice(0, Math.min(target, SUGGESTION_MAX));

  const result = dbTop.map(toSuggestionWithReason);    // §7.11

  if (result.length < SUGGESTION_MIN) {
    const hubs = buildHubSafetyNet(ctx, max: 2);     // §7.10 — not ranked
    return [...result, ...hubs].slice(0, SUGGESTION_MAX);
  }

  return result;
}
```

- **Deterministic:** ไม่ random — `rankScore DESC`, `publishedAt DESC`, `id ASC`
- **Performance target:** < 200ms (≤ 3 parallel pool queries)

### 7.15 Non-Goals (§7)

- ไม่สแกน body HTML หา existing links (v1)
- ไม่แนะนำ external URLs
- ไม่แนะนำ draft/archived content
- ไม่ใช้ AI reranking
- ไม่ live-update เมื่อ form เปลี่ยน
- ไม่เอา hub pages เข้า ranking pool

### 7.16 Tests (Section 10 preview)

- Excludes self, draft, deleted, noindex content
- Tier A: audit score >= 70 ranks above Tier B (no audit) when signals equal
- Tier B (no audit) included when pool is thin
- Excludes audited content with score < 70
- `CONTENT_TYPE_COMPATIBILITY`: promotion→event penalized more than promotion→post
- Same-category post ranks above cross-type
- Returns target 5 when pool allows; never more than `SUGGESTION_MAX` (8)
- Hub injected only when db count < `SUGGESTION_MIN`; max 2 hubs; `source: "hub"`
- Hub entries not in ranked pool
- Every suggestion has non-empty `reason`
- Promotion respects active date window
- Deterministic snapshot for golden `InternalLinkQueryContext`

**Section 7 Status: ✅ Locked (Principal Review approved)**

---

## 8. UI Layout

### 8.1 UX Principle — Editor Assistant, Not Dashboard

| | Editor Assistant (A4) | Analytics Dashboard (A6) |
|---|----------------------|--------------------------|
| คำถามหลัก | ฉันควรแก้อะไรต่อ? | สุขภาพ SEO ทั้งเว็บเป็นอย่างไร? |
| ผู้ใช้ | คนกรอกเนื้อหา | ผู้จัดการ / SEO lead |
| ข้อมูล | รายชิ้น + actionable | aggregate + trends |
| ลำดับ UI | Impact → Action → Debug | Metrics → Drill-down |

**กฎ UX หลัก:**

1. **Impact ก่อน Root Cause** — Quick Wins อยู่ก่อน Diagnostics
2. **Action ก่อน Analysis** — ปุ่ม Copy ชัดเจน ไม่ต้องอ่าน checklist ยาว
3. **Diagnostics ซ่อน default** — power users เปิดเองได้
4. **Mobile-first** — editor หลายคนใช้มือถือ

### 8.2 Placement

แทนที่ `SeoScorePanel` ในแท็บ **SEO** ของ editor ทั้ง 3 ประเภท

```txt
Editor Tabs: Content | Media | SEO | ...
                              ↓
                    ┌─────────────────────┐
                    │ SEO fields (form)   │  ← คอลัมน์ซ้าย / ด้านบน mobile
                    ├─────────────────────┤
                    │ Optimization        │  ← คอลัมน์ขวา / ด้านล่าง mobile
                    │ Assistant           │
                    └─────────────────────┘
```

**ไม่สร้าง** route หรือหน้าใหม่ — อยู่ใน editor เดิม

### 8.3 AssistantState → UI Mapping

UI **consume `AssistantState` เท่านั้น** — ไม่คำนวณ SEO ใน component

| UI Block | `AssistantState` field | หมายเหตุ |
|----------|------------------------|----------|
| Score Summary | `score` + `issues[0..2]` | top blockers จาก issues สูงสุด 3 |
| Quick Wins | `bestImprovements` | max 5 |
| Fix Suggestions | `fixSuggestions` | `hasFixSuggestion` checks |
| Internal Links | `internalLinkSuggestions` | แยก db / hub ใน UI |
| Diagnostics | `issues` + full `checks`* | collapsed default |

\* full checks จาก `scoreResult.checks` ส่งผ่าน hook หรือแนบใน state extension — ดู §8.15

### 8.4 Block Order (Vertical — Mobile & Base)

ลำดับบน mobile และลำดับอ่านบน desktop:

```txt
1. SEO Score Summary
2. Quick Wins
3. Fix Suggestions
4. Internal Links
5. Diagnostics
```

**เหตุผล:** ผู้ใช้ต้องการ `+12 คะแนน` มากกว่า `Missing keyword` — Impact ก่อน Root Cause

---

### 8.5 Block 1 — SEO Score Summary

**Purpose:** ภาพรวมสั้น + gap motivation + blockers สำคัญ (ไม่ใช่รายงานเต็ม)

**แสดง:**

```txt
┌─────────────────────────────────────┐
│ SEO Score                           │
│                                     │
│ 72 / 100                            │
│ ████████████████░░░░  72%           │
│                                     │
│ อีก 8 คะแนนจะถึง Good              │
│                                     │
│ Top blockers                        │
│ • Missing meta description          │
│ • Missing image alt                 │
│ • Weak internal links               │
└─────────────────────────────────────┘
```

| Element | Source | Rule |
|---------|--------|------|
| Score | `score.seoScore` | ตัวเลขใหญ่ `72 / 100` |
| Progress bar | `score.seoScore` | ไม่ใช้ readability ใน bar หลัก |
| Gap message | `score.scoreGapMessage` | A4 progress bands (§5.6 / G2) |
| Top blockers | `issues[].issueLabel` | **สูงสุด 3** รายการแรก |
| Readability | `score.readabilityScore` | แสดงเป็นบรรทัดรองเล็ก ๆ (optional) |

**ไม่แสดง:** checklist เต็ม, component breakdown, trend

---

### 8.6 Block 2 — Quick Wins

**Purpose:** Impact list — ทำอะไรแล้วได้คะแนนกลับมาเท่าไร

```txt
┌─────────────────────────────────────┐
│ Quick Wins                          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ +12 คะแนน                       │ │
│ │ เพิ่ม Meta Description          │ │
│ │ [Copy Suggestion]               │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ +8 คะแนน                        │ │
│ │ เพิ่ม Internal Link             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

| Rule | Value |
|------|-------|
| Source | `bestImprovements[]` |
| Sort | `recoverablePoints` DESC (engine จัดให้แล้ว) |
| Max items | **5** |
| Sort | **MUST preserve order from `buildAssistantState()`** — ห้าม re-sort ใน component |
| ซ่อนเมื่อ | Excellent empty state (§8.11) |

**[Copy Suggestion] behavior:**

- ถ้ามี `fixSuggestions` ที่ `checkId` ตรงกัน → copy `recommended` ไป clipboard
- ถ้าไม่มี (เช่น `content` / `links` type) → ปุ่มไม่แสดง หรือเปลี่ยนเป็น **"View details"** scroll ไป Fix Suggestions / Internal Links

**Feedback หลัง copy:** ดู §8.18 U1 — ทุก card ที่มีปุ่ม Copy

---

### 8.7 Block 3 — Fix Suggestions

**Purpose:** รายละเอียดข้อความ — Current → Recommended

```txt
┌─────────────────────────────────────┐
│ Fix Suggestions                     │
│                                     │
│ Meta Description                    │
│ Search engines ใช้ meta description… │
│                                     │
│ Current                             │
│ ร้านอาหารญี่ปุ่น                    │
│                                     │
│ Recommended                         │
│ ร้านอาหารญี่ปุ่นในกรุงเทพ พร้อม…    │
│                                     │
│ [Copy]                              │
└─────────────────────────────────────┘
```

| Rule | Value |
|------|-------|
| Source | `fixSuggestions[]` |
| แต่ละ card | `targetField` label + `reason` + current/recommended |
| ปุ่ม | `[Copy]` — US-11 |
| ซ่อนเมื่อ | `fixSuggestions.length === 0` หรือ Excellent state |

**ไม่ auto-fill** form — user paste เอง

---

### 8.8 Block 4 — Internal Links

**Purpose:** ลิงก์ภายในที่น่าเชื่อถือ พร้อม explainability

```txt
┌─────────────────────────────────────┐
│ Internal Links                      │
│                                     │
│ เปิดสาขาใหม่ลาดพร้าว               │
│ Same category · SEO Score 88        │
│ [Copy URL]                          │
│                                     │
│ โปรโมชั่นบุฟเฟต์                   │
│ Shares 2 tags · SEO Score 82        │
│ [Copy URL]                          │
│                                     │
│ ─────────────────────────────────── │
│ ดูข่าวสารทั้งหมด                   │
│ Explore all news                    │
│ [Copy URL]                          │
│                                     │
│ บันทึกแบบร่างเพื่ออัปเดตคำแนะนำลิงก์ │
└─────────────────────────────────────┘
```

| Rule | Value |
|------|-------|
| DB items | `source === "db"` — แสดง `title` + `reason` |
| Hub items | `source === "hub"` — แยกใต้ `<hr>` หรือ divider |
| v1 action | **`[Copy URL]`** — copy `href` to clipboard |
| v1.1 (A4.1) | **`[Insert Link]`** — แทรกใน rich text editor |
| Stale notice | แสดงเมื่อ `linkSuggestionsStale === true` (§6.8) |
| ซ่อน Block | เมื่อ `internal-links` check = `good` (engine ส่ง array ว่าง) |

**Empty state (0 DB + 0 hub suggestions):**

```txt
No related content found yet.

Publish more content or save this draft to improve suggestions.
```

(ภาษาไทย: *ยังไม่พบเนื้อหาที่เกี่ยวข้อง — เผยแพร่เนื้อหาเพิ่มหรือบันทึกแบบร่างเพื่อปรับปรุงคำแนะนำ*)

**ห้าม** แสดง card ว่างเปล่าโดยไม่มีข้อความ (§8.18 U3)

---

### 8.9 Block 5 — Diagnostics

**Purpose:** Root cause / debug — **ไม่ใช่ workflow หลัก**

```txt
┌─────────────────────────────────────┐
│ ▶ Show Diagnostics (8 issues)       │  ← collapsed default
└─────────────────────────────────────┘

เปิดแล้ว:

┌─────────────────────────────────────┐
│ ▼ Show Diagnostics (8 issues)       │
│                                     │
│ ❌ ความยาว meta description         │
│ ❌ ลิงก์ภายใน                       │
│ ⚠️ รูปปก + alt text                 │
│ ✅ มีชื่อบทความ                     │
│ ...                                 │
└─────────────────────────────────────┘
```

| Rule | Value |
|------|-------|
| Source | `issues[]` + checks ที่ `good` จาก `scoreResult.checks` |
| Default | **Collapsed** |
| Label | `Show Diagnostics ({n} issues)` — n = count ที่ status ≠ good |
| Sort | `bad` → `ok` → `good`; ภายใน bad/ok ใช้ `issuePriority` |
| Status icons | ❌ bad · ⚠️ ok · ✅ good |
| แสดง tip | แสดง `check.tip` ใต้ label เมื่อ expand แต่ละรายการ (optional v1) |
| Scroll | `max-height: 400px; overflow-y: auto` เมื่อ expanded (§8.18 U2) |

Editor ส่วนใหญ่ไม่อ่านส่วนนี้ — เก็บไว้สำหรับ power users และ support

---

### 8.10 Responsive Layout

#### Mobile — `< 1024px`

**Stack เต็มความกว้าง** ตาม block order §8.4:

```txt
┌──────────────────────┐
│ Score Summary        │
├──────────────────────┤
│ Quick Wins           │
├──────────────────────┤
│ Fix Suggestions      │
├──────────────────────┤
│ Internal Links       │
├──────────────────────┤
│ Diagnostics          │
└──────────────────────┘
```

- ไม่ horizontal scroll
- ปุ่ม Copy เต็มความกว้าง (touch target ≥ 44px)
- Card padding เพิ่มบน mobile

#### Desktop — `≥ 1024px`

**2 columns** ใน Assistant panel:

```txt
┌────────────────────┬────────────────────┐
│ Score Summary    │ Quick Wins         │
├────────────────────┼────────────────────┤
│ Fix Suggestions  │ Internal Links     │
├────────────────────┴────────────────────┤
│ Diagnostics (full width)                │
└───────────────────────────────────────────┘
```

SEO form fields อยู่คอลัมน์ซ้ายของหน้า (layout เดิม `md:grid-cols-2` ใน editor) — Assistant อยู่คอลัมน์ขวา

```txt
┌─────────────────────────┬─────────────────────────┐
│ SEO form fields         │ Optimization Assistant  │
│ (title, desc, og, …)    │ (§8.10 grid)            │
└─────────────────────────┴─────────────────────────┘
```

---

### 8.11 Excellent State (Empty — Success)

เมื่อ **ทั้งสอง** เป็นจริง:

```ts
score.seoScore >= 90 && issues.length === 0
```

**แสดง:**

```txt
┌─────────────────────────────────────┐
│ ✓ Excellent SEO                     │
│                                     │
│ ไม่มีคำแนะนำเพิ่มเติมในตอนนี้        │
└─────────────────────────────────────┘
```

| Block | Visibility |
|-------|------------|
| Score Summary | ✅ แสดง (คะแนน + gap "คุณผ่านเกณฑ์สูงสุดแล้ว") |
| Quick Wins | ❌ ซ่อน |
| Fix Suggestions | ❌ ซ่อน |
| Internal Links | ✅ แสดง (ถ้ามายังไม่มี internal link ใน content — อาจมี suggestions) |
| Diagnostics | ✅ collapsed — `Show Diagnostics (0 issues)` หรือซ่อนทั้ง block |

**หมายเหตุ:** ถ้า `seoScore >= 90` แต่ยังมี `issues` (เช่น readability) → **ไม่เข้า** Excellent state — แสดง workflow ปกติ

---

### 8.12 Loading State

ตอนเปิดแท็บ SEO ครั้งแรก หรือ debounce ระหว่างพิมพ์:

```txt
┌─────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░  skeleton       │
│ ░░░░░░░░░░                          │
├─────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░                 │
│ ░░░░░░░░░░░░░░░░░░░                 │
└─────────────────────────────────────┘
```

| Rule | Value |
|------|-------|
| Initial load | Skeleton ทั้ง 5 blocks (หรือ 2×2 grid บน desktop) |
| Debounce update | **ไม่** skeleton ทั้ง panel — อัปเดตตัวเลข in-place |
| `internalLinkSuggestions` | โหลดพร้อม page — ไม่มี loading แยกใน v1 |
| Duration | skeleton จนกว่า `useSeoAssistant` คืน state ครั้งแรก |

---

### 8.13 Error State

เมื่อ `buildAssistantState` throw (dev) หรือ unexpected error:

```txt
┌─────────────────────────────────────┐
│ ไม่สามารถโหลด SEO Assistant ได้      │
│ ลองบันทึกและเปิดหน้าใหม่              │
└─────────────────────────────────────┘
```

- ไม่ block การแก้ form / save
- SEO fields ยังใช้งานได้ปกติ
- log error ฝั่ง client (`[SEO-A4]`)

---

### 8.14 Component Hierarchy

```
features/content/seo-optimization/
  seo-optimization-assistant.tsx    # root — รับ AssistantState
  seo-score-summary-card.tsx        # Block 1
  seo-quick-wins-card.tsx           # Block 2
  seo-fix-suggestions-card.tsx      # Block 3
  seo-internal-links-card.tsx       # Block 4
  seo-diagnostics-panel.tsx         # Block 5 (collapsible)

hooks/
  use-seo-assistant.ts              # formState + props → AssistantState

lib/
  seo-assistant.ts                  # buildAssistantState (§6)
  seo-check-catalog.ts              # §5
  seo-recommendations.ts            # §6
  seo-internal-links.ts             # §7 (server)
  seo-shared.ts                     # shared helpers
```

**Data flow:**

```txt
Edit Page (server)
  → resolveInternalLinkSuggestions()
  → props: internalLinkSuggestions

PostEditorForm (client)
  → useSeoAssistant(formState, internalLinkSuggestions)
  → <SeoOptimizationAssistant state={assistantState} />

SeoOptimizationAssistant
  → แต่ละ card รับ slice ของ state — ไม่เรียก analyzeSeoScore เอง
```

**แทนที่ใน editor forms:**

| File | Change |
|------|--------|
| `post-editor-form.tsx` | `SeoScorePanel` → `SeoOptimizationAssistant` |
| `event-editor-form.tsx` | เหมือนกัน |
| `promotion-editor-form.tsx` | เหมือนกัน |

`SeoScoreBadge` บนแท็บ SEO **คงไว้** — แสดงคะแนนก่อนเปิดแท็บ

### 8.15 Diagnostics Data

Diagnostics แสดง checks ทั้งหมด (รวม `good`) — ต้องการ `SeoCheck[]` เต็ม

**v1 approach:** `useSeoAssistant` return:

```ts
type SeoAssistantHookResult = {
  state: AssistantState;
  checks: SeoCheck[];  // จาก scoreResult.checks — สำหรับ Diagnostics เท่านั้น
};
```

ห้าม Diagnostics เรียก `analyzeSeoScore` ซ้ำ

### 8.16 Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Progress bar | `role="progressbar"` + `aria-valuenow={seoScore}` |
| Collapsible Diagnostics | `<button aria-expanded>` + `aria-controls` |
| Copy buttons | `aria-label="Copy meta description suggestion"` |
| Status icons | ต้องมีข้อความประกอบ — ไม่พึ่งสี/ไอคอนอย่างเดียว |
| Section headings | `<h3>` ต่อ block — logical heading order |

### 8.18 UI Implementation Details (Locked)

#### U1 — Copy Feedback (ทุก card)

พฤติกรรมเดียวกันทุกปุ่ม Copy / Copy Suggestion / Copy URL:

```txt
[Copy]  →  click  →  [Copied!]  →  2 วินาที  →  [Copy]
```

| Step | Behavior |
|------|----------|
| Default | ปุ่มแสดง `Copy`, `Copy Suggestion`, หรือ `Copy URL` |
| On click | `navigator.clipboard.writeText(...)` |
| Success | ปุ่มเปลี่ยนเป็น `Copied!` (disabled ชั่วคราว) |
| After 2s | กลับเป็นข้อความเดิม |

ใช้ component ร่วม เช่น `CopyButton` — ห้าม implement แยกต่อ card

#### U2 — Diagnostics Max Height

เมื่อ Diagnostics **expanded**:

```css
max-height: 400px;
overflow-y: auto;
```

ป้องกัน checklist 17+ รายการดันหน้าจอ mobile

#### U3 — Empty Internal Links

เมื่อ `internalLinkSuggestions.length === 0` และ `internal-links` check ≠ `good`:

แสดงข้อความใน Block 4 (§8.8) — **ห้าม** empty card

#### U4 — Quick Win Order Lock

```ts
// ✅ ถูก — render ตามลำดับ engine
state.bestImprovements.map(...)

// ❌ ผิด — ห้าม re-sort ใน UI
state.bestImprovements.sort(...)
```

Engine เรียง `recoverablePoints DESC` แล้ว (§6) — UI **MUST preserve order** จาก `buildAssistantState()`

### 8.19 Section 8 Acceptance (preview → §10)

- Block order: Summary → Quick Wins → Fix → Links → Diagnostics
- Quick Wins max 5, order preserved from engine (U4)
- Top blockers max 3 ใน Summary
- Diagnostics collapsed by default, max-height 400px when open (U2)
- Excellent state ซ่อน Quick Wins + Fix Suggestions
- Mobile stack `< 1024px`; desktop 2-column grid
- Copy feedback cycle 2s on all copy buttons (U1)
- Internal links empty message (U3)
- Every link suggestion shows `reason`
- Hub links visually separated
- No SEO calculation inside UI components
- `SeoScorePanel` replaced in all 3 editors

**Section 8 Status: ✅ Locked (Principal Final Review approved)**

---

## 9. API & Integration Contracts

### 9.1 Summary — No New API (v1)

SEO-A4 v1 **ไม่เพิ่ม HTTP API endpoint ใหม่**

ไม่มี:

- `POST /api/seo/...`
- `GET /api/admin/seo/assistant`
- WebSocket / SSE สำหรับ real-time suggestions

ทั้งหมดทำงานใน **editor page boundary** ที่มีอยู่แล้ว

### 9.2 Integration Points

| Layer | Mechanism | ใหม่? |
|-------|-----------|-------|
| Scoring | `analyzeSeoScore()` (A1) | ไม่ |
| Preview | `buildPreviewSeoPayload()` (A2) | ไม่ |
| Assistant state | `buildAssistantState()` (client) | ใช่ — lib only |
| Internal links | `resolveInternalLinkSuggestions()` (server) | ใช่ — lib only |
| Persistence | Existing `POST /api/posts`, `/events`, `/promotions` | ไม่ |
| SEO audit on save | `persistSeoAudit()` (A1) | ไม่ |

### 9.3 Server Page Contract

Edit pages เพิ่ม **server-side call เดียว** ก่อน render:

```ts
// app/admin/posts/[id]/edit/page.tsx (pattern เดียวกันทั้ง 3 types)

const internalLinkSuggestions = await resolveInternalLinkSuggestions({
  contentType: "post",
  contentId: post.id,
  categoryId: post.categoryId,
  tagIds: post.tags.map((t) => t.tagId),
  branchIds: post.branches.map((b) => b.branchId),
});

<PostEditorForm
  internalLinkSuggestions={internalLinkSuggestions}
  ...
/>
```

**ไม่เปลี่ยน** API route handlers — ไม่เปลี่ยน request/response body ของ save endpoints

### 9.4 Client Props Contract

```ts
// เพิ่มใน editor form props (ทั้ง 3 forms)
type EditorFormProps = {
  // ... existing props
  internalLinkSuggestions: InternalLinkSuggestion[];
};
```

`InternalLinkSuggestion` shape ตาม §7.13 — serialize จาก server → client ได้โดยตรง (plain JSON)

### 9.5 Database Access

| Operation | Where | New schema? |
|-----------|-------|-------------|
| Read published content for links | `resolveInternalLinkSuggestions` | ไม่ |
| Read latest SeoAudit | same | ไม่ |
| Write content + audit | existing save API | ไม่ |

**ห้าม** เพิ่ม Prisma model, migration, หรือ rollup table ใน A4 v1

### 9.6 External Services

| Service | A4 v1 |
|---------|-------|
| OpenAI / LLM | ไม่ใช้ |
| Redis / cache | ไม่ใช้ |
| New env vars | ไม่ต้องการ |

### 9.7 Future API (Out of Scope)

อาจพิจารณาใน **A4.1+** หากต้องการ:

- `GET /api/admin/seo/internal-links?postId=...` — refresh links หลังเปลี่ยน category โดยไม่ reload page
- Server Action สำหรับ stale link refresh

**ไม่อยู่ใน v1 scope** — v1 ใช้ page reload หลัง save

### 9.8 RBAC

ใช้สิทธิ์เดิมของ editor — ไม่เพิ่ม module ใหม่

| Content | Module | Roles |
|---------|--------|-------|
| Post | `news` | `CONTENT_EDITOR_ROLES` |
| Event | `events` | `MARKETING_CONTENT_ROLES` |
| Promotion | `promotions` | `MARKETING_CONTENT_ROLES` |

Assistant แสดงเฉพาะผู้ที่เข้าหน้า edit ได้อยู่แล้ว

### 9.9 Versioning Contract

Client `AssistantState` ต้องส่ง version fields:

```ts
{
  assistantVersion: "a4-v1",
  catalogVersion: "a4-v1",
  ...
}
```

ใช้สำหรับ debug และ future migration — UI ไม่ต้องแสดงให้ user

**Section 9 Status: ✅ Locked**

---

## 10. Acceptance Criteria & Definition of Done

### 10.1 Scope Reminder

A4 v1 ส่งมอบ **Optimization Assistant** ใน editor 3 ประเภท โดย:

- ไม่เปลี่ยน `analyzeSeoScore()` (A1 frozen)
- ไม่เพิ่ม API / schema
- ไม่ใช้ AI
- Parity กับ A2 ตอน save

### 10.2 Functional Acceptance

#### FA-01 — Assistant แสดงใน editor ทั้ง 3 ประเภท

- [ ] Post, Event, Promotion edit pages แสดง `SeoOptimizationAssistant`
- [ ] แทนที่ `SeoScorePanel` แล้ว
- [ ] `SeoScoreBadge` บนแท็บ SEO ยังทำงาน

#### FA-02 — Score Summary

- [ ] แสดง `seoScore / 100` + progress bar
- [ ] แสดง `scoreGapMessage` ตาม A4 progress bands (70/80/90)
- [ ] Top blockers สูงสุด 3 รายการ
- [ ] อัปเดตภายใน ~300ms หลังแก้ form

#### FA-03 — Quick Wins

- [ ] แสดงสูงสุด 5 รายการ
- [ ] เรียงตาม `recoverablePoints DESC` จาก engine — UI ไม่ re-sort (U4)
- [ ] แต่ละรายการแสดง `+N คะแนน` + `actionLabel`
- [ ] Copy Suggestion ทำงานเมื่อมี fix suggestion คู่กัน

#### FA-04 — Fix Suggestions

- [ ] แสดงเฉพาะ checks ที่ `hasFixSuggestion = true` และ status ≠ `good`
- [ ] Current + Recommended + reason + Copy
- [ ] ไม่ auto-fill form

#### FA-05 — Internal Links

- [ ] แสดงเมื่อ `internal-links` ≠ `good`
- [ ] ทุกรายการมี `title`, `href`, `reason`
- [ ] Hub links แยกใต้ divider
- [ ] Copy URL ทำงาน
- [ ] Empty state ข้อความครบ (U3)
- [ ] Stale notice เมื่อ category เปลี่ยนโดยยังไม่ save

#### FA-06 — Diagnostics

- [ ] Collapsed by default
- [ ] แสดงจำนวน issues ใน label
- [ ] Expanded: max-height 400px + scroll (U2)
- [ ] แสดง bad / ok / good พร้อมข้อความ

#### FA-07 — Excellent State

- [ ] เมื่อ `seoScore >= 90` && `issues.length === 0`
- [ ] แสดง "Excellent SEO" message
- [ ] ซ่อน Quick Wins และ Fix Suggestions

#### FA-08 — Copy Feedback (U1)

- [ ] ทุกปุ่ม Copy: `Copy` → `Copied!` → 2s → `Copy`
- [ ] ใช้ shared `CopyButton` component

#### FA-09 — A2 Parity

- [ ] คะแนนใน Assistant ตรงกับ `persistSeoAudit` หลัง save (fixture tests)
- [ ] ใช้ `buildPreviewSeoPayload` pipeline เดียวกัน

#### FA-10 — RBAC

- [ ] MARKETING เข้า Event/Promotion assistant ได้
- [ ] ไม่เพิ่ม permission module ใหม่

### 10.3 Non-Functional Acceptance

#### NF-01 — Determinism

- [ ] `buildAssistantState` snapshot tests pass
- [ ] Identical inputs → identical outputs

#### NF-02 — Catalog Completeness

- [ ] ทุก A1 `checkId` มี catalog entry
- [ ] `issuePriority` ตรง spec §5.8
- [ ] Unknown checkId throws in test env

#### NF-03 — Internal Links Performance

- [ ] `resolveInternalLinkSuggestions` < 200ms บน fixture dataset
- [ ] Tier A ranks above Tier B เมื่อ signals เท่ากัน

#### NF-04 — Mobile

- [ ] `< 1024px` stack ไม่มี horizontal scroll
- [ ] Touch targets ≥ 44px

#### NF-05 — No Regression

- [ ] Existing SEO save flow ไม่พัง
- [ ] `npx prisma validate` pass
- [ ] SEO test suite pass (A1/A2 existing + A4 new)

### 10.4 Test Plan Summary

| Category | Tests |
|----------|-------|
| Unit | `seo-check-catalog`, `seo-shared`, `seo-recommendations`, `buildAssistantState`, `resolveInternalLinkSuggestions` |
| Integration | Preview parity vs save audit |
| Component | CopyButton, Excellent state, empty links |
| E2E (manual) | Edit post → follow Quick Win → save → score improves |

**Target:** A4-specific tests เพิ่ม ≥ 25 cases

### 10.5 Definition of Done

A4 v1 ถือว่า **เสร็จ** เมื่อ:

1. **Spec** — ทุก section 1–10 approved (สถานะนี้)
2. **Code** — ครบ deliverables §1 + component tree §8.14
3. **Tests** — FA + NF ผ่านทั้งหมด
4. **Editors** — Post, Event, Promotion ใช้ Assistant ได้จริง
5. **Review** — Principal sign-off หลัง implementation demo
6. **Docs** — ไม่บังคับ user-facing docs ใน v1 (spec เพียงพอ)

### 10.6 Implementation Task Breakdown (Suggested)

| Order | Task | Depends on |
|-------|------|------------|
| 1 | `lib/seo-shared.ts` — extract from auto-fill | — |
| 2 | `lib/seo-check-catalog.ts` | — |
| 3 | `lib/seo-recommendations.ts` | 1, 2 |
| 4 | `lib/seo-assistant.ts` + tests | 2, 3 |
| 5 | `lib/seo-internal-links.ts` + tests | 2 |
| 6 | `hooks/use-seo-assistant.ts` | 4 |
| 7 | `features/content/seo-optimization/*` | 6 |
| 8 | Wire server pages (3 editors) | 5, 7 |
| 9 | Remove/replace `SeoScorePanel` usage | 8 |
| 10 | E2E smoke + Principal demo | 9 |

### 10.7 Explicitly Deferred (Not DoD)

- A3 SERP/OG preview transparency
- A5 AI-generated copy
- A6 site-wide workspace
- Insert Link in rich text (A4.1)
- Readability Tips section (A4.1)
- Live refresh internal links without save
- Auto-apply suggestions to form fields

**Section 10 Status: ✅ Locked**

---

## Document Index

| Section | Topic | Status |
|---------|-------|--------|
| 1–4 | Summary, Goals, Non-Goals, User Stories | ✅ Approved |
| 5 | SeoCheckCatalog | ✅ Locked |
| 6 | Suggestion Engine | ✅ Locked |
| 7 | Internal Link Suggestions | ✅ Locked |
| 8 | UI Layout | ✅ Locked |
| 9 | API & Integration | ✅ Locked |
| 10 | Acceptance Criteria & DoD | ✅ Locked |

---

## Specification Status

**SEO-A4 Optimization Assistant — IMPLEMENTATION APPROVED**

Principal architecture reviews: Sections 1–4, 5, 6, 7, 8 — all approved.

Ready for development task breakdown and implementation per §10.6.

**Recommended roadmap after A4:**

```txt
A4 Optimization Assistant  ← implement now
A3 Preview Transparency
A5 AI Assistant
A6 Workspace MVP
```
