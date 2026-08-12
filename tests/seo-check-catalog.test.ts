import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SEO_CHECK_CATALOG,
  SEO_CHECK_CATALOG_VERSION,
  RECOMMENDATION_TYPES,
  getCatalogCheckIds,
  getCatalogEntry,
  hasFixSuggestion,
  isQuickWin,
} from "@/lib/seo-check-catalog";
import { analyzeSeoScore } from "@/lib/seo-score";

describe("seo-check-catalog", () => {
  it("exports catalog version 1", () => {
    assert.equal(SEO_CHECK_CATALOG_VERSION, 1);
  });

  it("has 17 catalog entries", () => {
    assert.equal(getCatalogCheckIds().length, 17);
  });

  it("covers every check id emitted by analyzeSeoScore", () => {
    const result = analyzeSeoScore({
      title: "",
      slug: "",
      content: "",
      contentType: "post",
    });

    for (const check of result.checks) {
      assert.doesNotThrow(() => getCatalogEntry(check.id), `missing catalog entry for ${check.id}`);
      assert.equal(getCatalogEntry(check.id).maxWeight, check.maxWeight);
    }
  });

  it("throws for unknown check id", () => {
    assert.throws(() => getCatalogEntry("schema-markup"), /Unknown SEO check: schema-markup/);
  });

  it("seo maxWeight values sum to 100", () => {
    const seoTotal = getCatalogCheckIds()
      .map((id) => getCatalogEntry(id))
      .filter((entry) => entry.group === "seo")
      .reduce((sum, entry) => sum + entry.maxWeight, 0);

    assert.equal(seoTotal, 100);
  });

  it("readability entries are not quick-win eligible", () => {
    for (const id of getCatalogCheckIds()) {
      const entry = getCatalogEntry(id);
      if (entry.group === "readability") {
        assert.equal(entry.quickWinEligible, false);
        assert.equal(isQuickWin(id), false);
      }
    }
  });

  it("hasFixSuggestion is true only for generated and field types", () => {
    for (const id of getCatalogCheckIds()) {
      const entry = getCatalogEntry(id);
      if (entry.hasFixSuggestion) {
        assert.ok(
          entry.recommendationType === "generated" || entry.recommendationType === "field",
          `${id} hasFixSuggestion but type is ${entry.recommendationType}`,
        );
        assert.equal(hasFixSuggestion(id), true);
      }
    }
  });

  it("every entry has issuePriority and reason", () => {
    for (const id of getCatalogCheckIds()) {
      const entry = SEO_CHECK_CATALOG[id];
      assert.ok(entry.issuePriority > 0, `${id} missing issuePriority`);
      assert.ok(entry.reason.trim().length > 10, `${id} reason too short`);
      assert.ok(entry.issueLabel.trim().length > 0, `${id} missing issueLabel`);
      assert.ok(entry.actionLabel.trim().length > 0, `${id} missing actionLabel`);
      assert.ok(
        RECOMMENDATION_TYPES.includes(entry.recommendationType),
        `${id} invalid recommendationType`,
      );
    }
  });

  it("topic-in-content is quick-win eligible without fix suggestion", () => {
    const entry = getCatalogEntry("topic-in-content");
    assert.equal(entry.quickWinEligible, true);
    assert.equal(entry.hasFixSuggestion, false);
    assert.equal(entry.recommendationType, "content");
  });
});
