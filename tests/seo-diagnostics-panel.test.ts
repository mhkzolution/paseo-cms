import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DIAGNOSTICS_EMPTY_MESSAGE,
  SeoDiagnosticsPanel,
} from "@/features/content/seo-optimization/seo-diagnostics-panel";
import type { AssistantIssue } from "@/lib/seo-assistant";

function issue(
  overrides: Partial<AssistantIssue> & Pick<AssistantIssue, "checkId" | "issueLabel">,
): AssistantIssue {
  return {
    status: "bad",
    reason: `Reason for ${overrides.checkId}`,
    issuePriority: 10,
    ...overrides,
  };
}

describe("SeoDiagnosticsPanel", () => {
  it("is collapsed by default with issue count in the header", () => {
    const items = [
      issue({ checkId: "desc-length", issueLabel: "ความยาว meta description" }),
      issue({ checkId: "internal-links", issueLabel: "ลิงก์ภายใน", status: "ok" }),
      issue({ checkId: "image-alt", issueLabel: "รูปปก + alt text" }),
    ];

    const markup = renderToStaticMarkup(createElement(SeoDiagnosticsPanel, { issues: items }));

    assert.ok(markup.includes('data-testid="seo-diagnostics-details"'));
    assert.equal(markup.includes(' open'), false);
    assert.ok(markup.includes("Diagnostics (3)"));
  });

  it("renders issue label, status, and reason when expanded content is present", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoDiagnosticsPanel, {
        issues: [
          issue({
            checkId: "desc-length",
            issueLabel: "ความยาว meta description",
            status: "bad",
            reason: "คำอธิบายสั้นเกินไป",
          }),
          issue({
            checkId: "image-alt",
            issueLabel: "รูปปก + alt text",
            status: "ok",
            reason: "ยังไม่มี alt text",
          }),
        ],
      }),
    );

    assert.ok(markup.includes("ความยาว meta description"));
    assert.ok(markup.includes("รูปปก + alt text"));
    assert.ok(markup.includes("คำอธิบายสั้นเกินไป"));
    assert.ok(markup.includes("ยังไม่มี alt text"));
    assert.equal((markup.match(/data-testid="seo-diagnostics-status"/g) ?? []).length, 2);
    assert.ok(markup.includes(">bad<"));
    assert.ok(markup.includes(">ok<"));
    assert.equal(markup.includes("seo-copy-button"), false);
    assert.equal(markup.includes("Current"), false);
    assert.equal(markup.includes("Recommended"), false);
  });

  it("shows empty message while keeping the panel visible", () => {
    const markup = renderToStaticMarkup(createElement(SeoDiagnosticsPanel, { issues: [] }));

    assert.ok(markup.includes('data-testid="seo-diagnostics-panel"'));
    assert.ok(markup.includes("Diagnostics (0)"));
    assert.ok(markup.includes(DIAGNOSTICS_EMPTY_MESSAGE));
    assert.equal(markup.includes('data-testid="seo-diagnostics-issue-'), false);
  });

  it("applies scroll contract to the panel body only", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoDiagnosticsPanel, {
        issues: [issue({ checkId: "desc-length", issueLabel: "ความยาว meta description" })],
      }),
    );

    assert.match(
      markup,
      /class="[^"]*max-h-\[400px\][^"]*overflow-y-auto[^"]*"[^>]*data-testid="seo-diagnostics-body"/,
    );

    const summaryMarkup = markup.match(
      /<summary[^>]*data-testid="seo-diagnostics-summary"[^>]*>[\s\S]*?<\/summary>/,
    )?.[0];

    assert.ok(summaryMarkup);
    assert.equal(summaryMarkup.includes("max-h-[400px]"), false);
    assert.equal(summaryMarkup.includes("overflow-y-auto"), false);
  });
});
