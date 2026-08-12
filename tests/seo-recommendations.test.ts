import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  generateAltTextRecommendation,
  generateDescriptionRecommendation,
  generateRecommendation,
  generateTitleRecommendation,
  type RecommendationInput,
} from "@/lib/seo-recommendations";
import { hasFixSuggestion } from "@/lib/seo-check-catalog";
import { includesKeyword } from "@/lib/seo-shared";

const longExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

function baseInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    title: "Grand Opening at The Paseo Park",
    excerpt: longExcerpt,
    content: "<p>Grand opening weekend starts now at The Paseo Park.</p>",
    slug: "",
    coverImageAlt: "",
    topic: "grand opening",
    seo: {
      seoTitle: "Short",
      seoDescription: "Too short",
      focusKeyword: "",
    },
    ...overrides,
  };
}

describe("seo-recommendations", () => {
  it("generateTitleRecommendation returns current, recommended, and reason", () => {
    const result = generateTitleRecommendation(baseInput());

    assert.equal(result.current, "Short");
    assert.ok(result.recommended.length > result.current.length);
    assert.ok(result.reason.length > 10);
  });

  it("generateDescriptionRecommendation builds description within target range", () => {
    const result = generateDescriptionRecommendation(baseInput());

    assert.equal(result.current, "Too short");
    assert.ok(result.recommended.length >= 70);
    assert.ok(includesKeyword(result.recommended, "grand opening"));
  });

  it("generateAltTextRecommendation suggests title plus topic", () => {
    const result = generateAltTextRecommendation(
      baseInput({ title: "Cover Photo" }),
    );

    assert.equal(result.current, "");
    assert.equal(result.recommended, "Cover Photo — grand opening");
    assert.ok(result.reason.length > 10);
  });

  it("generateRecommendation dispatches by checkId", () => {
    const titleResult = generateRecommendation("title-length", baseInput());
    assert.equal(titleResult.current, "Short");
    assert.ok(titleResult.recommended.length > 0);

    const descResult = generateRecommendation("desc-length", baseInput());
    assert.ok(descResult.recommended.length >= 70);

    const altResult = generateRecommendation(
      "image-alt",
      baseInput({ title: "Cover Photo" }),
    );
    assert.ok(altResult.recommended.includes("grand opening"));
  });

  it("topic-in-title-desc fixes seo title when topic is missing there", () => {
    const result = generateRecommendation(
      "topic-in-title-desc",
      baseInput({
        seo: { seoTitle: "Short", seoDescription: longExcerpt, focusKeyword: "" },
      }),
    );

    assert.equal(result.current, "Short");
    assert.ok(includesKeyword(result.recommended, "grand opening"));
  });

  it("topic-clarity recommends caller-provided topic", () => {
    const cases = [
      { topic: "paseo park", expected: "paseo park" },
      { topic: "", expected: "" },
      { topic: "coffee", expected: "coffee" },
      { topic: "grand opening weekend event", expected: "grand opening weekend event" },
    ] as const;

    for (const { topic, expected } of cases) {
      const result = generateRecommendation(
        "topic-clarity",
        baseInput({
          topic,
          seo: { focusKeyword: "", seoTitle: "", seoDescription: "" },
        }),
      );

      assert.equal(result.current, "");
      assert.equal(result.recommended, expected, `topic="${topic}"`);
    }
  });

  it("slug-exists falls back to topic when title is empty", () => {
    const result = generateRecommendation(
      "slug-exists",
      baseInput({ title: "", slug: "", topic: "Coffee Beans" }),
    );

    assert.equal(result.current, "");
    assert.equal(result.recommended, "coffee-beans");
  });

  it("title-exists uses buildRecommendedTitle from topic when title is empty", () => {
    const result = generateRecommendation(
      "title-exists",
      baseInput({ title: "", topic: "Grand Opening" }),
    );

    assert.equal(result.current, "");
    assert.ok(result.recommended.length > 0);
    assert.ok(includesKeyword(result.recommended, "grand opening"));
  });

  it("throws for checks without fix suggestions", () => {
    assert.throws(
      () => generateRecommendation("internal-links", baseInput()),
      /does not support fix suggestions/,
    );
  });

  it("throws for unknown check id", () => {
    assert.throws(() => generateRecommendation("not-a-check", baseInput()), /Unknown SEO check/);
  });

  it("every hasFixSuggestion catalog entry has a generator", () => {
    const fixIds = [
      "title-length",
      "title-exists",
      "desc-length",
      "topic-in-title-desc",
      "topic-clarity",
      "image-alt",
      "slug-exists",
    ] as const;

    for (const id of fixIds) {
      assert.equal(hasFixSuggestion(id), true);
      const result = generateRecommendation(id, baseInput());
      assert.ok(result.reason.length > 10, `${id} missing reason`);
      assert.equal(typeof result.current, "string");
      assert.equal(typeof result.recommended, "string");
    }
  });
});
