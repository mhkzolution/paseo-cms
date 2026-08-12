import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const CONTENT_EDITOR_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const SUPER_ADMIN_ONLY = ["SUPER_ADMIN"];

const PHASE_8_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/users/route.ts",
    moduleId: "users",
    expectedRoles: ADMIN_ROLES,
  },
  {
    file: "app/api/users/[id]/route.ts",
    moduleId: "users",
    expectedRoles: ADMIN_ROLES,
  },
  {
    file: "app/api/settings/route.ts",
    moduleId: "settings",
    expectedRoles: ADMIN_ROLES,
  },
  {
    file: "app/api/recaptcha/route.ts",
    moduleId: "recaptcha",
    expectedRoles: ADMIN_ROLES,
  },
  {
    file: "app/api/seo/route.ts",
    moduleId: "seo-settings",
    expectedRoles: ADMIN_ROLES,
  },
];

describe("phase 8 API module permissions", () => {
  for (const route of PHASE_8_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged in ${route.file}`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }

  it("keeps roles module restricted to SUPER_ADMIN only", () => {
    assert.deepEqual([...getModuleRoles("roles")], SUPER_ADMIN_ONLY);
  });
});

describe("phase 8 API route authorization wiring", () => {
  for (const route of PHASE_8_ROUTES) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
      assert.doesNotMatch(source, /checkRole\(\["SUPER_ADMIN"/);
    });
  }
});

describe("phase 8 privilege boundaries", () => {
  it("does not grant EDITOR access to users management", () => {
    assert.equal(getModuleRoles("users").includes("EDITOR"), false);
  });

  it("does not grant ADMIN access to roles management", () => {
    assert.equal(getModuleRoles("roles").includes("ADMIN"), false);
  });

  it("does not grant EDITOR access to settings or recaptcha", () => {
    assert.equal(getModuleRoles("settings").includes("EDITOR"), false);
    assert.equal(getModuleRoles("recaptcha").includes("EDITOR"), false);
  });

  it("preserves session usage for user self-delete guard", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/users/[id]/route.ts"), "utf8");

    assert.match(source, /const \{ authorized, status, session \} = await checkModuleAccess\("users"\)/);
    assert.match(source, /session\?\.user\.id === id/);
  });
});

describe("phase 8 roles API scope", () => {
  it("has no /api/roles routes to migrate", () => {
    assert.equal(existsSync(path.join(process.cwd(), "app/api/roles")), false);
  });
});
