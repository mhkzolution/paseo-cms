import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const CONTENT_EDITOR_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const MARKETING_CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"];

const PHASE_3_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/posts/route.ts",
    moduleId: "news",
    expectedRoles: CONTENT_EDITOR_ROLES,
  },
  {
    file: "app/api/posts/[id]/route.ts",
    moduleId: "news",
    expectedRoles: CONTENT_EDITOR_ROLES,
  },
  {
    file: "app/api/events/route.ts",
    moduleId: "events",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/events/[id]/route.ts",
    moduleId: "events",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/promotions/route.ts",
    moduleId: "promotions",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/promotions/[id]/route.ts",
    moduleId: "promotions",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
];

describe("phase 3 API module permissions", () => {
  for (const route of PHASE_3_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged in ${route.file}`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }
});

describe("phase 3 API route authorization wiring", () => {
  for (const route of PHASE_3_ROUTES) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }
});
