/**
 * Shared SEO text + display helpers for A2 (preview/auto-fill) and A4 (recommendations).
 *
 * Full preview+score orchestration: `@/lib/seo-preview` → `buildPreviewSeoPayload`
 * (spec alias: `buildSeoPreviewPayload`).
 *
 * Dependency rule:
 *   A2 → shared
 *   A4 → shared
 *   shared ↛ seo-preview | seo-recommendations | seo-assistant
 */

export const SEO_TITLE_MIN = 25;
export const SEO_TITLE_MAX = 65;
export const SEO_DESC_MIN = 70;
export const SEO_DESC_MAX = 165;

export const A4_PROGRESS_MILESTONES = {
  fair: 70,
  good: 80,
  excellent: 90,
} as const;

export type A4ProgressBand = "needs_attention" | "fair" | "good" | "excellent";

export type A4DisplayBandResult = {
  band: A4ProgressBand;
  nextMilestone: number | null;
  gap: number | null;
  gapMessage: string;
};

const STOP_WORDS = new Set([
  "ที่",
  "ใน",
  "ของ",
  "และ",
  "กับ",
  "จาก",
  "ให้",
  "เป็น",
  "มี",
  "ได้",
  "นี้",
  "นั้น",
  "โดย",
  "ไป",
  "มา",
  "หรือ",
  "เมื่อ",
  "แล้ว",
  "จะ",
  "the",
  "a",
  "an",
  "at",
  "for",
  "in",
  "on",
  "of",
  "to",
  "and",
  "or",
  "with",
  "from",
  "by",
  "is",
  "are",
  "was",
  "were",
]);

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

export function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function includesKeyword(haystack: string, keyword: string) {
  if (!keyword) return false;
  return normalizeKeyword(haystack).includes(normalizeKeyword(keyword));
}

export function truncateNear(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.5) {
    return slice.slice(0, lastSpace).trim();
  }

  return slice.trim();
}

export function extractContentExcerpt(content: string, minLen: number, maxLen: number) {
  const plain = stripHtml(content);
  if (!plain) return "";

  if (plain.length <= maxLen) {
    return plain;
  }

  const chunk = plain.slice(0, maxLen + 1);
  const sentenceEnd = Math.max(
    chunk.lastIndexOf("."),
    chunk.lastIndexOf("!"),
    chunk.lastIndexOf("?"),
    chunk.lastIndexOf("…"),
    chunk.lastIndexOf("。"),
    chunk.lastIndexOf("！"),
    chunk.lastIndexOf("？"),
  );

  if (sentenceEnd >= minLen) {
    return chunk.slice(0, sentenceEnd + 1).trim();
  }

  const truncated = truncateNear(plain, maxLen);
  return truncated.length >= minLen ? truncated : plain.slice(0, maxLen).trim();
}

export function extractTitleKeywords(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return "";

  const words = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{Letter}\p{Number}]+|[^\p{Letter}\p{Number}]+$/gu, ""))
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));

  if (words.length > 0) {
    return words.slice(0, 3).join(" ");
  }

  if (!/\s/.test(trimmed)) {
    return trimmed.slice(0, 20).trim();
  }

  return "";
}

export type ExtractTopicInput = {
  primaryTagName?: string | null;
  title: string;
  categoryName?: string | null;
};

/** Infer focus keyword / topic from tag, title, or category. */
export function extractTopic(options: ExtractTopicInput) {
  if (options.primaryTagName?.trim()) {
    return options.primaryTagName.trim();
  }

  const fromTitle = extractTitleKeywords(options.title);
  if (fromTitle) {
    return fromTitle;
  }

  if (options.categoryName?.trim()) {
    return options.categoryName.trim();
  }

  return "";
}

/** @deprecated Use `extractTopic` — kept for A2 auto-fill compatibility. */
export const inferFocusKeyword = extractTopic;

export function calculateDisplayBand(seoScore: number): A4DisplayBandResult {
  const { fair, good, excellent } = A4_PROGRESS_MILESTONES;

  if (seoScore >= excellent) {
    return {
      band: "excellent",
      nextMilestone: null,
      gap: null,
      gapMessage: "คุณผ่านเกณฑ์สูงสุดแล้ว",
    };
  }

  if (seoScore < fair) {
    const gap = fair - seoScore;
    return {
      band: "needs_attention",
      nextMilestone: fair,
      gap,
      gapMessage: `อีก ${gap} คะแนนจะถึง Fair`,
    };
  }

  if (seoScore < good) {
    const gap = good - seoScore;
    return {
      band: "fair",
      nextMilestone: good,
      gap,
      gapMessage: `อีก ${gap} คะแนนจะถึง Good`,
    };
  }

  const gap = excellent - seoScore;
  return {
    band: "good",
    nextMilestone: excellent,
    gap,
    gapMessage: `อีก ${gap} คะแนนจะถึง Excellent`,
  };
}

export function getScoreGapMessage(seoScore: number): string {
  return calculateDisplayBand(seoScore).gapMessage;
}

export type BuildRecommendedTextInput = {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  /** Caller must resolve via `extractTopic()` — builders do not infer. */
  topic?: string | null;
};

export function buildRecommendedTitle({ title, topic }: BuildRecommendedTextInput) {
  const base = title.trim();
  if (!base) return "";

  const keyword = topic?.trim();
  if (keyword && !includesKeyword(base, keyword)) {
    const combined = `${keyword} — ${base}`;
    return truncateNear(combined, SEO_TITLE_MAX);
  }

  if (base.length < SEO_TITLE_MIN) {
    return truncateNear(`${base} | The Paseo`, SEO_TITLE_MAX);
  }

  return truncateNear(base, SEO_TITLE_MAX);
}

export function buildRecommendedDescription({
  title,
  excerpt,
  content,
  topic,
}: BuildRecommendedTextInput) {
  const keyword = topic?.trim();
  const candidates = [
    excerpt?.trim(),
    content ? extractContentExcerpt(content, SEO_DESC_MIN, SEO_DESC_MAX) : "",
    title.trim(),
  ].filter((value): value is string => Boolean(value?.trim()));

  let description = candidates[0] ?? "";

  if (keyword && description && !includesKeyword(description, keyword)) {
    description = `${keyword} — ${description}`;
  }

  if (description.length < SEO_DESC_MIN && title.trim()) {
    description = `${title.trim()} — ${description}`.trim();
  }

  return truncateNear(description, SEO_DESC_MAX);
}

export function buildRecommendedAltText({ title, topic }: BuildRecommendedTextInput) {
  const keyword = topic?.trim();
  const base = title.trim();
  if (!base) return keyword ?? "";

  if (keyword && !includesKeyword(base, keyword)) {
    return `${base} — ${keyword}`;
  }

  return base;
}
