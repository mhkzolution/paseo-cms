import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMediaPageMeta, parseMediaPage } from "@/lib/media";

describe("parseMediaPage", () => {
  it("defaults page=1 take=40", () => {
    assert.deepEqual(parseMediaPage({}), { page: 1, take: 40, skip: 0 });
  });

  it("computes skip from page and take", () => {
    assert.deepEqual(parseMediaPage({ page: 3, take: 40 }), { page: 3, take: 40, skip: 80 });
  });

  it("clamps take to 1..100 and page to >=1", () => {
    assert.equal(parseMediaPage({ page: 0, take: 999 }).page, 1);
    assert.equal(parseMediaPage({ page: 1, take: 999 }).take, 100);
    assert.equal(parseMediaPage({ page: 1, take: 0 }).take, 1);
  });
});

describe("buildMediaPageMeta", () => {
  it("returns hasMore true when more pages remain", () => {
    assert.deepEqual(buildMediaPageMeta({ total: 238, page: 1, take: 40 }), {
      total: 238,
      page: 1,
      take: 40,
      totalPages: 6,
      hasMore: true,
    });
  });

  it("allows totalPages=0 when total=0", () => {
    const meta = buildMediaPageMeta({ total: 0, page: 1, take: 40 });
    assert.equal(meta.totalPages, 0);
    assert.equal(meta.hasMore, false);
  });

  it("sets hasMore false on last page", () => {
    assert.equal(buildMediaPageMeta({ total: 40, page: 1, take: 40 }).hasMore, false);
  });
});
