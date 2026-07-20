import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

const WORDS_PER_MINUTE = 220;

/**
 * Build a URL slug that keeps Thai (and other) combining marks intact.
 * Latin diacritics are stripped (café → cafe); Thai vowels/tone marks are preserved
 * so "พาซิโอ" stays "พาซิโอ" instead of becoming "พาซ-โอ".
 */
export function generateSlug(value: string) {
  return value
    .normalize("NFKD")
    // Strip only Latin combining diacritics (U+0300–036F), not Thai marks.
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\p{M}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function estimateReadingTime(content: string) {
  const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plainText) return 1;

  const words = plainText.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function splitKeywords(value: string | null | undefined) {
  if (!value) return [];

  return value
    .split(/[,;、|]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function parseJsonObject(value: string | null | undefined): Prisma.InputJsonValue | null {
  if (!value) return null;

  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON-LD must be a JSON object.");
  }

  return parsed as Prisma.InputJsonValue;
}

function toMaxImagePreview(value: string | null | undefined) {
  return value === "none" || value === "standard" || value === "large" ? value : undefined;
}

export function buildRobots({
  noindex,
  nofollow,
  noarchive,
  nosnippet,
  maxSnippet,
  maxImagePreview,
  maxVideoPreview,
}: {
  noindex?: boolean | null;
  nofollow?: boolean | null;
  noarchive?: boolean | null;
  nosnippet?: boolean | null;
  maxSnippet?: number | null;
  maxImagePreview?: string | null;
  maxVideoPreview?: number | null;
}): Metadata["robots"] {
  return {
    index: !noindex,
    follow: !nofollow,
    nocache: Boolean(noarchive),
    googleBot: {
      index: !noindex,
      follow: !nofollow,
      noimageindex: false,
      "max-snippet": nosnippet ? 0 : (maxSnippet ?? undefined),
      "max-image-preview": toMaxImagePreview(maxImagePreview),
      "max-video-preview": maxVideoPreview ?? undefined,
    },
  };
}

export function toAbsoluteUrl(baseUrl: string, pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = baseUrl.replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function escapeXml(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
