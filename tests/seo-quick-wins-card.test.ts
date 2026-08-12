import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  QUICK_WINS_DISPLAY_LIMIT,
  SeoQuickWinsCard,
  buildFixSuggestionLookup,
} from "@/features/content/seo-optimization/seo-quick-wins-card";
import type { AssistantImprovement } from "@/lib/seo-assistant";

function improvement(
  checkId: string,
  recoverablePoints: number,
): AssistantImprovement {
  return {
    checkId,
    actionLabel: `Action ${checkId}`,
    recoverablePoints,
    reason: `Reason for ${checkId}`,
  };
}

describe("SeoQuickWinsCard", () => {
  it("preserves engine order and limits display to five items", () => {
    const items = Array.from({ length: 7 }, (_, index) =>
      improvement(`check-${index + 1}`, 10 - index),
    );

    const markup = renderToStaticMarkup(
      createElement(SeoQuickWinsCard, {
        items,
        fixSuggestions: [],
      }),
    );

    assert.equal((markup.match(/data-testid="seo-quick-win-check-/g) ?? []).length, QUICK_WINS_DISPLAY_LIMIT);
    assert.ok(markup.indexOf("seo-quick-win-check-1") < markup.indexOf("seo-quick-win-check-5"));
    assert.equal(markup.includes("seo-quick-win-check-6"), false);
    assert.equal(markup.includes("seo-quick-win-check-7"), false);
  });

  it("returns null when there are no quick wins", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoQuickWinsCard, {
        items: [],
        fixSuggestions: [],
      }),
    );

    assert.equal(markup, "");
  });

  it("shows copy button only when a matching fix suggestion exists", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoQuickWinsCard, {
        items: [
          improvement("image-alt", 14),
          improvement("internal-links", 10),
        ],
        fixSuggestions: [
          { checkId: "image-alt", recommended: "Cover image — grand opening" },
        ],
      }),
    );

    assert.equal((markup.match(/data-testid="seo-copy-button"/g) ?? []).length, 1);
    assert.ok(markup.includes("seo-quick-win-image-alt"));
    assert.ok(markup.includes("seo-quick-win-internal-links"));
  });

  it("buildFixSuggestionLookup maps checkId to recommended text", () => {
    const lookup = buildFixSuggestionLookup([
      { checkId: "desc-length", recommended: "Recommended description" },
    ]);

    assert.equal(lookup.get("desc-length"), "Recommended description");
    assert.equal(lookup.get("missing"), undefined);
  });
});
