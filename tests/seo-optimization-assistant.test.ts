import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  SEO_ASSISTANT_EXCELLENT_FIXTURE,
  SEO_ASSISTANT_WORKFLOW_FIXTURE,
} from "@/fixtures/seo-assistant.fixture";
import {
  SeoOptimizationAssistant,
  isExcellentAssistantState,
} from "@/features/content/seo-optimization/seo-optimization-assistant";
import type { AssistantState } from "@/lib/seo-assistant";

function renderAssistant(state: AssistantState) {
  return renderToStaticMarkup(createElement(SeoOptimizationAssistant, { state }));
}

function hasBlock(markup: string, block: string) {
  return markup.includes(`data-block="${block}"`);
}

describe("SeoOptimizationAssistant", () => {
  it("isExcellentAssistantState follows spec threshold", () => {
    assert.equal(isExcellentAssistantState(SEO_ASSISTANT_EXCELLENT_FIXTURE), true);
    assert.equal(isExcellentAssistantState(SEO_ASSISTANT_WORKFLOW_FIXTURE), false);
  });

  it("workflow fixture renders all primary blocks", () => {
    const markup = renderAssistant(SEO_ASSISTANT_WORKFLOW_FIXTURE);

    assert.ok(hasBlock(markup, "score-summary"));
    assert.ok(hasBlock(markup, "quick-wins"));
    assert.ok(hasBlock(markup, "fix-suggestions"));
    assert.ok(hasBlock(markup, "internal-links"));
    assert.ok(hasBlock(markup, "diagnostics"));
  });

  it("excellent fixture renders summary and diagnostics only", () => {
    const markup = renderAssistant(SEO_ASSISTANT_EXCELLENT_FIXTURE);

    assert.ok(hasBlock(markup, "score-summary"));
    assert.ok(hasBlock(markup, "diagnostics"));
    assert.equal(hasBlock(markup, "quick-wins"), false);
    assert.equal(hasBlock(markup, "fix-suggestions"), false);
    assert.equal(hasBlock(markup, "internal-links"), false);
    assert.ok(markup.includes("Excellent"));
    assert.equal(hasBlock(markup, "internal-links"), false);
  });

  it("does not render internal links when showInternalLinks is false", () => {
    const markup = renderAssistant({
      ...SEO_ASSISTANT_WORKFLOW_FIXTURE,
      showInternalLinks: false,
    });

    assert.equal(hasBlock(markup, "internal-links"), false);
  });
});
