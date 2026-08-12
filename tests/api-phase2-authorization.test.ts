import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const PHASE_2_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/categories/route.ts",
    moduleId: "categories",
    expectedRoles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    file: "app/api/categories/[id]/route.ts",
    moduleId: "categories",
    expectedRoles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    file: "app/api/tags/route.ts",
    moduleId: "tags",
    expectedRoles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    file: "app/api/tags/[id]/route.ts",
    moduleId: "tags",
    expectedRoles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
];

describe("phase 2 API module permissions", () => {
  for (const route of PHASE_2_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged in ${route.file}`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }
});

describe("phase 2 API route authorization wiring", () => {
  for (const route of PHASE_2_ROUTES) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }
});
