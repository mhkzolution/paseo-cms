export const SEO_CHECK_CATALOG_VERSION = 1;

export type SeoCheckGroup = "seo" | "readability";

export type RecommendationType =
  | "generated"
  | "links"
  | "content"
  | "field"
  | "image"
  | "none";

export const RECOMMENDATION_TYPES = [
  "generated",
  "links",
  "content",
  "field",
  "image",
  "none",
] as const satisfies readonly RecommendationType[];

export type SeoCheckCatalogEntry = {
  id: string;
  label: string;
  issueLabel: string;
  actionLabel: string;
  group: SeoCheckGroup;
  maxWeight: number;
  showInIssues: boolean;
  issuePriority: number;
  quickWinEligible: boolean;
  hasFixSuggestion: boolean;
  recommendationType: RecommendationType;
  reason: string;
  targetField?: string;
};

export const SEO_CHECK_CATALOG = {
  "title-length": {
    id: "title-length",
    label: "ความยาว SEO title",
    issueLabel: "SEO Title สั้นหรือยาวเกินไป",
    actionLabel: "ปรับ SEO Title",
    group: "seo",
    maxWeight: 12,
    showInIssues: true,
    issuePriority: 100,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "generated",
    reason: "Title เป็นสัญญาณหลักที่ search engine ใช้จัดอันดับหน้า — เป้าหมาย 25–65 ตัวอักษร",
    targetField: "seo.seoTitle",
  },
  "title-exists": {
    id: "title-exists",
    label: "มีชื่อบทความ",
    issueLabel: "ยังไม่มีชื่อบทความ",
    actionLabel: "เพิ่มชื่อบทความ",
    group: "seo",
    maxWeight: 5,
    showInIssues: true,
    issuePriority: 99,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "field",
    reason: "ทุกหน้าต้องมี title เพื่อให้ search engine และผู้อ่านเข้าใจหัวข้อ",
    targetField: "title",
  },
  "desc-length": {
    id: "desc-length",
    label: "ความยาว meta description",
    issueLabel: "Meta Description สั้นหรือยาวเกินไป",
    actionLabel: "เพิ่ม Meta Description",
    group: "seo",
    maxWeight: 12,
    showInIssues: true,
    issuePriority: 95,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "generated",
    reason:
      "Search engines ใช้ meta description สรุปหน้าในผลการค้นหา — ความยาว 70–165 ตัวอักษรเหมาะสมที่สุด",
    targetField: "seo.seoDescription",
  },
  "topic-in-title-desc": {
    id: "topic-in-title-desc",
    label: "คำสำคัญใน title/description",
    issueLabel: "คำสำคัญไม่อยู่ใน title หรือ description",
    actionLabel: "ใส่คำสำคัญใน title/description",
    group: "seo",
    maxWeight: 8,
    showInIssues: true,
    issuePriority: 90,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "generated",
    reason: "คำสำคัญใน SEO title หรือ description ช่วยให้หน้าตรงกับคำค้นหาเป้าหมาย",
    targetField: "seo.seoTitle",
  },
  "topic-clarity": {
    id: "topic-clarity",
    label: "มีคำสำคัญหลัก",
    issueLabel: "ไม่มีคำสำคัญหลัก",
    actionLabel: "ตั้งคำสำคัญหลัก",
    group: "seo",
    maxWeight: 5,
    showInIssues: true,
    issuePriority: 88,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "field",
    reason: "Focus keyword ช่วยจัดโฟกัสเนื้อหาและ metadata ให้สอดคล้องกัน",
    targetField: "seo.focusKeyword",
  },
  "internal-links": {
    id: "internal-links",
    label: "ลิงก์ภายใน",
    issueLabel: "ไม่มี Internal Link",
    actionLabel: "เพิ่ม Internal Link",
    group: "seo",
    maxWeight: 10,
    showInIssues: true,
    issuePriority: 80,
    quickWinEligible: true,
    hasFixSuggestion: false,
    recommendationType: "links",
    reason:
      "Internal links ช่วยให้ search engine และผู้อ่านค้นพบเนื้อหาที่เกี่ยวข้องภายในเว็บไซต์",
    targetField: "content",
  },
  "image-alt": {
    id: "image-alt",
    label: "รูปปก + alt text",
    issueLabel: "ไม่มี Alt Text",
    actionLabel: "เพิ่ม Alt Text",
    group: "seo",
    maxWeight: 14,
    showInIssues: true,
    issuePriority: 70,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "generated",
    reason: "Alt text ช่วย accessibility และช่วย search engine เข้าใจรูปภาพ",
    targetField: "coverImageAlt",
  },
  subheadings: {
    id: "subheadings",
    label: "มีหัวข้อย่อย (H2/H3)",
    issueLabel: "ไม่มีหัวข้อย่อย (H2/H3)",
    actionLabel: "เพิ่มหัวข้อย่อย",
    group: "seo",
    maxWeight: 8,
    showInIssues: true,
    issuePriority: 60,
    quickWinEligible: true,
    hasFixSuggestion: false,
    recommendationType: "content",
    reason: "หัวข้อย่อยช่วยโครงสร้างเนื้อหาและให้ search engine เข้าใจหัวข้อหลัก",
    targetField: "content",
  },
  "content-length": {
    id: "content-length",
    label: "ความยาวเนื้อหา",
    issueLabel: "เนื้อหาสั้นเกินไป",
    actionLabel: "เพิ่มความยาวเนื้อหา",
    group: "seo",
    maxWeight: 10,
    showInIssues: true,
    issuePriority: 55,
    quickWinEligible: true,
    hasFixSuggestion: false,
    recommendationType: "content",
    reason: "เนื้อหาที่มีความลึกเพียงพอช่วยตอบคำถามผู้อ่านและสัญญาณ SEO โดยรวม",
    targetField: "content",
  },
  "topic-in-content": {
    id: "topic-in-content",
    label: "คำสำคัญในเนื้อหา",
    issueLabel: "คำสำคัญไม่อยู่ในเนื้อหา",
    actionLabel: "เพิ่มคำสำคัญในเนื้อหา",
    group: "seo",
    maxWeight: 5,
    showInIssues: true,
    issuePriority: 50,
    quickWinEligible: true,
    hasFixSuggestion: false,
    recommendationType: "content",
    reason: "คำสำคัญในช่วงต้นเนื้อหาช่วย search engine เข้าใจหัวข้อหลัก",
    targetField: "content",
  },
  "slug-exists": {
    id: "slug-exists",
    label: "มี slug",
    issueLabel: "ยังไม่มี slug",
    actionLabel: "เพิ่ม slug",
    group: "seo",
    maxWeight: 6,
    showInIssues: true,
    issuePriority: 45,
    quickWinEligible: true,
    hasFixSuggestion: true,
    recommendationType: "field",
    reason: "Slug ที่ชัดเจนช่วยให้ URL อ่านง่ายและเป็นมิตรกับ search engine",
    targetField: "slug",
  },
  "social-ready": {
    id: "social-ready",
    label: "พร้อมแชร์โซเชียล",
    issueLabel: "ยังไม่มีรูปสำหรับแชร์โซเชียล",
    actionLabel: "เพิ่มรูปปก",
    group: "seo",
    maxWeight: 5,
    showInIssues: true,
    issuePriority: 38,
    quickWinEligible: true,
    hasFixSuggestion: false,
    recommendationType: "image",
    reason: "รูปปกช่วยให้เนื้อหาแชร์บนโซเชียลได้สวยงามและดึงดูดคลิก",
    targetField: "featuredImage",
  },
  "sentence-length": {
    id: "sentence-length",
    label: "ความยาวประโยคเฉลี่ย",
    issueLabel: "ประโยคยาวเกินไป",
    actionLabel: "ปรับความยาวประโยค",
    group: "readability",
    maxWeight: 8,
    showInIssues: true,
    issuePriority: 30,
    quickWinEligible: false,
    hasFixSuggestion: false,
    recommendationType: "none",
    reason: "ประโยคสั้นอ่านง่ายขึ้น โดยเฉพาะบนมือถือ",
  },
  "content-present": {
    id: "content-present",
    label: "มีเนื้อหาพออ่าน",
    issueLabel: "เนื้อหายังสั้นเกินไป",
    actionLabel: "เพิ่มเนื้อหา",
    group: "readability",
    maxWeight: 8,
    showInIssues: true,
    issuePriority: 28,
    quickWinEligible: false,
    hasFixSuggestion: false,
    recommendationType: "none",
    reason: "เนื้อหาที่พออ่านช่วยให้ผู้อ่านเข้าใจหัวข้อได้ครบถ้วน",
  },
  "paragraph-length": {
    id: "paragraph-length",
    label: "ความยาวย่อหน้า",
    issueLabel: "มีย่อหน้ายาวเกินไป",
    actionLabel: "แบ่งย่อหน้าให้สั้นลง",
    group: "readability",
    maxWeight: 8,
    showInIssues: true,
    issuePriority: 25,
    quickWinEligible: false,
    hasFixSuggestion: false,
    recommendationType: "none",
    reason: "ย่อหน้าสั้นอ่านง่ายและลดความล้าของผู้อ่าน",
  },
  "sentence-variety": {
    id: "sentence-variety",
    label: "สัดส่วนประโยคสั้น",
    issueLabel: "ประโยคส่วนใหญ่ยาวเกินไป",
    actionLabel: "เพิ่มประโยคสั้น",
    group: "readability",
    maxWeight: 4,
    showInIssues: true,
    issuePriority: 22,
    quickWinEligible: false,
    hasFixSuggestion: false,
    recommendationType: "none",
    reason: "สลับประโยคสั้นและยาวช่วยให้จังหวะการอ่านดีขึ้น",
  },
  "heading-structure": {
    id: "heading-structure",
    label: "โครงสร้างหัวข้อ",
    issueLabel: "ยังไม่มีโครงสร้างหัวข้อ (H2/H3)",
    actionLabel: "เพิ่มหัวข้อย่อย",
    group: "readability",
    maxWeight: 8,
    showInIssues: true,
    issuePriority: 20,
    quickWinEligible: false,
    hasFixSuggestion: false,
    recommendationType: "none",
    reason: "หัวข้อย่อยช่วยให้ผู้อ่านสแกนเนื้อหาได้เร็วขึ้น",
  },
} as const satisfies Record<string, SeoCheckCatalogEntry>;

export type SeoCheckCatalogId = keyof typeof SEO_CHECK_CATALOG;

export function getCatalogEntry(checkId: string): SeoCheckCatalogEntry {
  const entry = SEO_CHECK_CATALOG[checkId as SeoCheckCatalogId];

  if (!entry) {
    throw new Error(`Unknown SEO check: ${checkId}`);
  }

  return entry;
}

export function isQuickWin(checkId: string): boolean {
  return getCatalogEntry(checkId).quickWinEligible;
}

export function hasFixSuggestion(checkId: string): boolean {
  return getCatalogEntry(checkId).hasFixSuggestion;
}

export function getCatalogCheckIds(): SeoCheckCatalogId[] {
  return Object.keys(SEO_CHECK_CATALOG) as SeoCheckCatalogId[];
}
