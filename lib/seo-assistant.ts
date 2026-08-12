/**
 * A4 assistant orchestration — combines catalog, score, recommendations, and links.
 *
 * Dependency rule:
 *   seo-assistant → seo-check-catalog, seo-recommendations, seo-shared, seo-preview, seo-score
 *   seo-assistant ↛ seo-auto-fill | React | DB | API
 */

import { getCatalogEntry, SEO_CHECK_CATALOG_VERSION } from "@/lib/seo-check-catalog";
import type { InternalLinkSuggestion } from "@/lib/seo-internal-links";
import {
  generateRecommendation,
  type RecommendationInput,
} from "@/lib/seo-recommendations";
import {
  resolvePreviewCategoryName,
  resolvePreviewPrimaryTagName,
  type PreviewSeoFormInput,
  type PreviewSeoPayload,
} from "@/lib/seo-preview";
import { extractTopic, getScoreGapMessage } from "@/lib/seo-shared";
import type { SeoCheck, SeoScoreResult } from "@/lib/seo-score";

export const SEO_ASSISTANT_VERSION = 1;

export type { InternalLinkSuggestion };

export type BuildAssistantStateInput = {
  formState: PreviewSeoFormInput;
  previewPayload: PreviewSeoPayload;
  scoreResult: SeoScoreResult;
  internalLinkSuggestions: InternalLinkSuggestion[];
  topIssuesLimit?: number;
  linkSuggestionsStale?: boolean;
};

export type AssistantIssue = {
  checkId: string;
  status: SeoCheck["status"];
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

export type AssistantState = {
  assistantVersion: typeof SEO_ASSISTANT_VERSION;
  catalogVersion: typeof SEO_CHECK_CATALOG_VERSION;
  score: {
    seoScore: number;
    readabilityScore: number;
    band: SeoScoreResult["band"];
    scoreGapMessage: string;
  };
  issues: AssistantIssue[];
  bestImprovements: AssistantImprovement[];
  fixSuggestions: AssistantFixSuggestion[];
  showInternalLinks: boolean;
  internalLinkSuggestions: InternalLinkSuggestion[];
  linkSuggestionsStale?: boolean;
};

const STATUS_ORDER = { bad: 0, ok: 1, good: 2 } as const;

export function recoverableSeoPoints(check: SeoCheck): number {
  if (check.group !== "seo") return 0;
  if (check.status === "good") return 0;
  return check.maxWeight - check.weight;
}

export function getCatalogEntryOrSkip(checkId: string) {
  try {
    return getCatalogEntry(checkId);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      throw error;
    }
    console.error(`[SEO-A4] Unknown checkId: ${checkId}`);
    return null;
  }
}

export function resolveAssistantTopic(input: BuildAssistantStateInput): string {
  const { formState, previewPayload } = input;

  const inferred = extractTopic({
    primaryTagName: resolvePreviewPrimaryTagName({
      newTags: formState.newTags,
      tagIds: formState.tagIds,
      tags: formState.tags,
      keywords: formState.seo.keywords,
      secondaryKeywords: formState.seo.secondaryKeywords,
    }),
    title: formState.title,
    categoryName: resolvePreviewCategoryName({
      categoryId: formState.categoryId,
      promotionCategory: formState.promotionCategory,
      categories: formState.categories,
    }),
  });

  if (inferred) return inferred;

  return (
    formState.seo.focusKeyword?.trim() ||
    previewPayload.previewSeo.focusKeyword?.trim() ||
    ""
  );
}

export function toRecommendationInput(
  input: BuildAssistantStateInput,
  topic: string,
): RecommendationInput {
  const { formState, previewPayload } = input;

  return {
    title: formState.title,
    excerpt: formState.excerpt,
    content: formState.content,
    slug: previewPayload.slug,
    coverImageAlt: formState.coverImageAlt,
    topic,
    seo: {
      seoTitle: previewPayload.previewSeo.seoTitle,
      seoDescription: previewPayload.previewSeo.seoDescription,
      focusKeyword: previewPayload.previewSeo.focusKeyword,
    },
  };
}

export function buildIssues(checks: SeoCheck[], limit: number): AssistantIssue[] {
  return checks
    .filter((check) => check.status !== "good")
    .map((check) => ({ check, entry: getCatalogEntryOrSkip(check.id) }))
    .filter(
      (item): item is { check: SeoCheck; entry: NonNullable<typeof item.entry> } =>
        item.entry != null && item.entry.showInIssues,
    )
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.check.status] - STATUS_ORDER[b.check.status];
      if (statusDiff !== 0) return statusDiff;

      const priorityDiff = b.entry.issuePriority - a.entry.issuePriority;
      if (priorityDiff !== 0) return priorityDiff;

      return a.check.id.localeCompare(b.check.id);
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

export function buildBestImprovements(checks: SeoCheck[]): AssistantImprovement[] {
  return checks
    .filter((check) => check.status !== "good")
    .map((check) => ({ check, entry: getCatalogEntryOrSkip(check.id) }))
    .filter(
      (item): item is { check: SeoCheck; entry: NonNullable<typeof item.entry> } =>
        item.entry != null && item.entry.quickWinEligible,
    )
    .map(({ check, entry }) => ({
      checkId: check.id,
      actionLabel: entry.actionLabel,
      recoverablePoints: recoverableSeoPoints(check),
      reason: entry.reason,
    }))
    .filter((item) => item.recoverablePoints > 0)
    .sort((a, b) => {
      const pointsDiff = b.recoverablePoints - a.recoverablePoints;
      if (pointsDiff !== 0) return pointsDiff;

      const priorityDiff =
        getCatalogEntry(b.checkId).issuePriority - getCatalogEntry(a.checkId).issuePriority;
      if (priorityDiff !== 0) return priorityDiff;

      return a.checkId.localeCompare(b.checkId);
    });
}

export function buildFixSuggestions(
  checks: SeoCheck[],
  input: BuildAssistantStateInput,
  recommendationInput: RecommendationInput,
): AssistantFixSuggestion[] {
  // TODO(A4.1): suggestion consolidation — dedupe overlapping title fixes
  // (title-length, topic-in-title-desc, title-exists).
  return checks
    .filter((check) => check.status !== "good")
    .map((check) => ({ check, entry: getCatalogEntryOrSkip(check.id) }))
    .filter(
      (item): item is { check: SeoCheck; entry: NonNullable<typeof item.entry> } =>
        item.entry != null && item.entry.hasFixSuggestion,
    )
    .map(({ check, entry }) => {
      const generated = generateRecommendation(check.id, recommendationInput);

      return {
        checkId: check.id,
        targetField: entry.targetField ?? check.id,
        reason: entry.reason,
        current: generated.current,
        recommended: generated.recommended,
        recommendationType:
          entry.recommendationType === "field" ? "field" : "generated",
      };
    });
}

export function shouldShowLinkSuggestions(checks: SeoCheck[]): boolean {
  const linkCheck = checks.find((check) => check.id === "internal-links");
  return linkCheck != null && linkCheck.status !== "good";
}

export function buildAssistantState(input: BuildAssistantStateInput): AssistantState {
  const { scoreResult, internalLinkSuggestions, topIssuesLimit = 5 } = input;
  const topic = resolveAssistantTopic(input);
  const recommendationInput = toRecommendationInput(input, topic);

  const issues = buildIssues(scoreResult.checks, topIssuesLimit);
  const bestImprovements = buildBestImprovements(scoreResult.checks);
  const fixSuggestions = buildFixSuggestions(
    scoreResult.checks,
    input,
    recommendationInput,
  );

  const showInternalLinks = shouldShowLinkSuggestions(scoreResult.checks);

  const state: AssistantState = {
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
    showInternalLinks,
    internalLinkSuggestions: showInternalLinks ? internalLinkSuggestions : [],
  };

  if (input.linkSuggestionsStale) {
    state.linkSuggestionsStale = true;
  }

  return state;
}
