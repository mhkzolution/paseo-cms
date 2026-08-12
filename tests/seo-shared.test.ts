import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  A4_PROGRESS_MILESTONES,
  buildRecommendedAltText,
  buildRecommendedDescription,
  buildRecommendedTitle,
  calculateDisplayBand,
  extractTopic,
  getScoreGapMessage,
  includesKeyword,
  normalizeKeyword,
  stripHtml,
  truncateNear,
} from "@/lib/seo-shared";

describe("seo-shared", () => {
  it("normalizeKeyword trims and lowercases", () => {
    assert.equal(normalizeKeyword("  Grand Opening  "), "grand opening");
  });

  it("includesKeyword is case-insensitive", () => {
    assert.equal(includesKeyword("Grand Opening at The Paseo", "grand opening"), true);
    assert.equal(includesKeyword("Grand Opening", "paseo"), false);
  });

  it("stripHtml removes tags and entities", () => {
    assert.equal(stripHtml("<p>Hello &amp; <strong>world</strong></p>"), "Hello & world");
  });

  it("extractTopic prefers tag over title", () => {
    assert.equal(
      extractTopic({
        primaryTagName: "grand opening",
        title: "Event Title",
        categoryName: "News",
      }),
      "grand opening",
    );
  });

  it("calculateDisplayBand maps milestones", () => {
    assert.equal(calculateDisplayBand(50).band, "needs_attention");
    assert.equal(calculateDisplayBand(50).nextMilestone, A4_PROGRESS_MILESTONES.fair);
    assert.equal(calculateDisplayBand(50).gap, 20);

    assert.equal(calculateDisplayBand(75).band, "fair");
    assert.equal(calculateDisplayBand(75).nextMilestone, A4_PROGRESS_MILESTONES.good);

    assert.equal(calculateDisplayBand(85).band, "good");
    assert.equal(calculateDisplayBand(85).nextMilestone, A4_PROGRESS_MILESTONES.excellent);

    assert.equal(calculateDisplayBand(95).band, "excellent");
    assert.equal(calculateDisplayBand(95).nextMilestone, null);
    assert.equal(calculateDisplayBand(95).gap, null);
  });

  it("getScoreGapMessage handles milestone boundaries without off-by-one", () => {
    assert.equal(getScoreGapMessage(69), "อีก 1 คะแนนจะถึง Fair");
    assert.equal(getScoreGapMessage(70), "อีก 10 คะแนนจะถึง Good");
    assert.equal(getScoreGapMessage(79), "อีก 1 คะแนนจะถึง Good");
    assert.equal(getScoreGapMessage(80), "อีก 10 คะแนนจะถึง Excellent");
    assert.equal(getScoreGapMessage(89), "อีก 1 คะแนนจะถึง Excellent");
    assert.equal(getScoreGapMessage(90), "คุณผ่านเกณฑ์สูงสุดแล้ว");
  });

  it("truncateNear handles edge lengths", () => {
    const text = "Grand Opening at The Paseo Park Mall";

    assert.equal(truncateNear(text, text.length), text);
    assert.ok(truncateNear(text, text.length + 1).length <= text.length + 1);
    assert.equal(truncateNear(text, 0), "");
    assert.equal(truncateNear("", 60), "");
    assert.equal(truncateNear("   ", 60), "");
  });

  it("buildRecommendedTitle injects topic when missing", () => {
    const title = buildRecommendedTitle({
      title: "Grand Opening Event",
      topic: "paseo park",
    });
    assert.ok(includesKeyword(title, "paseo park"));
  });

  it("buildRecommendedDescription uses excerpt and topic", () => {
    const description = buildRecommendedDescription({
      title: "Grand Opening",
      excerpt:
        "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long.",
      topic: "grand opening",
    });
    assert.ok(description.length >= 70);
    assert.ok(includesKeyword(description, "grand opening"));
  });

  it("buildRecommendedAltText combines title and topic", () => {
    assert.equal(
      buildRecommendedAltText({
        title: "Cover Image",
        topic: "grand opening",
      }),
      "Cover Image — grand opening",
    );
  });
});
