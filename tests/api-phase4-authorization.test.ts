import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const CONTENT_EDITOR_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

const PHASE_4_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/stores/route.ts",
    moduleId: "stores",
    expectedRoles: CONTENT_EDITOR_ROLES,
  },
  {
    file: "app/api/stores/[id]/route.ts",
    moduleId: "stores",
    expectedRoles: CONTENT_EDITOR_ROLES,
  },
  {
    file: "app/api/branches/route.ts",
    moduleId: "branches",
    expectedRoles: CONTENT_EDITOR_ROLES,
  },
  {
    file: "app/api/branches/[id]/route.ts",
    moduleId: "branches",
    expectedRoles: CONTENT_EDITOR_ROLES,
  },
];

describe("phase 4 API module permissions", () => {
  for (const route of PHASE_4_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged in ${route.file}`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }
});

describe("phase 4 API route authorization wiring", () => {
  for (const route of PHASE_4_ROUTES) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }
});
