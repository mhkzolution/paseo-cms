import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SEO_COPY_FEEDBACK_MS, SeoCopyButton } from "@/features/content/seo-optimization/seo-copy-button";
import { SeoFixSuggestionsCard } from "@/features/content/seo-optimization/seo-fix-suggestions-card";
import type { AssistantFixSuggestion } from "@/lib/seo-assistant";

function suggestion(
  checkId: string,
  overrides: Partial<AssistantFixSuggestion> = {},
): AssistantFixSuggestion {
  return {
    checkId,
    targetField: `seo.${checkId}`,
    reason: `Reason for ${checkId}`,
    current: `Current ${checkId}`,
    recommended: `Recommended ${checkId}`,
    recommendationType: "generated",
    ...overrides,
  };
}

describe("SeoCopyButton", () => {
  it("uses Copy and Copied! labels per spec U1", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoCopyButton, { text: "Recommended text" }),
    );

    assert.ok(markup.includes("Copy"));
    assert.equal(markup.includes("Copy Suggestion"), false);
    assert.equal(SEO_COPY_FEEDBACK_MS, 2000);
  });
});

describe("SeoFixSuggestionsCard", () => {
  it("returns null when there are no fix suggestions", () => {
    const markup = renderToStaticMarkup(createElement(SeoFixSuggestionsCard, { items: [] }));
    assert.equal(markup, "");
  });

  it("preserves engine order without sorting", () => {
    const items = [
      suggestion("desc-length"),
      suggestion("image-alt"),
      suggestion("title-length"),
    ];

    const markup = renderToStaticMarkup(createElement(SeoFixSuggestionsCard, { items }));

    const first = markup.indexOf("seo-fix-suggestion-desc-length");
    const second = markup.indexOf("seo-fix-suggestion-image-alt");
    const third = markup.indexOf("seo-fix-suggestion-title-length");

    assert.ok(first < second && second < third);
  });

  it("renders current, recommended, reason, and copy button per row", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoFixSuggestionsCard, {
        items: [
          suggestion("desc-length", {
            current: "Too short",
            recommended: "Best coffee beans in Bangkok with rich aroma and smooth finish.",
          }),
        ],
      }),
    );

    assert.ok(markup.includes("Too short"));
    assert.ok(markup.includes("Best coffee beans in Bangkok"));
    assert.ok(markup.includes('data-testid="seo-fix-text-current"'));
    assert.ok(markup.includes('data-testid="seo-fix-text-recommended"'));
    assert.ok(markup.includes("max-h-32"));
    assert.ok(markup.includes("overflow-y-auto"));
    assert.equal((markup.match(/data-testid="seo-copy-button"/g) ?? []).length, 1);
    assert.ok(markup.includes("Copy"));
  });
});
