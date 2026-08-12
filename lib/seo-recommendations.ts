/**
 * A4 recommendation rule engine — HOW layer (pure TypeScript, no React/UI).
 *
 * Dependency rule:
 *   seo-recommendations → seo-check-catalog, seo-shared, lib/seo (generateSlug)
 *   seo-recommendations ↛ seo-auto-fill | seo-preview | seo-assistant
 */

import { getCatalogEntry } from "@/lib/seo-check-catalog";
import { generateSlug } from "@/lib/seo";
import {
  buildRecommendedAltText,
  buildRecommendedDescription,
  buildRecommendedTitle,
  includesKeyword,
} from "@/lib/seo-shared";

export type RecommendationResult = {
  current: string;
  recommended: string;
  reason: string;
};

export type RecommendationInput = {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  slug?: string | null;
  coverImageAlt?: string | null;
  /** Resolved by caller via `extractTopic()` — never inferred inside this module. */
  topic: string;
  seo: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    focusKeyword?: string | null;
  };
};

const FIX_SUGGESTION_CHECK_IDS = [
  "title-length",
  "desc-length",
  "topic-in-title-desc",
  "topic-clarity",
  "image-alt",
  "title-exists",
  "slug-exists",
] as const;

export type FixSuggestionCheckId = (typeof FIX_SUGGESTION_CHECK_IDS)[number];

function isFixSuggestionCheckId(checkId: string): checkId is FixSuggestionCheckId {
  return (FIX_SUGGESTION_CHECK_IDS as readonly string[]).includes(checkId);
}

export function generateTitleRecommendation(input: RecommendationInput): RecommendationResult {
  const entry = getCatalogEntry("title-length");
  const current = input.seo.seoTitle?.trim() ?? "";
  const sourceTitle = current || input.title.trim();

  return {
    current,
    recommended: buildRecommendedTitle({ title: sourceTitle, topic: input.topic }),
    reason: entry.reason,
  };
}

export function generateDescriptionRecommendation(
  input: RecommendationInput,
): RecommendationResult {
  const entry = getCatalogEntry("desc-length");
  const current = input.seo.seoDescription?.trim() ?? "";

  return {
    current,
    recommended: buildRecommendedDescription({
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      topic: input.topic,
    }),
    reason: entry.reason,
  };
}

export function generateAltTextRecommendation(input: RecommendationInput): RecommendationResult {
  const entry = getCatalogEntry("image-alt");
  const current = input.coverImageAlt?.trim() ?? "";

  return {
    current,
    recommended: buildRecommendedAltText({
      title: input.title,
      topic: input.topic,
    }),
    reason: entry.reason,
  };
}

function generateTopicInTitleDescRecommendation(
  input: RecommendationInput,
): RecommendationResult {
  const entry = getCatalogEntry("topic-in-title-desc");
  const topic = input.topic.trim();
  const seoTitle = input.seo.seoTitle?.trim() || input.title.trim();
  const seoDescription = input.seo.seoDescription?.trim() ?? "";

  if (topic && !includesKeyword(seoTitle, topic)) {
    return {
      current: seoTitle,
      recommended: buildRecommendedTitle({ title: seoTitle, topic }),
      reason: entry.reason,
    };
  }

  return {
    current: seoDescription,
    recommended: buildRecommendedDescription({
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      topic,
    }),
    reason: entry.reason,
  };
}

function generateTopicClarityRecommendation(input: RecommendationInput): RecommendationResult {
  const entry = getCatalogEntry("topic-clarity");

  return {
    current: input.seo.focusKeyword?.trim() ?? "",
    recommended: input.topic.trim(),
    reason: entry.reason,
  };
}

function generateTitleExistsRecommendation(input: RecommendationInput): RecommendationResult {
  const entry = getCatalogEntry("title-exists");
  const current = input.title.trim();
  const sourceTitle = current || input.topic.trim();

  return {
    current,
    recommended: buildRecommendedTitle({ title: sourceTitle, topic: input.topic }),
    reason: entry.reason,
  };
}

function generateSlugRecommendation(input: RecommendationInput): RecommendationResult {
  const entry = getCatalogEntry("slug-exists");
  const current = input.slug?.trim() ?? "";
  const slugSource = input.title.trim() || input.topic.trim();
  const recommended = slugSource ? generateSlug(slugSource) : "";

  return {
    current,
    recommended,
    reason: entry.reason,
  };
}

export function generateRecommendation(
  checkId: string,
  input: RecommendationInput,
): RecommendationResult {
  const entry = getCatalogEntry(checkId);

  if (!entry.hasFixSuggestion) {
    throw new Error(`[SEO-A4] Check "${checkId}" does not support fix suggestions`);
  }

  if (!isFixSuggestionCheckId(checkId)) {
    throw new Error(`[SEO-A4] No recommendation generator for checkId: ${checkId}`);
  }

  switch (checkId) {
    case "title-length":
      return generateTitleRecommendation(input);
    case "desc-length":
      return generateDescriptionRecommendation(input);
    case "topic-in-title-desc":
      return generateTopicInTitleDescRecommendation(input);
    case "topic-clarity":
      return generateTopicClarityRecommendation(input);
    case "image-alt":
      return generateAltTextRecommendation(input);
    case "title-exists":
      return generateTitleExistsRecommendation(input);
    case "slug-exists":
      return generateSlugRecommendation(input);
    default:
      throw new Error(`[SEO-A4] No recommendation generator for checkId: ${checkId}`);
  }
}
