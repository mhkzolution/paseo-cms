import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SEO_ASSISTANT_WORKFLOW_FIXTURE } from "@/fixtures/seo-assistant.fixture";
import {
  SEO_ASSISTANT_DEBOUNCE_MS,
  computeSeoAssistantState,
} from "@/hooks/use-seo-assistant";
import type { PreviewSeoFormInput } from "@/lib/seo-preview";

const workflowExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

const workflowContent = `
  <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music at the mall.</p>
  <h2>What to expect</h2>
  <p>Enjoy local vendors, live shows, and mall rewards during the grand opening celebration this weekend.</p>
  <p>Visit our stores and enjoy the grand opening offers available throughout the weekend for every guest.</p>
`;

function buildWorkflowForm(overrides: Partial<PreviewSeoFormInput> = {}): PreviewSeoFormInput {
  return {
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
    contentType: "post",
    postKind: "NEWS",
    categoryId: "cat-1",
    tagIds: ["tag-1"],
    newTags: "",
    tags: [{ label: "grand opening", value: "tag-1" }],
    categories: [{ label: "Events", value: "cat-1" }],
    ...overrides,
  };
}

describe("useSeoAssistant integration", () => {
  it("uses the A2 preview pipeline before building assistant state", () => {
    const formState = buildWorkflowForm();
    const state = computeSeoAssistantState({
      formState,
      internalLinkSuggestions: SEO_ASSISTANT_WORKFLOW_FIXTURE.internalLinkSuggestions,
    });

    assert.equal(state.assistantVersion, SEO_ASSISTANT_WORKFLOW_FIXTURE.assistantVersion);
    assert.equal(state.catalogVersion, SEO_ASSISTANT_WORKFLOW_FIXTURE.catalogVersion);
    assert.equal(state.score.seoScore, SEO_ASSISTANT_WORKFLOW_FIXTURE.score.seoScore);
    assert.equal(state.issues.length, SEO_ASSISTANT_WORKFLOW_FIXTURE.issues.length);
    assert.equal(state.bestImprovements.length, SEO_ASSISTANT_WORKFLOW_FIXTURE.bestImprovements.length);
    assert.equal(state.fixSuggestions.length, SEO_ASSISTANT_WORKFLOW_FIXTURE.fixSuggestions.length);
    assert.equal(state.showInternalLinks, SEO_ASSISTANT_WORKFLOW_FIXTURE.showInternalLinks);
    assert.deepEqual(
      state.internalLinkSuggestions,
      SEO_ASSISTANT_WORKFLOW_FIXTURE.internalLinkSuggestions,
    );
  });

  it("updates score when debounced form input changes", () => {
    const weak = computeSeoAssistantState({
      formState: buildWorkflowForm({
        seo: { seoTitle: "Short", seoDescription: "Too short", focusKeyword: "" },
      }),
      internalLinkSuggestions: [],
    });

    const stronger = computeSeoAssistantState({
      formState: buildWorkflowForm({
        seo: {
          seoTitle: "Grand Opening at The Paseo Park | The Paseo",
          seoDescription:
            "Celebrate the grand opening at The Paseo Park with food, music, and family activities all weekend long at the mall.",
          focusKeyword: "grand opening",
        },
        coverImageAlt: "Grand opening crowd at The Paseo",
      }),
      internalLinkSuggestions: [],
    });

    assert.ok(stronger.score.seoScore > weak.score.seoScore);
    assert.notEqual(stronger.score.scoreGapMessage, weak.score.scoreGapMessage);
  });

  it("passes through internal link suggestions without recomputing them", () => {
    const suggestions = SEO_ASSISTANT_WORKFLOW_FIXTURE.internalLinkSuggestions;

    const state = computeSeoAssistantState({
      formState: buildWorkflowForm(),
      internalLinkSuggestions: suggestions,
      linkSuggestionsStale: true,
    });

    assert.deepEqual(state.internalLinkSuggestions, suggestions);
    assert.equal(state.linkSuggestionsStale, true);
  });

  it("is deterministic for identical inputs", () => {
    const input = {
      formState: buildWorkflowForm(),
      internalLinkSuggestions: SEO_ASSISTANT_WORKFLOW_FIXTURE.internalLinkSuggestions,
      linkSuggestionsStale: false,
    };

    const first = computeSeoAssistantState(input);
    const second = computeSeoAssistantState(input);

    assert.deepEqual(first, second);
  });

  it("exposes the spec debounce interval", () => {
    assert.equal(SEO_ASSISTANT_DEBOUNCE_MS, 300);
  });
});
