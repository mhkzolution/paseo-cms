import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";

const CONTENT_EDITOR_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

const TD_01_ROUTES = [
  "app/api/store-floors/route.ts",
  "app/api/store-floors/[id]/route.ts",
  "app/api/store-locations/route.ts",
  "app/api/store-locations/[id]/route.ts",
  "app/api/store-zones/route.ts",
  "app/api/store-zones/[id]/route.ts",
] as const;

describe("TD-01 store infrastructure module permissions", () => {
  for (const file of TD_01_ROUTES) {
    it(`keeps stores roles unchanged in ${file}`, () => {
      assert.deepEqual([...getModuleRoles("stores")], CONTENT_EDITOR_ROLES);
    });
  }
});

describe("TD-01 store infrastructure authorization wiring", () => {
  for (const file of TD_01_ROUTES) {
    it(`uses checkModuleAccess("stores") in ${file}`, () => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");

      assert.match(source, /checkModuleAccess\("stores"\)/);
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }
});

describe("TD-01 store infrastructure registry coverage", () => {
  it("maps all store infrastructure APIs to the stores module", () => {
    const guardSource = readFileSync(
      path.join(process.cwd(), "tests/api-authorization-guard.test.ts"),
      "utf8",
    );

    for (const file of TD_01_ROUTES) {
      assert.ok(guardSource.includes(`file: "${file}", moduleId: "stores", authPattern: "checkModuleAccess"`));
    }
  });

  it("does not grant MARKETING access to store infrastructure APIs", () => {
    assert.equal(getModuleRoles("stores").includes("MARKETING"), false);
  });
});
