import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  EXCELLENT_GAP_MESSAGE,
  NO_CRITICAL_BLOCKERS_MESSAGE,
  SeoScoreSummaryCard,
  getGapDisplayMessage,
  getSeoScoreBandLabel,
} from "@/features/content/seo-optimization/seo-score-summary-card";

describe("SeoScoreSummaryCard", () => {
  it("maps score to Poor, Good, and Excellent bands", () => {
    assert.equal(getSeoScoreBandLabel(50), "Poor");
    assert.equal(getSeoScoreBandLabel(69), "Poor");
    assert.equal(getSeoScoreBandLabel(70), "Good");
    assert.equal(getSeoScoreBandLabel(89), "Good");
    assert.equal(getSeoScoreBandLabel(90), "Excellent");
    assert.equal(getSeoScoreBandLabel(100), "Excellent");
  });

  it("guards gap message for excellent scores", () => {
    assert.equal(
      getGapDisplayMessage(95, "อีก 0 คะแนนจะถึง Excellent"),
      EXCELLENT_GAP_MESSAGE,
    );
    assert.equal(getGapDisplayMessage(72, "อีก 8 คะแนนจะถึง Good"), "อีก 8 คะแนนจะถึง Good");
  });

  it("renders score, band, gap message, and top blockers only", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoScoreSummaryCard, {
        score: {
          seoScore: 72,
          readabilityScore: 80,
          band: "yellow",
          scoreGapMessage: "อีก 8 คะแนนจะถึง Good",
        },
        topBlockers: [
          { checkId: "desc-length", issueLabel: "Meta Description สั้นหรือยาวเกินไป" },
          { checkId: "image-alt", issueLabel: "ไม่มี Alt Text" },
        ],
      }),
    );

    assert.ok(markup.includes('data-testid="seo-score"'));
    assert.ok(markup.includes('data-testid="seo-band"'));
    assert.ok(markup.includes('data-testid="seo-gap-message"'));
    assert.ok(markup.includes('data-testid="seo-top-blockers"'));
    assert.ok(markup.includes("72"));
    assert.ok(markup.includes("Good"));
    assert.ok(markup.includes("อีก 8 คะแนนจะถึง Good"));
    assert.ok(markup.includes("Meta Description สั้นหรือยาวเกินไป"));
    assert.equal(markup.includes("Readability"), false);
  });

  it("shows empty blockers message when there are no blockers", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoScoreSummaryCard, {
        score: {
          seoScore: 95,
          readabilityScore: 92,
          band: "green",
          scoreGapMessage: "คุณผ่านเกณฑ์สูงสุดแล้ว",
        },
        topBlockers: [],
      }),
    );

    assert.ok(markup.includes(NO_CRITICAL_BLOCKERS_MESSAGE));
    assert.ok(markup.includes(EXCELLENT_GAP_MESSAGE));
    assert.ok(markup.includes("Excellent"));
  });
});
