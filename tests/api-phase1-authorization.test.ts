import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const PHASE_1_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/seo/route.ts",
    moduleId: "seo-settings",
    expectedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    file: "app/api/settings/route.ts",
    moduleId: "settings",
    expectedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    file: "app/api/recaptcha/route.ts",
    moduleId: "recaptcha",
    expectedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    file: "app/api/settings/introduction/route.ts",
    moduleId: "about-the-paseo",
    expectedRoles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
];

describe("phase 1 API module permissions", () => {
  for (const route of PHASE_1_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }
});

describe("phase 1 API route authorization wiring", () => {
  for (const route of [
    ...PHASE_1_ROUTES,
    { file: "app/api/admin/seo/workspace/route.ts", moduleId: "seo" as const },
    { file: "app/api/admin/seo/recalculate/route.ts", moduleId: "seo" as const },
  ]) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }
});
