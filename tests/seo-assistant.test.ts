import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAssistantState,
  buildBestImprovements,
  buildIssues,
  recoverableSeoPoints,
  shouldShowLinkSuggestions,
} from "@/lib/seo-assistant";
import { buildPreviewSeoPayload } from "@/lib/seo-preview";
import { analyzeSeoScore } from "@/lib/seo-score";
import type { PreviewSeoFormInput } from "@/lib/seo-preview";

const workflowExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

const workflowContent = `
  <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music at the mall.</p>
  <h2>What to expect</h2>
  <p>Enjoy local vendors, live shows, and mall rewards during the grand opening celebration this weekend.</p>
  <p>Visit our stores and enjoy the grand opening offers available throughout the weekend for every guest.</p>
`;

const editorTags = [{ label: "grand opening", value: "tag-1" }];
const editorCategories = [{ label: "Events", value: "cat-1" }];

function buildWorkflowForm(overrides: Partial<PreviewSeoFormInput> = {}): PreviewSeoFormInput {
  return {
    title: "Grand Opening at The Paseo Park",
    excerpt: workflowExcerpt,
    content: workflowContent,
    featuredImage: "/uploads/cover.jpg",
    coverImageAlt: "Grand opening crowd at The Paseo",
    slug: "grand-opening-paseo",
    seo: {},
    contentType: "post",
    postKind: "NEWS",
    categoryId: "cat-1",
    tagIds: ["tag-1"],
    newTags: "",
    tags: editorTags,
    categories: editorCategories,
    ...overrides,
  };
}

function buildWorkflowAssistantState(overrides: Partial<PreviewSeoFormInput> = {}) {
  const formState = buildWorkflowForm(overrides);
  const previewPayload = buildPreviewSeoPayload(formState);
  const scoreResult = analyzeSeoScore(previewPayload.scoreInput);

  return buildAssistantState({
    formState,
    previewPayload,
    scoreResult,
    internalLinkSuggestions: [
      {
        title: "Related Event",
        href: "/events/related",
        contentType: "event",
        reason: "Same category",
        source: "db",
      },
    ],
  });
}

describe("seo-assistant", () => {
  it("recoverableSeoPoints returns maxWeight for bad seo checks", () => {
    const scoreResult = analyzeSeoScore({
      title: "",
      content: "",
      contentType: "post",
    });
    const descCheck = scoreResult.checks.find((check) => check.id === "desc-length");
    assert.ok(descCheck);
    assert.equal(recoverableSeoPoints(descCheck), descCheck.maxWeight);
  });

  it("recoverableSeoPoints returns zero for readability checks", () => {
    const scoreResult = analyzeSeoScore({
      title: "",
      content: "",
      contentType: "post",
    });
    const readabilityCheck = scoreResult.checks.find((check) => check.id === "sentence-length");
    assert.ok(readabilityCheck);
    assert.equal(recoverableSeoPoints(readabilityCheck), 0);
  });

  it("buildIssues filters good checks and respects showInIssues", () => {
    const scoreResult = analyzeSeoScore({
      title: "",
      content: "",
      contentType: "post",
    });

    const issues = buildIssues(scoreResult.checks, 5);
    assert.ok(issues.length > 0);
    assert.ok(issues.every((issue) => issue.status !== "good"));
    assert.ok(issues.every((issue) => issue.reason.length > 10));
  });

  it("buildBestImprovements sorts by recoverable points descending", () => {
    const scoreResult = analyzeSeoScore({
      title: "",
      content: "",
      contentType: "post",
    });

    const improvements = buildBestImprovements(scoreResult.checks);
    assert.ok(improvements.length > 0);
    for (let index = 1; index < improvements.length; index += 1) {
      assert.ok(
        improvements[index - 1].recoverablePoints >= improvements[index].recoverablePoints,
      );
    }
  });

  it("buildIssues sorts bad before ok then issuePriority DESC", () => {
    const checks = [
      {
        id: "title-length",
        label: "title",
        status: "ok" as const,
        tip: "",
        weight: 6,
        maxWeight: 12,
        group: "seo" as const,
      },
      {
        id: "topic-in-title-desc",
        label: "topic",
        status: "bad" as const,
        tip: "",
        weight: 0,
        maxWeight: 8,
        group: "seo" as const,
      },
    ];

    const issues = buildIssues(checks, 5);
    assert.equal(issues[0]?.checkId, "topic-in-title-desc");
    assert.equal(issues[1]?.checkId, "title-length");
  });

  it("buildAssistantState sets showInternalLinks explicitly", () => {
    const state = buildWorkflowAssistantState();
    assert.equal(typeof state.showInternalLinks, "boolean");

    if (state.showInternalLinks) {
      assert.ok(state.internalLinkSuggestions.length >= 0);
    } else {
      assert.equal(state.internalLinkSuggestions.length, 0);
    }
  });

  it("shouldShowLinkSuggestions is true when internal-links is not good", () => {
    const scoreResult = analyzeSeoScore({
      title: "Test",
      content: "<p>Short</p>",
      contentType: "post",
    });
    const linkCheck = scoreResult.checks.find((check) => check.id === "internal-links");
    assert.ok(linkCheck);
    assert.equal(shouldShowLinkSuggestions(scoreResult.checks), linkCheck.status !== "good");
  });

  it("buildAssistantState returns stable shape for workflow post", () => {
    const state = buildWorkflowAssistantState();

    assert.equal(state.assistantVersion, 1);
    assert.equal(state.catalogVersion, 1);
    assert.ok(state.score.seoScore >= 0);
    assert.ok(state.score.scoreGapMessage.length > 0);
    assert.equal(typeof state.score.band, "string");
  });

  it("buildAssistantState includes fix suggestions only for failing fixable checks", () => {
    const state = buildWorkflowAssistantState({
      seo: { seoTitle: "Short", seoDescription: "Too short" },
    });

    assert.ok(state.fixSuggestions.length > 0);
    assert.ok(
      state.fixSuggestions.every(
        (suggestion) =>
          suggestion.current !== undefined &&
          suggestion.recommended !== undefined &&
          suggestion.reason.length > 10,
      ),
    );
  });

  it("buildAssistantState hides internal links when link check is good", () => {
    const state = buildWorkflowAssistantState();
    const linkCheck = analyzeSeoScore(buildPreviewSeoPayload(buildWorkflowForm()).scoreInput)
      .checks.find((check) => check.id === "internal-links");

    if (linkCheck?.status === "good") {
      assert.equal(state.showInternalLinks, false);
      assert.equal(state.internalLinkSuggestions.length, 0);
    } else {
      assert.equal(state.showInternalLinks, true);
      assert.ok(state.internalLinkSuggestions.length > 0);
    }
  });

  it("buildAssistantState is deterministic for identical inputs", () => {
    const first = buildWorkflowAssistantState();
    const second = buildWorkflowAssistantState();
    assert.deepEqual(first, second);
  });
});
