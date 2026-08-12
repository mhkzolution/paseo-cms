import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SEO_ASSISTANT_EXCELLENT_FIXTURE,
  SEO_ASSISTANT_WORKFLOW_FIXTURE,
  buildWorkflowAssistantFixture,
} from "@/fixtures/seo-assistant.fixture";

describe("seo-assistant fixture", () => {
  it("exports deterministic workflow AssistantState", () => {
    const first = buildWorkflowAssistantFixture();
    const second = buildWorkflowAssistantFixture();
    assert.deepEqual(first, second);
  });

  it("workflow fixture includes score, issues, and suggestions", () => {
    assert.equal(SEO_ASSISTANT_WORKFLOW_FIXTURE.assistantVersion, 1);
    assert.equal(SEO_ASSISTANT_WORKFLOW_FIXTURE.catalogVersion, 1);
    assert.ok(SEO_ASSISTANT_WORKFLOW_FIXTURE.score.seoScore >= 0);
    assert.ok(SEO_ASSISTANT_WORKFLOW_FIXTURE.issues.length > 0);
    assert.ok(SEO_ASSISTANT_WORKFLOW_FIXTURE.fixSuggestions.length > 0);
    assert.equal(typeof SEO_ASSISTANT_WORKFLOW_FIXTURE.showInternalLinks, "boolean");
  });

  it("excellent fixture represents empty improvement blocks", () => {
    assert.equal(SEO_ASSISTANT_EXCELLENT_FIXTURE.issues.length, 0);
    assert.equal(SEO_ASSISTANT_EXCELLENT_FIXTURE.bestImprovements.length, 0);
    assert.equal(SEO_ASSISTANT_EXCELLENT_FIXTURE.fixSuggestions.length, 0);
    assert.equal(SEO_ASSISTANT_EXCELLENT_FIXTURE.showInternalLinks, false);
  });
});
