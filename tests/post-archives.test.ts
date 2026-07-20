import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARCHIVE_POST_LIMIT, POST_KIND_ORDER, TREND_UPDATE_POST_LIMIT, truncatePostExcerpt } from "@/lib/post-archives";

describe("post archives", () => {
  it("limits archive groups to three posts each", () => {
    assert.equal(ARCHIVE_POST_LIMIT, 3);
    assert.equal(POST_KIND_ORDER.length, 4);
  });

  it("limits trend update to ten latest posts", () => {
    assert.equal(TREND_UPDATE_POST_LIMIT, 10);
  });

  it("truncates post excerpts to one hundred characters", () => {
    assert.equal(truncatePostExcerpt("short text"), "short text");
    assert.equal(truncatePostExcerpt("a".repeat(100)), "a".repeat(100));
    assert.equal(truncatePostExcerpt("a".repeat(101)), `${"a".repeat(100)}…`);
    assert.equal(truncatePostExcerpt(null), "");
  });
});
