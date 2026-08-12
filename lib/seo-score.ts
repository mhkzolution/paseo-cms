import {
  includesKeyword,
  normalizeKeyword,
  SEO_DESC_MAX,
  SEO_DESC_MIN,
  SEO_TITLE_MAX,
  SEO_TITLE_MIN,
  stripHtml,
} from "@/lib/seo-shared";

export type SeoCheckStatus = "good" | "ok" | "bad";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  tip: string;
  /** Points awarded toward the parent score (0 when bad). */
  weight: number;
  /** Max points this check can contribute. */
  maxWeight: number;
  group: "seo" | "readability";
};

export type SeoScoreResult = {
  seoScore: number;
  readabilityScore: number;
  checks: SeoCheck[];
  band: "red" | "yellow" | "green";
};

export type ContentType = "post" | "event" | "promotion";

export type SeoScoreInput = {
  title?: string | null;
  slug?: string | null;
  content?: string | null;
  excerpt?: string | null;
  featuredImage?: string | null;
  coverImageAlt?: string | null;
  contentType?: ContentType;
  seo?: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    focusKeyword?: string | null;
    ogImage?: string | null;
  } | null;
};

const POST_CONTENT_GOOD = 200;
const POST_CONTENT_OK = 80;
const SHORT_CONTENT_GOOD = 80;
const SHORT_CONTENT_OK = 50;
const PUBLISH_WARN_THRESHOLD = 50;

export function getSeoScoreBand(score: number): "red" | "yellow" | "green" {
  if (score < 50) return "red";
  if (score < 80) return "yellow";
  return "green";
}

export function shouldWarnOnPublish(seoScore: number) {
  return seoScore < PUBLISH_WARN_THRESHOLD;
}

export { stripHtml };

function countTags(html: string, tag: string) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) ?? []).length;
}

function countLinks(html: string) {
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((href): href is string => Boolean(href));
  const internal = hrefs.filter(
    (href) => href.startsWith("/") || href.includes("thepaseo") || href.startsWith("#"),
  ).length;
  return { total: hrefs.length, internal };
}

function splitSentences(text: string) {
  return text
    .split(/[.!?…。！？]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function splitParagraphs(html: string) {
  const parts = html
    .split(/<\/p>/i)
    .map((part) => stripHtml(part))
    .filter(Boolean);
  return parts.length ? parts : [stripHtml(html)].filter(Boolean);
}

function scoreCheck(status: SeoCheckStatus, maxWeight: number) {
  if (status === "good") return maxWeight;
  if (status === "ok") return Math.round(maxWeight * 0.5);
  return 0;
}

function finalize(checks: SeoCheck[]): SeoScoreResult {
  const seoChecks = checks.filter((c) => c.group === "seo");
  const readabilityChecks = checks.filter((c) => c.group === "readability");

  const seoMax = seoChecks.reduce((sum, c) => sum + c.maxWeight, 0) || 1;
  const seoGot = seoChecks.reduce((sum, c) => sum + c.weight, 0);
  const readMax = readabilityChecks.reduce((sum, c) => sum + c.maxWeight, 0) || 1;
  const readGot = readabilityChecks.reduce((sum, c) => sum + c.weight, 0);

  const seoScore = Math.round((seoGot / seoMax) * 100);
  const readabilityScore = Math.round((readGot / readMax) * 100);

  return {
    seoScore,
    readabilityScore,
    checks,
    band: getSeoScoreBand(seoScore),
  };
}

function makeCheck(
  id: string,
  label: string,
  status: SeoCheckStatus,
  tip: string,
  maxWeight: number,
  group: "seo" | "readability",
): SeoCheck {
  return {
    id,
    label,
    status,
    tip,
    maxWeight,
    weight: scoreCheck(status, maxWeight),
    group,
  };
}

function getContentThresholds(contentType: ContentType) {
  if (contentType === "post") {
    return { good: POST_CONTENT_GOOD, ok: POST_CONTENT_OK };
  }

  return { good: SHORT_CONTENT_GOOD, ok: SHORT_CONTENT_OK };
}

/**
 * Analyze content for SEO + readability scores.
 * Works for Thai and English content using character-oriented heuristics.
 */
export function analyzeSeoScore(input: SeoScoreInput): SeoScoreResult {
  const contentType = input.contentType ?? "post";
  const title = input.title?.trim() ?? "";
  const slug = input.slug?.trim() ?? "";
  const contentHtml = input.content ?? "";
  const plain = stripHtml(contentHtml);
  const excerpt = input.excerpt?.trim() ?? "";
  const featuredImage = input.featuredImage?.trim() ?? "";
  const coverAlt = input.coverImageAlt?.trim() ?? "";
  const seoTitle = (input.seo?.seoTitle?.trim() || title).trim();
  const seoDescription = (input.seo?.seoDescription?.trim() || excerpt).trim();
  const topic = input.seo?.focusKeyword?.trim() ?? "";
  const ogImage = input.seo?.ogImage?.trim() || featuredImage;
  const links = countLinks(contentHtml);
  const h2Count = countTags(contentHtml, "h2") + countTags(contentHtml, "h3");
  const sentences = splitSentences(plain);
  const paragraphs = splitParagraphs(contentHtml);
  const avgSentenceLen =
    sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length : 0;
  const longParagraphs = paragraphs.filter((p) => p.length > 300).length;
  const contentThresholds = getContentThresholds(contentType);

  const checks: SeoCheck[] = [];

  // --- SEO ---
  checks.push(
    title
      ? makeCheck("title-exists", "มีชื่อบทความ", "good", "มี title แล้ว", 5, "seo")
      : makeCheck("title-exists", "มีชื่อบทความ", "bad", "กรอก title", 5, "seo"),
  );

  const titleLen = seoTitle.length;
  if (titleLen >= SEO_TITLE_MIN && titleLen <= SEO_TITLE_MAX) {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "good", `${titleLen} ตัวอักษร (เหมาะดี)`, 12, "seo"));
  } else if (titleLen > 0) {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "ok", `${titleLen} ตัวอักษร — เป้า ${SEO_TITLE_MIN}–${SEO_TITLE_MAX}`, 12, "seo"));
  } else {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "bad", "ยังไม่มี SEO title", 12, "seo"));
  }

  const descLen = seoDescription.length;
  if (descLen >= SEO_DESC_MIN && descLen <= SEO_DESC_MAX) {
    checks.push(makeCheck("desc-length", "ความยาว meta description", "good", `${descLen} ตัวอักษร (เหมาะดี)`, 12, "seo"));
  } else if (descLen >= 40) {
    checks.push(makeCheck("desc-length", "ความยาว meta description", "ok", `${descLen} ตัวอักษร — เป้า ${SEO_DESC_MIN}–${SEO_DESC_MAX}`, 12, "seo"));
  } else {
    checks.push(makeCheck("desc-length", "ความยาว meta description", "bad", `ควรยาวประมาณ ${SEO_DESC_MIN}–${SEO_DESC_MAX} ตัวอักษร`, 12, "seo"));
  }

  checks.push(
    topic
      ? makeCheck("topic-clarity", "มีคำสำคัญหลัก", "good", "ตั้งค่าคำสำคัญหลักแล้ว", 5, "seo")
      : makeCheck("topic-clarity", "มีคำสำคัญหลัก", "bad", "ยังไม่มีคำสำคัญหลัก", 5, "seo"),
  );

  if (topic) {
    checks.push(
      includesKeyword(seoTitle, topic) || includesKeyword(seoDescription, topic)
        ? makeCheck("topic-in-title-desc", "คำสำคัญใน title/description", "good", "พบคำสำคัญใน title หรือ description", 8, "seo")
        : makeCheck("topic-in-title-desc", "คำสำคัญใน title/description", "bad", "ใส่คำสำคัญใน SEO title หรือ description", 8, "seo"),
    );

    const firstChunk = plain.slice(0, 300);
    if (includesKeyword(firstChunk, topic)) {
      checks.push(makeCheck("topic-in-content", "คำสำคัญในเนื้อหา", "good", "พบคำสำคัญในช่วงต้นเนื้อหา", 5, "seo"));
    } else if (includesKeyword(plain, topic)) {
      checks.push(makeCheck("topic-in-content", "คำสำคัญในเนื้อหา", "ok", "พบคำสำคัญในเนื้อหา", 5, "seo"));
    } else {
      checks.push(makeCheck("topic-in-content", "คำสำคัญในเนื้อหา", "bad", "ใส่คำสำคัญในเนื้อหา", 5, "seo"));
    }
  } else {
    checks.push(makeCheck("topic-in-title-desc", "คำสำคัญใน title/description", "bad", "ต้องมีคำสำคัญหลักก่อน", 8, "seo"));
    checks.push(makeCheck("topic-in-content", "คำสำคัญในเนื้อหา", "bad", "ต้องมีคำสำคัญหลักก่อน", 5, "seo"));
  }

  if (featuredImage || ogImage) {
    checks.push(
      coverAlt
        ? makeCheck("image-alt", "รูปปก + alt text", "good", "มีรูปและ alt แล้ว", 14, "seo")
        : makeCheck("image-alt", "รูปปก + alt text", "ok", "มีรูปแล้ว แต่ควรใส่ alt text", 14, "seo"),
    );
  } else {
    checks.push(makeCheck("image-alt", "รูปปก + alt text", "bad", "เพิ่มรูปปกและ alt text", 14, "seo"));
  }

  if (plain.length >= contentThresholds.good) {
    checks.push(makeCheck("content-length", "ความยาวเนื้อหา", "good", `${plain.length} ตัวอักษร`, 10, "seo"));
  } else if (plain.length >= contentThresholds.ok) {
    checks.push(
      makeCheck(
        "content-length",
        "ความยาวเนื้อหา",
        "ok",
        `${plain.length} ตัวอักษร — ควรอย่างน้อย ${contentThresholds.good}`,
        10,
        "seo",
      ),
    );
  } else {
    checks.push(makeCheck("content-length", "ความยาวเนื้อหา", "bad", `สั้นเกินไป (${plain.length} ตัวอักษร)`, 10, "seo"));
  }

  if (h2Count >= 1) {
    checks.push(makeCheck("subheadings", "มีหัวข้อย่อย (H2/H3)", "good", `พบ ${h2Count} หัวข้อ`, 8, "seo"));
  } else {
    checks.push(makeCheck("subheadings", "มีหัวข้อย่อย (H2/H3)", "bad", "เพิ่มหัวข้อ H2/H3 ในเนื้อหา", 8, "seo"));
  }

  if (links.internal > 0) {
    checks.push(makeCheck("internal-links", "ลิงก์ภายใน", "good", `พบลิงก์ภายใน ${links.internal} ลิงก์`, 10, "seo"));
  } else {
    checks.push(makeCheck("internal-links", "ลิงก์ภายใน", "bad", "เพิ่มลิงก์ภายในในเนื้อหา", 10, "seo"));
  }

  checks.push(
    slug
      ? makeCheck("slug-exists", "มี slug", "good", "มี slug แล้ว", 6, "seo")
      : makeCheck("slug-exists", "มี slug", "bad", "ยังไม่มี slug", 6, "seo"),
  );

  checks.push(
    featuredImage || ogImage
      ? makeCheck("social-ready", "พร้อมแชร์โซเชียล", "good", "มีรูปสำหรับแชร์แล้ว", 5, "seo")
      : makeCheck("social-ready", "พร้อมแชร์โซเชียล", "bad", "เพิ่มรูปปกเพื่อแชร์โซเชียล", 5, "seo"),
  );

  // --- Readability ---
  if (avgSentenceLen > 0 && avgSentenceLen <= 120) {
    checks.push(makeCheck("sentence-length", "ความยาวประโยคเฉลี่ย", "good", `เฉลี่ย ${Math.round(avgSentenceLen)} ตัวอักษร`, 8, "readability"));
  } else if (avgSentenceLen <= 180) {
    checks.push(makeCheck("sentence-length", "ความยาวประโยคเฉลี่ย", "ok", `เฉลี่ย ${Math.round(avgSentenceLen)} — ลองตัดประโยคให้สั้นลง`, 8, "readability"));
  } else {
    checks.push(makeCheck("sentence-length", "ความยาวประโยคเฉลี่ย", "bad", `เฉลี่ย ${Math.round(avgSentenceLen)} — ประโยคยาวเกินไป`, 8, "readability"));
  }

  if (paragraphs.length === 0) {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "bad", "ยังไม่มีเนื้อหา", 8, "readability"));
  } else if (longParagraphs === 0) {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "good", "ย่อหน้ากระชับดี", 8, "readability"));
  } else if (longParagraphs <= 2) {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "ok", `มี ${longParagraphs} ย่อหน้ายาว — ลองตัดแบ่ง`, 8, "readability"));
  } else {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "bad", `มี ${longParagraphs} ย่อหน้ายาวเกินไป`, 8, "readability"));
  }

  const shortSentences = sentences.filter((s) => s.length <= 80).length;
  const shortRatio = sentences.length ? shortSentences / sentences.length : 0;
  if (sentences.length === 0) {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "bad", "ยังไม่มีประโยคให้วิเคราะห์", 4, "readability"));
  } else if (shortRatio >= 0.4) {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "good", `${Math.round(shortRatio * 100)}% เป็นประโยคสั้น`, 4, "readability"));
  } else if (shortRatio >= 0.2) {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "ok", `${Math.round(shortRatio * 100)}% — เพิ่มประโยคสั้นได้อีก`, 4, "readability"));
  } else {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "bad", "ประโยคส่วนใหญ่ยาว — ลองตัดให้สั้นขึ้น", 4, "readability"));
  }

  if (plain.length >= 100) {
    checks.push(makeCheck("content-present", "มีเนื้อหาพออ่าน", "good", `${plain.length} ตัวอักษร`, 8, "readability"));
  } else {
    checks.push(makeCheck("content-present", "มีเนื้อหาพออ่าน", "bad", "เนื้อหายังสั้นเกินไป", 8, "readability"));
  }

  if (h2Count >= 1) {
    checks.push(makeCheck("heading-structure", "โครงสร้างหัวข้อ", "good", `พบ ${h2Count} หัวข้อย่อย`, 8, "readability"));
  } else {
    checks.push(makeCheck("heading-structure", "โครงสร้างหัวข้อ", "bad", "ใช้ H2/H3 แบ่งเนื้อหา", 8, "readability"));
  }

  return finalize(checks);
}
