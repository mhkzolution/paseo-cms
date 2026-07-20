import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatBrandPartnerPlacements } from "@/lib/brand-partners";

describe("brand partners", () => {
  it("formats placement labels for active pages", () => {
    assert.deepEqual(
      formatBrandPartnerPlacements({
        showOnHome: true,
        showOnBranch1: false,
        showOnBranch2: true,
        showOnBranch3: false,
      }),
      ["หน้าหลัก", "สาขา 2"],
    );
  });
});
