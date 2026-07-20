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

export type SeoScoreInput = {
  title?: string | null;
  slug?: string | null;
  content?: string | null;
  excerpt?: string | null;
  featuredImage?: string | null;
  coverImageAlt?: string | null;
  seo?: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    focusKeyword?: string | null;
    ogImage?: string | null;
  } | null;
};

const SEO_TITLE_MIN = 30;
const SEO_TITLE_MAX = 60;
const SEO_DESC_MIN = 120;
const SEO_DESC_MAX = 160;
const MIN_CONTENT_CHARS = 300;
const PUBLISH_WARN_THRESHOLD = 50;

export function getSeoScoreBand(score: number): "red" | "yellow" | "green" {
  if (score < 50) return "red";
  if (score < 80) return "yellow";
  return "green";
}

export function shouldWarnOnPublish(seoScore: number) {
  return seoScore < PUBLISH_WARN_THRESHOLD;
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function includesKeyword(haystack: string, keyword: string) {
  if (!keyword) return false;
  return normalizeKeyword(haystack).includes(normalizeKeyword(keyword));
}

function countTags(html: string, tag: string) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) ?? []).length;
}

function countLinks(html: string) {
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((href): href is string => Boolean(href));
  const internal = hrefs.filter((href) => href.startsWith("/") || href.includes("thepaseo") || href.startsWith("#")).length;
  const outbound = hrefs.filter((href) => /^https?:\/\//i.test(href) && !href.includes("thepaseo")).length;
  return { total: hrefs.length, internal, outbound };
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

/**
 * Analyze content for SEO + readability scores (Yoast-style checklist).
 * Works for Thai and English content using character-oriented heuristics.
 */
export function analyzeSeoScore(input: SeoScoreInput): SeoScoreResult {
  const title = input.title?.trim() ?? "";
  const slug = input.slug?.trim() ?? "";
  const contentHtml = input.content ?? "";
  const plain = stripHtml(contentHtml);
  const excerpt = input.excerpt?.trim() ?? "";
  const featuredImage = input.featuredImage?.trim() ?? "";
  const coverAlt = input.coverImageAlt?.trim() ?? "";
  const seoTitle = (input.seo?.seoTitle?.trim() || title).trim();
  const seoDescription = (input.seo?.seoDescription?.trim() || excerpt).trim();
  const focusKeyword = input.seo?.focusKeyword?.trim() ?? "";
  const ogImage = input.seo?.ogImage?.trim() || featuredImage;
  const links = countLinks(contentHtml);
  const h2Count = countTags(contentHtml, "h2") + countTags(contentHtml, "h3");
  const sentences = splitSentences(plain);
  const paragraphs = splitParagraphs(contentHtml);
  const avgSentenceLen =
    sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length : 0;
  const longParagraphs = paragraphs.filter((p) => p.length > 300).length;

  const checks: SeoCheck[] = [];

  // --- SEO ---
  checks.push(
    focusKeyword
      ? makeCheck("focus-keyword", "มี focus keyword", "good", "ตั้งค่า focus keyword แล้ว", 10, "seo")
      : makeCheck("focus-keyword", "มี focus keyword", "bad", "กรอก focus keyword ในแท็บ SEO", 10, "seo"),
  );

  if (focusKeyword) {
    checks.push(
      includesKeyword(seoTitle, focusKeyword)
        ? makeCheck("kw-title", "Focus keyword ใน SEO title", "good", "พบ keyword ใน title", 10, "seo")
        : makeCheck("kw-title", "Focus keyword ใน SEO title", "bad", "ใส่ keyword ใน SEO title", 10, "seo"),
    );

    checks.push(
      includesKeyword(slug, focusKeyword) || includesKeyword(generateLooseSlug(title), focusKeyword)
        ? makeCheck("kw-slug", "Focus keyword ใน slug", "good", "slug สอดคล้องกับ keyword", 8, "seo")
        : makeCheck("kw-slug", "Focus keyword ใน slug", "ok", "ลองใส่ keyword ใน slug", 8, "seo"),
    );

    checks.push(
      includesKeyword(seoDescription, focusKeyword)
        ? makeCheck("kw-desc", "Focus keyword ใน meta description", "good", "พบ keyword ใน description", 8, "seo")
        : makeCheck("kw-desc", "Focus keyword ใน meta description", "bad", "ใส่ keyword ใน SEO description", 8, "seo"),
    );

    const firstChunk = plain.slice(0, 200);
    checks.push(
      includesKeyword(firstChunk, focusKeyword)
        ? makeCheck("kw-intro", "Focus keyword ใกล้ต้นเนื้อหา", "good", "พบ keyword ในช่วงต้น", 8, "seo")
        : makeCheck("kw-intro", "Focus keyword ใกล้ต้นเนื้อหา", "ok", "ใส่ keyword ในย่อหน้าแรก", 8, "seo"),
    );

    const density = keywordDensity(plain, focusKeyword);
    if (density >= 0.5 && density <= 2.5) {
      checks.push(makeCheck("kw-density", "ความหนาแน่น keyword", "good", `ประมาณ ${density.toFixed(1)}%`, 6, "seo"));
    } else if (density > 0 && density < 4) {
      checks.push(makeCheck("kw-density", "ความหนาแน่น keyword", "ok", `ประมาณ ${density.toFixed(1)}% — ปรับเล็กน้อย`, 6, "seo"));
    } else {
      checks.push(
        makeCheck(
          "kw-density",
          "ความหนาแน่น keyword",
          "bad",
          density === 0 ? "ยังไม่พบ keyword ในเนื้อหา" : `หนาแน่นเกินไป (${density.toFixed(1)}%)`,
          6,
          "seo",
        ),
      );
    }
  } else {
    checks.push(makeCheck("kw-title", "Focus keyword ใน SEO title", "bad", "ต้องมี focus keyword ก่อน", 10, "seo"));
    checks.push(makeCheck("kw-slug", "Focus keyword ใน slug", "bad", "ต้องมี focus keyword ก่อน", 8, "seo"));
    checks.push(makeCheck("kw-desc", "Focus keyword ใน meta description", "bad", "ต้องมี focus keyword ก่อน", 8, "seo"));
    checks.push(makeCheck("kw-intro", "Focus keyword ใกล้ต้นเนื้อหา", "bad", "ต้องมี focus keyword ก่อน", 8, "seo"));
    checks.push(makeCheck("kw-density", "ความหนาแน่น keyword", "bad", "ต้องมี focus keyword ก่อน", 6, "seo"));
  }

  const titleLen = seoTitle.length;
  if (titleLen >= SEO_TITLE_MIN && titleLen <= SEO_TITLE_MAX) {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "good", `${titleLen} ตัวอักษร (เหมาะดี)`, 10, "seo"));
  } else if (titleLen > 0 && titleLen < SEO_TITLE_MIN) {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "ok", `${titleLen} ตัวอักษร — สั้นไปเล็กน้อย`, 10, "seo"));
  } else if (titleLen > SEO_TITLE_MAX) {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "ok", `${titleLen} ตัวอักษร — ยาวไปเล็กน้อย`, 10, "seo"));
  } else {
    checks.push(makeCheck("title-length", "ความยาว SEO title", "bad", "ยังไม่มี SEO title", 10, "seo"));
  }

  const descLen = seoDescription.length;
  if (descLen >= SEO_DESC_MIN && descLen <= SEO_DESC_MAX) {
    checks.push(makeCheck("desc-length", "ความยาว meta description", "good", `${descLen} ตัวอักษร (เหมาะดี)`, 10, "seo"));
  } else if (descLen > 40 && (descLen < SEO_DESC_MIN || descLen > SEO_DESC_MAX)) {
    checks.push(makeCheck("desc-length", "ความยาว meta description", "ok", `${descLen} ตัวอักษร — เป้า ${SEO_DESC_MIN}–${SEO_DESC_MAX}`, 10, "seo"));
  } else {
    checks.push(makeCheck("desc-length", "ความยาว meta description", "bad", "ควรยาวประมาณ 120–160 ตัวอักษร", 10, "seo"));
  }

  if (featuredImage || ogImage) {
    checks.push(
      coverAlt
        ? makeCheck("image-alt", "รูปปก + alt text", "good", "มีรูปและ alt แล้ว", 8, "seo")
        : makeCheck("image-alt", "รูปปก + alt text", "ok", "มีรูปแล้ว แต่ควรใส่ alt text", 8, "seo"),
    );
  } else {
    checks.push(makeCheck("image-alt", "รูปปก + alt text", "bad", "เพิ่มรูปปกและ alt text", 8, "seo"));
  }

  if (plain.length >= MIN_CONTENT_CHARS) {
    checks.push(makeCheck("content-length", "ความยาวเนื้อหา", "good", `${plain.length} ตัวอักษร`, 8, "seo"));
  } else if (plain.length >= 120) {
    checks.push(makeCheck("content-length", "ความยาวเนื้อหา", "ok", `${plain.length} ตัวอักษร — ควรอย่างน้อย ${MIN_CONTENT_CHARS}`, 8, "seo"));
  } else {
    checks.push(makeCheck("content-length", "ความยาวเนื้อหา", "bad", `สั้นเกินไป (${plain.length} ตัวอักษร)`, 8, "seo"));
  }

  if (h2Count >= 2) {
    checks.push(makeCheck("subheadings", "มีหัวข้อย่อย (H2/H3)", "good", `พบ ${h2Count} หัวข้อ`, 6, "seo"));
  } else if (h2Count === 1) {
    checks.push(makeCheck("subheadings", "มีหัวข้อย่อย (H2/H3)", "ok", "ควรมีอย่างน้อย 2 หัวข้อย่อย", 6, "seo"));
  } else {
    checks.push(makeCheck("subheadings", "มีหัวข้อย่อย (H2/H3)", "bad", "เพิ่มหัวข้อ H2/H3 ในเนื้อหา", 6, "seo"));
  }

  if (links.internal > 0 && links.outbound > 0) {
    checks.push(makeCheck("links", "ลิงก์ภายใน/ภายนอก", "good", `ภายใน ${links.internal} · ภายนอก ${links.outbound}`, 8, "seo"));
  } else if (links.total > 0) {
    checks.push(makeCheck("links", "ลิงก์ภายใน/ภายนอก", "ok", "มีลิงก์แล้ว ลองเพิ่มทั้งภายในและภายนอก", 8, "seo"));
  } else {
    checks.push(makeCheck("links", "ลิงก์ภายใน/ภายนอก", "bad", "เพิ่มลิงก์ภายในหรือภายนอกในเนื้อหา", 8, "seo"));
  }

  // --- Readability ---
  if (avgSentenceLen > 0 && avgSentenceLen <= 120) {
    checks.push(makeCheck("sentence-length", "ความยาวประโยคเฉลี่ย", "good", `เฉลี่ย ${Math.round(avgSentenceLen)} ตัวอักษร`, 12, "readability"));
  } else if (avgSentenceLen <= 180) {
    checks.push(makeCheck("sentence-length", "ความยาวประโยคเฉลี่ย", "ok", `เฉลี่ย ${Math.round(avgSentenceLen)} — ลองตัดประโยคให้สั้นลง`, 12, "readability"));
  } else {
    checks.push(makeCheck("sentence-length", "ความยาวประโยคเฉลี่ย", "bad", `เฉลี่ย ${Math.round(avgSentenceLen)} — ประโยคยาวเกินไป`, 12, "readability"));
  }

  if (h2Count >= 2) {
    checks.push(makeCheck("read-subheadings", "กระจายหัวข้อย่อย", "good", "มีหัวข้อย่อยช่วยอ่าน", 10, "readability"));
  } else if (h2Count === 1) {
    checks.push(makeCheck("read-subheadings", "กระจายหัวข้อย่อย", "ok", "เพิ่มหัวข้อย่อยอีกเล็กน้อย", 10, "readability"));
  } else {
    checks.push(makeCheck("read-subheadings", "กระจายหัวข้อย่อย", "bad", "ใช้ H2/H3 แบ่งเนื้อหา", 10, "readability"));
  }

  if (paragraphs.length === 0) {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "bad", "ยังไม่มีเนื้อหา", 10, "readability"));
  } else if (longParagraphs === 0) {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "good", "ย่อหน้ากระชับดี", 10, "readability"));
  } else if (longParagraphs <= 2) {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "ok", `มี ${longParagraphs} ย่อหน้ายาว — ลองตัดแบ่ง`, 10, "readability"));
  } else {
    checks.push(makeCheck("paragraph-length", "ความยาวย่อหน้า", "bad", `มี ${longParagraphs} ย่อหน้ายาวเกินไป`, 10, "readability"));
  }

  const shortSentences = sentences.filter((s) => s.length <= 80).length;
  const shortRatio = sentences.length ? shortSentences / sentences.length : 0;
  if (sentences.length === 0) {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "bad", "ยังไม่มีประโยคให้วิเคราะห์", 8, "readability"));
  } else if (shortRatio >= 0.4) {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "good", `${Math.round(shortRatio * 100)}% เป็นประโยคสั้น`, 8, "readability"));
  } else if (shortRatio >= 0.2) {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "ok", `${Math.round(shortRatio * 100)}% — เพิ่มประโยคสั้นได้อีก`, 8, "readability"));
  } else {
    checks.push(makeCheck("sentence-variety", "สัดส่วนประโยคสั้น", "bad", "ประโยคส่วนใหญ่ยาว — ลองตัดให้สั้นขึ้น", 8, "readability"));
  }

  return finalize(checks);
}

function keywordDensity(plain: string, keyword: string) {
  if (!plain || !keyword) return 0;
  const normalized = normalizeKeyword(plain);
  const kw = normalizeKeyword(keyword);
  if (!kw) return 0;

  let count = 0;
  let idx = 0;
  while (true) {
    const found = normalized.indexOf(kw, idx);
    if (found === -1) break;
    count += 1;
    idx = found + kw.length;
  }

  // Approximate "words" for mixed Thai/English: spaces + CJK/Thai clusters.
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const tokenCount = Math.max(tokens.length, Math.ceil(normalized.length / 4));
  return (count / tokenCount) * 100;
}

function generateLooseSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}
