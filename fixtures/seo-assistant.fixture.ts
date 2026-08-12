import { buildAssistantState } from "@/lib/seo-assistant";
import type { AssistantState } from "@/lib/seo-assistant";
import type { InternalLinkSuggestion } from "@/lib/seo-internal-links";
import { buildPreviewSeoPayload } from "@/lib/seo-preview";
import { analyzeSeoScore } from "@/lib/seo-score";

const workflowExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

const workflowContent = `
  <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music at the mall.</p>
  <h2>What to expect</h2>
  <p>Enjoy local vendors, live shows, and mall rewards during the grand opening celebration this weekend.</p>
  <p>Visit our stores and enjoy the grand opening offers available throughout the weekend for every guest.</p>
`;

const mockInternalLinkSuggestions: InternalLinkSuggestion[] = [
  {
    title: "Summer Food Festival",
    href: "/events/summer-food-festival",
    contentType: "event",
    reason: "Same category · Shares 2 tags · SEO Score 88",
    source: "db",
    tier: "A",
    rankScore: 95,
  },
  {
    title: "Weekend Buffet Promo",
    href: "/promotions/weekend-buffet",
    contentType: "promotion",
    reason: "Shares 1 tags · SEO Score 82",
    source: "db",
    tier: "A",
    rankScore: 72,
  },
  {
    title: "ดูข่าวสารทั้งหมด",
    href: "/news",
    contentType: "hub",
    reason: "Explore all news",
    source: "hub",
  },
];

export function buildWorkflowAssistantFixture(): AssistantState {
  const formState = {
    title: "Grand Opening at The Paseo Park",
    excerpt: workflowExcerpt,
    content: workflowContent,
    featuredImage: "/uploads/cover.jpg",
    coverImageAlt: "",
    slug: "grand-opening-paseo",
    seo: {
      seoTitle: "Short",
      seoDescription: "Too short",
      focusKeyword: "",
    },
    contentType: "post" as const,
    postKind: "NEWS" as const,
    categoryId: "cat-1",
    tagIds: ["tag-1"],
    newTags: "",
    tags: [{ label: "grand opening", value: "tag-1" }],
    categories: [{ label: "Events", value: "cat-1" }],
  };

  const previewPayload = buildPreviewSeoPayload(formState);
  const scoreResult = analyzeSeoScore(previewPayload.scoreInput);

  return buildAssistantState({
    formState,
    previewPayload,
    scoreResult,
    internalLinkSuggestions: mockInternalLinkSuggestions,
  });
}

/** Golden AssistantState for UI development, Storybook, and snapshot tests. */
export const SEO_ASSISTANT_WORKFLOW_FIXTURE: AssistantState = buildWorkflowAssistantFixture();

/** Minimal excellent-score state — hides quick wins and fix suggestions in UI. */
export const SEO_ASSISTANT_EXCELLENT_FIXTURE: AssistantState = {
  assistantVersion: 1,
  catalogVersion: 1,
  score: {
    seoScore: 95,
    readabilityScore: 92,
    band: "green",
    scoreGapMessage: "คุณผ่านเกณฑ์สูงสุดแล้ว",
  },
  issues: [],
  bestImprovements: [],
  fixSuggestions: [],
  showInternalLinks: false,
  internalLinkSuggestions: [],
};
