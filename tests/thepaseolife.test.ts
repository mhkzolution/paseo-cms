import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isExternalUrl, publishedThePaseoLifeWhere } from "@/lib/thepaseolife";

describe("ThePaseoLife helpers", () => {
  it("detects external destination URLs", () => {
    assert.equal(isExternalUrl("https://facebook.com/thepaseo"), true);
    assert.equal(isExternalUrl("/news/summer-campaign"), false);
  });

  it("hides unpublished scheduled cards from the public feed", () => {
    const where = publishedThePaseoLifeWhere();
    assert.equal(where.isActive, true);
    assert.equal(where.deletedAt, null);
    assert.ok(Array.isArray(where.OR));
  });
});
