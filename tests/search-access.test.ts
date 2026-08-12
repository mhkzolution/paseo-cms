import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import { isPublicSearchScope } from "@/lib/search-access";

describe("isPublicSearchScope", () => {
  it("treats scope=public as public search", () => {
    assert.equal(isPublicSearchScope("public"), true);
  });

  it("treats missing scope as admin search", () => {
    assert.equal(isPublicSearchScope(null), false);
  });

  it("treats any other scope as admin search", () => {
    assert.equal(isPublicSearchScope("admin"), false);
    assert.equal(isPublicSearchScope(""), false);
  });
});

describe("search module permissions", () => {
  it("allows marketing staff to use admin search", () => {
    const roles = getModuleRoles("search");
    assert.ok(roles.includes("MARKETING"));
    assert.ok(roles.includes("EDITOR"));
    assert.ok(!roles.includes("VIEWER"));
  });
});

describe("search route authorization wiring", () => {
  it("uses centralized search access helpers", () => {
    const routePath = path.join(process.cwd(), "app/api/search/route.ts");
    const source = readFileSync(routePath, "utf8");

    assert.match(source, /authorizeSearchRequest/);
    assert.match(source, /isPublicSearchScope/);
    assert.doesNotMatch(source, /checkRole\(/);
  });
});
