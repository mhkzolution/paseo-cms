import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAttentionList } from "@/lib/seo-workspace/build-attention-list";
import { buildHealthOverview } from "@/lib/seo-workspace/build-health-overview";
import { buildQuickWins } from "@/lib/seo-workspace/build-quick-wins";
import {
  parseInternalLinkCount,
  toInternalLinkCoverageLabel,
} from "@/lib/seo-workspace/internal-link-count";
import { projectSeoScore, sumRecoverablePotential } from "@/lib/seo-workspace/recoverable-potential";
import type { WorkspaceCorpusItem } from "@/lib/seo-workspace/types";
import type { SeoCheck } from "@/lib/seo-score";
import {
  filterAttentionItems,
  parseWorkspaceFilters,
} from "@/features/seo-workspace/workspace-filters";

function makeCheck(
  id: string,
  status: SeoCheck["status"],
  maxWeight: number,
  weight: number,
  tip = "",
): SeoCheck {
  return {
    id,
    label: id,
    status,
    tip,
    weight,
    maxWeight,
    group: "seo",
  };
}

function makeCorpusItem(
  overrides: Partial<WorkspaceCorpusItem> & Pick<WorkspaceCorpusItem, "id" | "title" | "contentType">,
): WorkspaceCorpusItem {
  return {
    updatedAt: new Date("2026-01-01"),
    categoryKey: null,
    branchIds: [],
    tagIds: [],
    latestAudit: null,
    ...overrides,
  };
}

describe("seo-workspace health overview", () => {
  it("calculates audit coverage and average from audited items only", () => {
    const health = buildHealthOverview([
      makeCorpusItem({
        id: "1",
        title: "A",
        contentType: "post",
        latestAudit: {
          score: 80,
          checks: [],
          analyzedAt: new Date(),
          suggestionCount: 0,
        },
      }),
      makeCorpusItem({
        id: "2",
        title: "B",
        contentType: "post",
        latestAudit: {
          score: 60,
          checks: [],
          analyzedAt: new Date(),
          suggestionCount: 0,
        },
      }),
      makeCorpusItem({ id: "3", title: "C", contentType: "event" }),
    ]);

    assert.equal(health.totalPublished, 3);
    assert.equal(health.auditedCount, 2);
    assert.equal(health.auditCoverage, 66.7);
    assert.equal(health.averageScore, 70);
  });
});

describe("seo-workspace recoverable potential", () => {
  it("sums seo-group recoverable points only", () => {
    const checks = [
      makeCheck("desc-length", "bad", 12, 0),
      makeCheck("image-alt", "bad", 14, 0),
      { ...makeCheck("sentence-length", "bad", 5, 0), group: "readability" as const },
    ];

    assert.equal(sumRecoverablePotential(checks), 26);
    assert.equal(projectSeoScore(42, 26), 68);
    assert.equal(projectSeoScore(90, 20), 100);
  });
});

describe("seo-workspace internal link count", () => {
  it("parses internal link count from audit tip", () => {
    const checks = [
      makeCheck("internal-links", "good", 10, 10, "พบลิงก์ภายใน 3 ลิงก์"),
    ];

    assert.equal(parseInternalLinkCount(checks), 3);
    assert.equal(toInternalLinkCoverageLabel(3), "3+ links");
  });

  it("returns zero links for bad internal-links check", () => {
    const checks = [makeCheck("internal-links", "bad", 10, 0, "เพิ่มลิงก์ภายในในเนื้อหา")];
    assert.equal(parseInternalLinkCount(checks), 0);
    assert.equal(toInternalLinkCoverageLabel(0), "0 links");
  });
});

describe("seo-workspace attention list", () => {
  it("sorts by lowest score then highest potential", () => {
    const attention = buildAttentionList([
      makeCorpusItem({
        id: "1",
        title: "Low",
        contentType: "post",
        latestAudit: {
          score: 61,
          analyzedAt: new Date(),
          suggestionCount: 0,
          checks: [makeCheck("desc-length", "bad", 12, 0)],
        },
      }),
      makeCorpusItem({
        id: "2",
        title: "Lower",
        contentType: "post",
        latestAudit: {
          score: 42,
          analyzedAt: new Date(),
          suggestionCount: 0,
          checks: [
            makeCheck("desc-length", "bad", 12, 0),
            makeCheck("image-alt", "bad", 14, 0),
          ],
        },
      }),
    ]);

    assert.equal(attention[0]?.seoScore, 42);
    assert.equal(attention[0]?.recoverablePotential, 26);
    assert.equal(attention[1]?.seoScore, 61);
  });
});

describe("seo-workspace quick wins", () => {
  it("aggregates quick win opportunities by check id", () => {
    const quickWins = buildQuickWins([
      makeCorpusItem({
        id: "1",
        title: "A",
        contentType: "post",
        latestAudit: {
          score: 50,
          analyzedAt: new Date(),
          suggestionCount: 0,
          checks: [makeCheck("image-alt", "bad", 14, 0)],
        },
      }),
      makeCorpusItem({
        id: "2",
        title: "B",
        contentType: "post",
        latestAudit: {
          score: 55,
          analyzedAt: new Date(),
          suggestionCount: 0,
          checks: [makeCheck("image-alt", "bad", 14, 0)],
        },
      }),
    ]);

    const imageAlt = quickWins.find((item) => item.checkId === "image-alt");
    assert.ok(imageAlt);
    assert.equal(imageAlt.affectedCount, 2);
    assert.equal(imageAlt.estimatedImpact, 14);
    assert.match(imageAlt.deepLink, /issue=image-alt/);
  });
});

describe("seo-workspace filters", () => {
  it("parses issue query param and filters attention items", () => {
    const params = new URLSearchParams("issue=image-alt&band=needs_attention");
    const filters = parseWorkspaceFilters(params);

    const items = buildAttentionList([
      makeCorpusItem({
        id: "1",
        title: "A",
        contentType: "post",
        latestAudit: {
          score: 42,
          analyzedAt: new Date(),
          suggestionCount: 0,
          checks: [makeCheck("image-alt", "bad", 14, 0)],
        },
      }),
      makeCorpusItem({
        id: "2",
        title: "B",
        contentType: "post",
        latestAudit: {
          score: 80,
          analyzedAt: new Date(),
          suggestionCount: 0,
          checks: [makeCheck("desc-length", "bad", 12, 0)],
        },
      }),
    ]);

    const filtered = filterAttentionItems(items, filters);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, "1");
  });
});
