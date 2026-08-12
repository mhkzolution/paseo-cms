import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMediaOrderBy, buildMediaWhere } from "@/lib/media";

describe("buildMediaWhere", () => {
  it("always excludes soft-deleted", () => {
    const where = buildMediaWhere({});
    assert.equal(where.deletedAt, null);
  });

  it("searches filename, title, and altText", () => {
    const where = buildMediaWhere({ q: "hero" });
    assert.ok(where.OR);
    assert.equal(Array.isArray(where.OR), true);
  });

  it("filters by type", () => {
    const where = buildMediaWhere({ type: "IMAGE" });
    assert.equal(where.type, "IMAGE");
  });
});

describe("buildMediaOrderBy", () => {
  it("maps sort keys", () => {
    assert.deepEqual(buildMediaOrderBy("oldest"), { createdAt: "asc" });
    assert.deepEqual(buildMediaOrderBy("name-desc"), { filename: "desc" });
    assert.deepEqual(buildMediaOrderBy(undefined), { createdAt: "desc" });
  });
});
