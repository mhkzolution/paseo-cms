import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const MARKETING_CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"];
const MODULE_ID: AdminModuleId = "media-library";

const PHASE_6_ROUTES = [
  "app/api/media/route.ts",
  "app/api/media/[id]/route.ts",
  "app/api/media/folders/route.ts",
  "app/api/upload/route.ts",
] as const;

describe("phase 6 API module permissions", () => {
  for (const file of PHASE_6_ROUTES) {
    it(`keeps media-library roles unchanged in ${file}`, () => {
      assert.deepEqual([...getModuleRoles(MODULE_ID)], MARKETING_CONTENT_ROLES);
    });
  }
});

describe("phase 6 API route authorization wiring", () => {
  for (const file of PHASE_6_ROUTES) {
    it(`uses checkModuleAccess("media-library") in ${file}`, () => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, /checkModuleAccess\("media-library"\)/);
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
      assert.doesNotMatch(source, /checkRole\(\["SUPER_ADMIN"/);
    });
  }
});

describe("phase 6 upload authorization", () => {
  it("checks authorization before reading upload form data", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/upload/route.ts"), "utf8");

    const authIndex = source.indexOf('checkModuleAccess("media-library")');
    const formDataIndex = source.indexOf("request.formData()");

    assert.notEqual(authIndex, -1);
    assert.notEqual(formDataIndex, -1);
    assert.ok(authIndex < formDataIndex, "upload auth must run before formData is read");
  });

  it("returns forbidden response when upload is unauthorized", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/upload/route.ts"), "utf8");

    assert.match(source, /if \(!authorized\)/);
    assert.match(source, /NextResponse\.json\(\{ error: "Forbidden" \}, \{ status \}\)/);
  });
});
