import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeSeoAssistantState } from "@/hooks/use-seo-assistant";
import type { PreviewSeoFormInput } from "@/lib/seo-preview";

const LARGE_CONTENT_CHARS = 7_500;

function buildLargeContent(charCount: number): string {
  const paragraph =
    "<p>Grand opening weekend at The Paseo Park brings food, music, and family activities across the mall.</p>";
  let content = "";

  while (content.length < charCount) {
    content += paragraph;
  }

  return content.slice(0, charCount);
}

function buildLargeForm(content: string): PreviewSeoFormInput {
  return {
    title: "Grand Opening at The Paseo Park",
    excerpt: "Celebrate the grand opening with food, music, and family activities all weekend long.",
    content,
    featuredImage: "/uploads/cover.jpg",
    coverImageAlt: "Grand opening crowd at The Paseo",
    slug: "grand-opening-paseo",
    seo: {
      seoTitle: "Grand Opening at The Paseo Park | The Paseo",
      seoDescription:
        "Celebrate the grand opening at The Paseo Park with food, music, and family activities all weekend long at the mall.",
      focusKeyword: "grand opening",
    },
    contentType: "post",
    postKind: "NEWS",
    categoryId: "cat-1",
    tagIds: ["tag-1"],
    newTags: "",
    tags: [{ label: "grand opening", value: "tag-1" }],
    categories: [{ label: "Events", value: "cat-1" }],
  };
}

describe("useSeoAssistant large content", () => {
  it("computes assistant state for 5000-10000 char content without crashing", () => {
    const content = buildLargeContent(LARGE_CONTENT_CHARS);
    assert.ok(content.length >= 5_000);
    assert.ok(content.length <= 10_000);

    const state = computeSeoAssistantState({
      formState: buildLargeForm(content),
      internalLinkSuggestions: [],
    });

    assert.equal(typeof state.score.seoScore, "number");
    assert.ok(state.score.seoScore >= 0 && state.score.seoScore <= 100);
    assert.equal(state.assistantVersion, 1);
    assert.equal(typeof state.score.scoreGapMessage, "string");
    assert.ok(state.score.scoreGapMessage.length > 0);
    assert.equal(Array.isArray(state.issues), true);
    assert.equal(Array.isArray(state.bestImprovements), true);
    assert.equal(Array.isArray(state.fixSuggestions), true);
  });

  it("remains deterministic for large content inputs", () => {
    const content = buildLargeContent(LARGE_CONTENT_CHARS);
    const input = {
      formState: buildLargeForm(content),
      internalLinkSuggestions: [],
    };

    const first = computeSeoAssistantState(input);
    const second = computeSeoAssistantState(input);

    assert.deepEqual(first, second);
  });
});
