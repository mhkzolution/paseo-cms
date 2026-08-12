import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findModulePermissionForPathname, getModuleRoles } from "@/lib/admin-permissions";
import { ADMIN_NAV_SECTIONS, isNavLinkActive } from "@/lib/admin-navigation";
import { validateAdminNavigationConfig } from "@/lib/admin-navigation-validation";

describe("admin permissions registry", () => {
  it("protects banner routes", () => {
    const permission = findModulePermissionForPathname("/admin/banners/site/new");
    assert.equal(permission?.id, "banners");
    assert.ok(permission?.roles.includes("MARKETING"));
  });

  it("protects tag routes", () => {
    const permission = findModulePermissionForPathname("/admin/tags/new");
    assert.equal(permission?.id, "tags");
    assert.deepEqual(getModuleRoles("tags"), ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  });

  it("matches the longest route prefix", () => {
    const permission = findModulePermissionForPathname("/admin/posts/new");
    assert.equal(permission?.id, "news");
  });

  it("protects audit-logs for ADMIN_ROLES only", () => {
    assert.deepEqual(getModuleRoles("audit-logs"), ["SUPER_ADMIN", "ADMIN"]);
    const permission = findModulePermissionForPathname("/admin/audit-logs");
    assert.equal(permission?.id, "audit-logs");
  });

  it("protects SEO settings for ADMIN_ROLES only", () => {
    assert.deepEqual(getModuleRoles("seo-settings"), ["SUPER_ADMIN", "ADMIN"]);
    const permission = findModulePermissionForPathname("/admin/settings/seo");
    assert.equal(permission?.id, "seo-settings");
    assert.equal(permission?.roles.includes("EDITOR"), false);
  });

  it("keeps the SEO workspace available to content editors", () => {
    assert.deepEqual(getModuleRoles("seo"), ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
    const permission = findModulePermissionForPathname("/admin/seo");
    assert.equal(permission?.id, "seo");
  });
});

describe("admin navigation active state", () => {
  it("highlights About The Paseo for about banner routes", () => {
    const aboutItem = ADMIN_NAV_SECTIONS.flatMap((section) => section.items).find(
      (item) => item.id === "about-the-paseo",
    );
    assert.ok(aboutItem);
    assert.equal(isNavLinkActive("/admin/banners/about/new", aboutItem), true);
  });

  it("does not highlight Banners for about banner routes", () => {
    const bannerItem = ADMIN_NAV_SECTIONS.flatMap((section) => section.items).find(
      (item) => item.id === "banners",
    );
    assert.ok(bannerItem);
    assert.equal(isNavLinkActive("/admin/banners/about/new", bannerItem), false);
  });
});

describe("admin navigation validation", () => {
  it("accepts the current navigation config", () => {
    const issues = validateAdminNavigationConfig({ sections: ADMIN_NAV_SECTIONS });
    assert.deepEqual(issues, []);
  });
});
