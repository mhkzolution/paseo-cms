import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canLoadAnalytics,
  canLoadMarketing,
} from "@/components/integrations/consent-gates";

describe("consent gates", () => {
  it("undecided loads nothing", () => {
    assert.equal(canLoadAnalytics(null), false);
    assert.equal(canLoadMarketing(null), false);
  });

  it("necessary-only loads nothing", () => {
    const c = { analytics: false, marketing: false, updatedAt: "x" };
    assert.equal(canLoadAnalytics(c), false);
    assert.equal(canLoadMarketing(c), false);
  });

  it("analytics-only loads analytics not marketing", () => {
    const c = { analytics: true, marketing: false, updatedAt: "x" };
    assert.equal(canLoadAnalytics(c), true);
    assert.equal(canLoadMarketing(c), false);
  });

  it("accept-all loads both", () => {
    const c = { analytics: true, marketing: true, updatedAt: "x" };
    assert.equal(canLoadAnalytics(c), true);
    assert.equal(canLoadMarketing(c), true);
  });
});
