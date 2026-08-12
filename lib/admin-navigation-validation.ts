import { ADMIN_MODULE_PERMISSIONS, getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";
import type { NavLinkItem, NavSection } from "@/types";

export interface AdminNavigationValidationIssue {
  code:
    | "duplicate-nav-id"
    | "duplicate-route"
    | "missing-permission"
    | "empty-section"
    | "duplicate-permission-id"
    | "duplicate-permission-route";
  message: string;
}

interface AdminNavigationConfig {
  sections: readonly NavSection[];
}

function collectNavLinks(sections: readonly NavSection[]): NavLinkItem[] {
  return sections.flatMap((section) => section.items);
}

export function validateAdminNavigationConfig(
  config: AdminNavigationConfig,
): AdminNavigationValidationIssue[] {
  const issues: AdminNavigationValidationIssue[] = [];
  const navIds = new Set<string>();
  const routes = new Set<string>();
  const permissionIds = new Set<string>();
  const permissionRoutes = new Set<string>();

  for (const permission of ADMIN_MODULE_PERMISSIONS) {
    if (permissionIds.has(permission.id)) {
      issues.push({
        code: "duplicate-permission-id",
        message: `Duplicate permission id: ${permission.id}`,
      });
    }
    permissionIds.add(permission.id);

    if (permissionRoutes.has(permission.routePrefix)) {
      issues.push({
        code: "duplicate-permission-route",
        message: `Duplicate permission route prefix: ${permission.routePrefix}`,
      });
    }
    permissionRoutes.add(permission.routePrefix);
  }

  for (const section of config.sections) {
    if (section.items.length === 0) {
      issues.push({
        code: "empty-section",
        message: `Section "${section.id}" has no navigation items.`,
      });
    }
  }

  for (const item of collectNavLinks(config.sections)) {
    if (navIds.has(item.id)) {
      issues.push({
        code: "duplicate-nav-id",
        message: `Duplicate navigation id: ${item.id}`,
      });
    }
    navIds.add(item.id);

    if (routes.has(item.href)) {
      issues.push({
        code: "duplicate-route",
        message: `Duplicate navigation route: ${item.href}`,
      });
    }
    routes.add(item.href);

    if (item.id === "dashboard") {
      continue;
    }

    try {
      getModuleRoles(item.id as AdminModuleId);
    } catch {
      issues.push({
        code: "missing-permission",
        message: `Navigation item "${item.id}" has no matching admin permission registry entry.`,
      });
    }
  }

  return issues;
}

export function assertValidAdminNavigationConfig(config: AdminNavigationConfig) {
  const issues = validateAdminNavigationConfig(config);
  if (issues.length === 0) {
    return;
  }

  throw new Error(
    `Invalid admin navigation config:\n${issues.map((issue) => `- ${issue.message}`).join("\n")}`,
  );
}
