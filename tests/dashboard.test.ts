import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPlatformPulse } from "@/lib/dashboard/build-platform-pulse";
import { buildSeoOverview } from "@/lib/dashboard/build-seo-overview";
import { buildContentHealth } from "@/lib/dashboard/build-content-health";
import type { ContentInventory } from "@/lib/dashboard/types";
import type { SeoWorkspaceHealth } from "@/lib/seo-workspace/types";

const inventory: ContentInventory = {
  posts: { total: 100, published: 80, draft: 20 },
  events: { total: 20, published: 15, draft: 5 },
  promotions: { total: 10, published: 5, draft: 5 },
};

const workspaceHealth: SeoWorkspaceHealth = {
  totalPublished: 100,
  averageScore: 74,
  auditCoverage: 78,
  auditedCount: 78,
  excellentCount: 14,
  needsAttentionCount: 24,
};

describe("dashboard platform pulse", () => {
  it("computes published percent from inventory rollup", () => {
    const pulse = buildPlatformPulse(inventory, workspaceHealth);

    assert.equal(pulse.posts, 100);
    assert.equal(pulse.totalCount, 130);
    assert.equal(pulse.publishedCount, 100);
    assert.equal(pulse.publishedPercent, 76.9);
    assert.equal(pulse.auditCoveragePercent, 78);
    assert.equal(pulse.averageSeoScore, 74);
  });
});

describe("dashboard seo overview", () => {
  it("matches workspace health metrics", () => {
    const overview = buildSeoOverview(workspaceHealth);

    assert.equal(overview.averageScore, 74);
    assert.equal(overview.coveragePercent, 78);
    assert.equal(overview.needsAttentionCount, 24);
    assert.equal(overview.excellentPercent, 17.9);
    assert.equal(overview.needsAttentionPercent, 30.8);
  });
});

describe("dashboard content health", () => {
  it("returns top quick win issues", () => {
    const health = buildContentHealth([
      {
        checkId: "image-alt",
        issue: "Add alt text",
        affectedCount: 84,
        estimatedImpact: 14,
        deepLink: "/admin/seo/workspace?issue=image-alt",
      },
      {
        checkId: "desc-length",
        issue: "Add description",
        affectedCount: 112,
        estimatedImpact: 12,
        deepLink: "/admin/seo/workspace?issue=desc-length",
      },
    ]);

    assert.equal(health[0]?.checkId, "desc-length");
    assert.equal(health[0]?.count, 112);
  });
});
