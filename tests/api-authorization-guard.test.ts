import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { ADMIN_MODULE_PERMISSIONS } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";

const PROJECT_ROOT = process.cwd();
const API_ROOT = path.join(PROJECT_ROOT, "app/api");

type AuthPattern =
  | "checkModuleAccess"
  | "authorizeSearchRequest"
  | "framework"
  | "mixed";

interface ApiRouteExpectation {
  file: string;
  moduleId?: AdminModuleId;
  authPattern: AuthPattern;
  /** HTTP methods that must remain public (no auth in handler body). */
  publicHandlers?: Array<"GET" | "POST" | "PATCH" | "DELETE">;
}

const API_ROUTE_REGISTRY: ApiRouteExpectation[] = [
  { file: "app/api/auth/[...nextauth]/route.ts", authPattern: "framework" },
  { file: "app/api/search/route.ts", moduleId: "search", authPattern: "authorizeSearchRequest" },
  { file: "app/api/posts/route.ts", moduleId: "news", authPattern: "checkModuleAccess" },
  { file: "app/api/posts/[id]/route.ts", moduleId: "news", authPattern: "checkModuleAccess" },
  { file: "app/api/events/route.ts", moduleId: "events", authPattern: "checkModuleAccess" },
  { file: "app/api/events/[id]/route.ts", moduleId: "events", authPattern: "checkModuleAccess" },
  { file: "app/api/promotions/route.ts", moduleId: "promotions", authPattern: "checkModuleAccess" },
  { file: "app/api/promotions/[id]/route.ts", moduleId: "promotions", authPattern: "checkModuleAccess" },
  { file: "app/api/categories/route.ts", moduleId: "categories", authPattern: "checkModuleAccess" },
  { file: "app/api/categories/[id]/route.ts", moduleId: "categories", authPattern: "checkModuleAccess" },
  { file: "app/api/tags/route.ts", moduleId: "tags", authPattern: "checkModuleAccess" },
  { file: "app/api/tags/[id]/route.ts", moduleId: "tags", authPattern: "checkModuleAccess" },
  { file: "app/api/stores/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/stores/[id]/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/branches/route.ts", moduleId: "branches", authPattern: "checkModuleAccess" },
  { file: "app/api/branches/[id]/route.ts", moduleId: "branches", authPattern: "checkModuleAccess" },
  { file: "app/api/banners/route.ts", moduleId: "banners", authPattern: "checkModuleAccess" },
  { file: "app/api/banners/[id]/route.ts", moduleId: "banners", authPattern: "checkModuleAccess" },
  { file: "app/api/gallery/route.ts", moduleId: "gallery", authPattern: "checkModuleAccess" },
  { file: "app/api/gallery/[id]/route.ts", moduleId: "gallery", authPattern: "checkModuleAccess" },
  { file: "app/api/brand-partners/route.ts", moduleId: "brand-partners", authPattern: "checkModuleAccess" },
  { file: "app/api/brand-partners/[id]/route.ts", moduleId: "brand-partners", authPattern: "checkModuleAccess" },
  { file: "app/api/media/route.ts", moduleId: "media-library", authPattern: "checkModuleAccess" },
  { file: "app/api/media/[id]/route.ts", moduleId: "media-library", authPattern: "checkModuleAccess" },
  { file: "app/api/media/folders/route.ts", moduleId: "media-library", authPattern: "checkModuleAccess" },
  { file: "app/api/upload/route.ts", moduleId: "media-library", authPattern: "checkModuleAccess" },
  {
    file: "app/api/contact/route.ts",
    moduleId: "contact-messages",
    authPattern: "mixed",
    publicHandlers: ["POST"],
  },
  { file: "app/api/contact/[id]/route.ts", moduleId: "contact-messages", authPattern: "checkModuleAccess" },
  {
    file: "app/api/leasing/route.ts",
    moduleId: "leasing-inquiries",
    authPattern: "mixed",
    publicHandlers: ["POST"],
  },
  { file: "app/api/leasing/[id]/route.ts", moduleId: "leasing-inquiries", authPattern: "checkModuleAccess" },
  { file: "app/api/seo/route.ts", moduleId: "seo-settings", authPattern: "checkModuleAccess" },
  { file: "app/api/admin/seo/workspace/route.ts", moduleId: "seo", authPattern: "checkModuleAccess" },
  { file: "app/api/admin/seo/recalculate/route.ts", moduleId: "seo", authPattern: "checkModuleAccess" },
  { file: "app/api/admin/audit-logs/route.ts", moduleId: "audit-logs", authPattern: "checkModuleAccess" },
  { file: "app/api/admin/audit-logs/[id]/route.ts", moduleId: "audit-logs", authPattern: "checkModuleAccess" },
  { file: "app/api/settings/route.ts", moduleId: "settings", authPattern: "checkModuleAccess" },
  { file: "app/api/settings/localization/route.ts", moduleId: "localization", authPattern: "checkModuleAccess" },
  { file: "app/api/settings/introduction/route.ts", moduleId: "about-the-paseo", authPattern: "checkModuleAccess" },
  { file: "app/api/recaptcha/route.ts", moduleId: "recaptcha", authPattern: "checkModuleAccess" },
  { file: "app/api/users/route.ts", moduleId: "users", authPattern: "checkModuleAccess" },
  { file: "app/api/users/[id]/route.ts", moduleId: "users", authPattern: "checkModuleAccess" },
  { file: "app/api/store-floors/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/store-floors/[id]/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/store-locations/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/store-locations/[id]/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/store-zones/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
  { file: "app/api/store-zones/[id]/route.ts", moduleId: "stores", authPattern: "checkModuleAccess" },
];

function listApiRouteFiles(dir = API_ROOT, prefix = "app/api"): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry);
    const relative = `${prefix}/${entry}`;

    if (statSync(absolute).isDirectory()) {
      files.push(...listApiRouteFiles(absolute, relative));
      continue;
    }

    if (entry === "route.ts") {
      files.push(relative);
    }
  }

  return files.sort();
}

function extractHandler(source: string, method: "GET" | "POST" | "PATCH" | "DELETE") {
  const pattern = new RegExp(
    `export async function ${method}\\([^)]*\\)\\s*\\{([\\s\\S]*?)(?=\\nexport async function |$)`,
  );
  const match = source.match(pattern);
  return match?.[1] ?? null;
}

function relativePath(file: string) {
  return path.join(PROJECT_ROOT, file);
}

describe("API authorization CI guard: checkRole drift", () => {
  it("blocks all checkRole() usage in app/api", () => {
    const violations: string[] = [];

    for (const file of listApiRouteFiles()) {
      const source = readFileSync(relativePath(file), "utf8");
      if (source.includes("checkRole(")) {
        violations.push(file);
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Unexpected checkRole() usage in API routes:\n${violations.map((file) => `  - ${file}`).join("\n")}`,
    );
  });
});

describe("API authorization CI guard: local role arrays", () => {
  it("blocks all local *_ROLES constants in app/api", () => {
    const violations: string[] = [];

    for (const file of listApiRouteFiles()) {
      const source = readFileSync(relativePath(file), "utf8");
      if (/_ROLES\s*=/.test(source)) {
        violations.push(file);
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Unexpected local role arrays in API routes:\n${violations.map((file) => `  - ${file}`).join("\n")}`,
    );
  });
});

describe("API authorization registry coverage", () => {
  it("documents every API route file", () => {
    const discovered = listApiRouteFiles();
    const documented = new Set(API_ROUTE_REGISTRY.map((route) => route.file));

    const missing = discovered.filter((file) => !documented.has(file));
    const stale = [...documented].filter((file) => !discovered.includes(file));

    assert.deepEqual(missing, [], `Undocumented API routes:\n${missing.join("\n")}`);
    assert.deepEqual(stale, [], `Stale registry entries:\n${stale.join("\n")}`);
  });

  for (const route of API_ROUTE_REGISTRY) {
    it(`matches authorization wiring for ${route.file}`, () => {
      const source = readFileSync(relativePath(route.file), "utf8");

      switch (route.authPattern) {
        case "framework":
          assert.doesNotMatch(source, /checkRole\(/);
          assert.doesNotMatch(source, /checkModuleAccess\(/);
          return;
        case "authorizeSearchRequest":
          assert.match(source, /authorizeSearchRequest/);
          assert.doesNotMatch(source, /checkRole\(/);
          return;
        case "checkModuleAccess":
          assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
          assert.doesNotMatch(source, /checkRole\(/);
          assert.doesNotMatch(source, /_ROLES\s*=/);
          return;
        case "mixed":
          assert.match(source, new RegExp(`checkModuleAccess\\("${route.moduleId}"\\)`));
          assert.doesNotMatch(source, /checkRole\(/);
          for (const method of route.publicHandlers ?? []) {
            const handler = extractHandler(source, method);
            assert.ok(handler, `expected ${method} handler`);
            assert.doesNotMatch(handler, /checkRole\(/);
            assert.doesNotMatch(handler, /checkModuleAccess\(/);
            assert.doesNotMatch(handler, /forbiddenError\(/);
          }
          return;
        default:
          throw new Error(`Unhandled auth pattern: ${route.authPattern satisfies never}`);
      }
    });
  }

  it("covers every registry module that exposes an API surface", () => {
    const modulesWithApi = new Set(
      API_ROUTE_REGISTRY.map((route) => route.moduleId).filter((moduleId): moduleId is AdminModuleId => !!moduleId),
    );

    const expectedApiModules: AdminModuleId[] = [
      "news",
      "events",
      "promotions",
      "categories",
      "tags",
      "stores",
      "branches",
      "banners",
      "gallery",
      "brand-partners",
      "media-library",
      "contact-messages",
      "leasing-inquiries",
      "seo",
      "seo-settings",
      "settings",
      "localization",
      "about-the-paseo",
      "recaptcha",
      "users",
      "search",
      "audit-logs",
    ];

    const missing = expectedApiModules.filter((moduleId) => !modulesWithApi.has(moduleId));
    assert.deepEqual(missing, []);
  });

  it("documents modules without API routes", () => {
    const modulesWithApi = new Set(
      API_ROUTE_REGISTRY.map((route) => route.moduleId).filter((moduleId): moduleId is AdminModuleId => !!moduleId),
    );

    assert.equal(modulesWithApi.has("roles"), false);
    assert.equal(ADMIN_MODULE_PERMISSIONS.some((permission) => permission.id === "roles"), true);
  });
});

describe("admin permission registry integrity", () => {
  it("uses unique module ids", () => {
    const ids = ADMIN_MODULE_PERMISSIONS.map((permission) => permission.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("uses unique route prefixes", () => {
    const prefixes = ADMIN_MODULE_PERMISSIONS.map((permission) => permission.routePrefix);
    assert.equal(prefixes.length, new Set(prefixes).size);
  });

  it("does not define duplicate role sets under different aliases", () => {
    const roleFingerprints = ADMIN_MODULE_PERMISSIONS.map((permission) => permission.roles.join(","));
    const uniqueFingerprints = new Set(roleFingerprints);

    assert.ok(uniqueFingerprints.size <= 4, "unexpected proliferation of distinct role sets");
  });
});

describe("SEO settings API audit wiring", () => {
  it("audits PATCH updates with the authenticated user and before/after values", () => {
    const source = readFileSync(relativePath("app/api/seo/route.ts"), "utf8");
    const patchHandler = extractHandler(source, "PATCH");

    assert.ok(patchHandler, "expected PATCH handler");
    assert.match(patchHandler, /const \{ authorized, status, session \} = await checkModuleAccess\("seo-settings"\)/);
    assert.match(patchHandler, /const before = .*await getSeoSettings\(\)/);
    assert.match(patchHandler, /await auditSeoSettingsUpdate\(\{[\s\S]*user: session\.user,[\s\S]*before,[\s\S]*after: parsed\.data/);
  });
});
