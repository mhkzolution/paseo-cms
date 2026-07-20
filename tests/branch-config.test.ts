import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BRANCH_CONFIG, BRANCH_SLUGS, getBranchConfig, isBranchSlug } from "@/lib/branches/branch-config";

describe("branch config", () => {
  it("defines all three branch slugs", () => {
    assert.deepEqual(BRANCH_SLUGS, ["mall", "park", "town"]);
  });

  it("returns config for known slugs", () => {
    const mall = getBranchConfig("mall");
    assert.equal(mall.slug, "mall");
    assert.equal(mall.theme.mood, "shopping");
    assert.ok(mall.sections.includes("hero"));
  });

  it("rejects unknown slugs", () => {
    assert.equal(isBranchSlug("unknown"), false);
    assert.throws(() => getBranchConfig("unknown"), /Unknown branch slug/);
  });

  it("uses distinct primary colors per branch", () => {
    const colors = BRANCH_SLUGS.map((slug) => getBranchConfig(slug).theme.primary);
    assert.equal(new Set(colors).size, 3);
  });

  it("exports config for every slug", () => {
    for (const slug of BRANCH_SLUGS) {
      assert.ok(BRANCH_CONFIG[slug]);
    }
  });
});
