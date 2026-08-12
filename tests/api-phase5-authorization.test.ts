import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const MARKETING_CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"];

const PHASE_5_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/banners/route.ts",
    moduleId: "banners",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/banners/[id]/route.ts",
    moduleId: "banners",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/gallery/route.ts",
    moduleId: "gallery",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/gallery/[id]/route.ts",
    moduleId: "gallery",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/brand-partners/route.ts",
    moduleId: "brand-partners",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/brand-partners/[id]/route.ts",
    moduleId: "brand-partners",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
];

describe("phase 5 API module permissions", () => {
  for (const route of PHASE_5_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged in ${route.file}`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }
});

describe("phase 5 API route authorization wiring", () => {
  for (const route of PHASE_5_ROUTES) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }
});
