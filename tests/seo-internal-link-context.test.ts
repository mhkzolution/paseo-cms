import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isInternalLinkContextStale,
  type InternalLinkSavedContext,
} from "@/lib/seo-internal-link-context";

describe("isInternalLinkContextStale", () => {
  const saved: InternalLinkSavedContext = {
    categoryId: "cat-1",
    tagIds: ["tag-b", "tag-a"],
  };

  it("returns false when category and tags match saved context", () => {
    assert.equal(
      isInternalLinkContextStale(saved, {
        categoryId: "cat-1",
        tagIds: ["tag-a", "tag-b"],
      }),
      false,
    );
  });

  it("returns true when category changes", () => {
    assert.equal(
      isInternalLinkContextStale(saved, {
        categoryId: "cat-2",
        tagIds: ["tag-a", "tag-b"],
      }),
      true,
    );
  });

  it("returns true when tags change", () => {
    assert.equal(
      isInternalLinkContextStale(saved, {
        categoryId: "cat-1",
        tagIds: ["tag-a"],
      }),
      true,
    );
  });

  it("treats tag order as stable after normalization", () => {
    assert.equal(
      isInternalLinkContextStale(
        { categoryId: "cat-1", tagIds: ["tag-a", "tag-b"] },
        { categoryId: "cat-1", tagIds: ["tag-b", "tag-a"] },
      ),
      false,
    );
  });
});
