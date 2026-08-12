import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const PROJECT_ROOT = process.cwd();
const ADMIN_ROOT = path.join(PROJECT_ROOT, "app/admin");

/**
 * Admin pages intentionally exempt from `requireModuleAccess()` at the page layer.
 * Documented in the certification report (TD-04 dashboard, legacy redirect shims).
 */
const ADMIN_PAGE_AUTH_EXEMPTIONS = [
  {
    file: "app/admin/page.tsx",
    route: "/admin",
    reason: "Root redirect to /admin/dashboard; no module scope",
  },
  {
    file: "app/admin/dashboard/page.tsx",
    route: "/admin/dashboard",
    reason: "Authenticated landing page; middleware auth only (TD-04)",
  },
  {
    file: "app/admin/banners/page.tsx",
    route: "/admin/banners",
    reason: "Redirect-only to /admin/banners/site",
  },
  {
    file: "app/admin/banners/new/page.tsx",
    route: "/admin/banners/new",
    reason: "Redirect-only to /admin/banners/site/new",
  },
  {
    file: "app/admin/banners/about/page.tsx",
    route: "/admin/banners/about",
    reason: "Redirect-only to /admin/introduction",
  },
  {
    file: "app/admin/banners/[id]/edit/page.tsx",
    route: "/admin/banners/[id]/edit",
    reason: "Redirect-only legacy edit shim",
  },
  {
    file: "app/admin/seo/page.tsx",
    route: "/admin/seo",
    reason: "Redirect-only to /admin/seo/workspace",
  },
  {
    file: "app/admin/seo/settings/page.tsx",
    route: "/admin/seo/settings",
    reason: "Redirect-only 308 shim to /admin/settings/seo",
  },
] as const;

function listAdminPageFiles(dir = ADMIN_ROOT, prefix = "app/admin"): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry);
    const relative = `${prefix}/${entry}`;

    if (statSync(absolute).isDirectory()) {
      files.push(...listAdminPageFiles(absolute, relative));
      continue;
    }

    if (entry === "page.tsx") {
      files.push(relative);
    }
  }

  return files.sort();
}

function relativePath(file: string) {
  return path.join(PROJECT_ROOT, file);
}

function hasRequireModuleAccess(source: string) {
  return /requireModuleAccess\s*\(/.test(source);
}

describe("admin page authorization CI guard", () => {
  it("documents only existing exempt pages", () => {
    const discovered = new Set(listAdminPageFiles());
    const stale = ADMIN_PAGE_AUTH_EXEMPTIONS.filter((exemption) => !discovered.has(exemption.file));

    assert.deepEqual(
      stale.map((exemption) => exemption.file),
      [],
      `Stale admin page exemptions:\n${stale.map((exemption) => `  - ${exemption.file}`).join("\n")}`,
    );
  });

  it("requires requireModuleAccess() on every non-exempt admin page", () => {
    const exempt = new Set(ADMIN_PAGE_AUTH_EXEMPTIONS.map((entry) => entry.file));
    const violations: string[] = [];

    for (const file of listAdminPageFiles()) {
      if (exempt.has(file)) {
        continue;
      }

      const source = readFileSync(relativePath(file), "utf8");
      if (!hasRequireModuleAccess(source)) {
        violations.push(file);
      }
    }

    assert.deepEqual(
      violations,
      [],
      [
        "Admin pages missing requireModuleAccess():",
        ...violations.map((file) => `  - ${file}`),
        "",
        "Add await requireModuleAccess(moduleId) or register an explicit exemption in",
        "tests/admin-page-authorization-guard.test.ts with certification justification.",
      ].join("\n"),
    );
  });

  it("blocks legacy requireRole() usage in app/admin pages", () => {
    const violations: string[] = [];

    for (const file of listAdminPageFiles()) {
      const source = readFileSync(relativePath(file), "utf8");
      if (/requireRole\s*\(/.test(source)) {
        violations.push(file);
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Unexpected requireRole() usage in admin pages:\n${violations.map((file) => `  - ${file}`).join("\n")}`,
    );
  });

  it("blocks checkModuleAccess() in app/admin pages (use requireModuleAccess instead)", () => {
    const violations: string[] = [];

    for (const file of listAdminPageFiles()) {
      const source = readFileSync(relativePath(file), "utf8");
      if (/checkModuleAccess\s*\(/.test(source)) {
        violations.push(file);
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Unexpected checkModuleAccess() usage in admin pages:\n${violations.map((file) => `  - ${file}`).join("\n")}`,
    );
  });

  for (const exemption of ADMIN_PAGE_AUTH_EXEMPTIONS) {
    it(`documents exemption for ${exemption.route}`, () => {
      const source = readFileSync(relativePath(exemption.file), "utf8");
      assert.ok(exemption.reason.length > 0);
      assert.doesNotMatch(source, /requireRole\s*\(/);
    });
  }
});

describe("integrations settings page authorization wiring", () => {
  it("requires integrations module access on the page", () => {
    const source = readFileSync(relativePath("app/admin/settings/integrations/page.tsx"), "utf8");
    assert.match(source, /requireModuleAccess\("integrations"\)/);
  });
});
