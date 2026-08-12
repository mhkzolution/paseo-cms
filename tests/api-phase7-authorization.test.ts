import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const MARKETING_CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"];

const PHASE_7_ADMIN_ROUTES: Array<{ file: string; moduleId: AdminModuleId; expectedRoles: string[] }> = [
  {
    file: "app/api/contact/route.ts",
    moduleId: "contact-messages",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/contact/[id]/route.ts",
    moduleId: "contact-messages",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/leasing/route.ts",
    moduleId: "leasing-inquiries",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
  {
    file: "app/api/leasing/[id]/route.ts",
    moduleId: "leasing-inquiries",
    expectedRoles: MARKETING_CONTENT_ROLES,
  },
];

const PUBLIC_POST_ROUTES = [
  "app/api/contact/route.ts",
  "app/api/leasing/route.ts",
] as const;

function extractHandler(source: string, method: "GET" | "POST" | "PATCH" | "DELETE") {
  const pattern = new RegExp(`export async function ${method}\\([^)]*\\)\\s*\\{([\\s\\S]*?)(?=\\nexport async function |$)`);
  const match = source.match(pattern);
  assert.ok(match, `expected ${method} handler in route source`);
  return match[1];
}

describe("phase 7 API module permissions", () => {
  for (const route of PHASE_7_ADMIN_ROUTES) {
    it(`keeps ${route.moduleId} roles unchanged in ${route.file}`, () => {
      assert.deepEqual([...getModuleRoles(route.moduleId)], route.expectedRoles);
    });
  }
});

describe("phase 7 admin endpoint authorization wiring", () => {
  for (const route of PHASE_7_ADMIN_ROUTES) {
    it(`uses checkModuleAccess("${route.moduleId}") in ${route.file}`, () => {
      const source = readFileSync(path.join(process.cwd(), route.file), "utf8");

      assert.match(source, /checkModuleAccess/);
      assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
      assert.doesNotMatch(source, /checkRole\(/);
      assert.doesNotMatch(source, /_ROLES\s*=/);
    });
  }

  it("protects contact GET before listing submissions", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/contact/route.ts"), "utf8");
    const getHandler = extractHandler(source, "GET");

    assert.match(getHandler, /checkModuleAccess\("contact-messages"\)/);
    assert.ok(
      getHandler.indexOf('checkModuleAccess("contact-messages")') < getHandler.indexOf("prisma.contactSubmission.findMany"),
    );
  });

  it("protects leasing GET before listing submissions", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/leasing/route.ts"), "utf8");
    const getHandler = extractHandler(source, "GET");

    assert.match(getHandler, /checkModuleAccess\("leasing-inquiries"\)/);
    assert.ok(
      getHandler.indexOf('checkModuleAccess("leasing-inquiries")') < getHandler.indexOf("prisma.leasingSubmission.findMany"),
    );
  });
});

describe("phase 7 public submission endpoints", () => {
  for (const file of PUBLIC_POST_ROUTES) {
    it(`keeps POST ${file} public without authorization checks`, () => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      const postHandler = extractHandler(source, "POST");

      assert.doesNotMatch(postHandler, /checkRole\(/);
      assert.doesNotMatch(postHandler, /checkModuleAccess\(/);
      assert.doesNotMatch(postHandler, /forbiddenError\(/);
      assert.match(postHandler, /\.safeParse\(/);
    });
  }

  it("keeps contact POST validation order unchanged", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/contact/route.ts"), "utf8");
    const postHandler = extractHandler(source, "POST");

    const parseIndex = postHandler.indexOf("contactSchema.safeParse");
    const createIndex = postHandler.indexOf("prisma.contactSubmission.create");

    assert.notEqual(parseIndex, -1);
    assert.notEqual(createIndex, -1);
    assert.ok(parseIndex < createIndex);
  });

  it("keeps leasing POST validation order unchanged", () => {
    const source = readFileSync(path.join(process.cwd(), "app/api/leasing/route.ts"), "utf8");
    const postHandler = extractHandler(source, "POST");

    const parseIndex = postHandler.indexOf("leasingSchema.safeParse");
    const recaptchaIndex = postHandler.indexOf("verifyRecaptcha");
    const createIndex = postHandler.indexOf("prisma.leasingSubmission.create");

    assert.notEqual(parseIndex, -1);
    assert.notEqual(recaptchaIndex, -1);
    assert.notEqual(createIndex, -1);
    assert.ok(parseIndex < recaptchaIndex);
    assert.ok(recaptchaIndex < createIndex);
  });
});
