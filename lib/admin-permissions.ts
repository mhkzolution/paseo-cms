import type { AppRole, AdminModuleId } from "@/types";

export const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"] as const satisfies readonly AppRole[];
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const satisfies readonly AppRole[];
export const CONTENT_EDITOR_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const satisfies readonly AppRole[];
export const MARKETING_CONTENT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "MARKETING",
] as const satisfies readonly AppRole[];
export const BANNER_ROLES = MARKETING_CONTENT_ROLES;

export interface AdminModulePermission {
  id: AdminModuleId;
  routePrefix: string;
  roles: readonly AppRole[];
}

export const ADMIN_MODULE_PERMISSIONS = [
  { id: "news", routePrefix: "/admin/posts", roles: CONTENT_EDITOR_ROLES },
  { id: "events", routePrefix: "/admin/events", roles: MARKETING_CONTENT_ROLES },
  { id: "promotions", routePrefix: "/admin/promotions", roles: MARKETING_CONTENT_ROLES },
  { id: "stores", routePrefix: "/admin/stores", roles: CONTENT_EDITOR_ROLES },
  { id: "branches", routePrefix: "/admin/branches", roles: CONTENT_EDITOR_ROLES },
  { id: "banners", routePrefix: "/admin/banners", roles: BANNER_ROLES },
  { id: "gallery", routePrefix: "/admin/gallery", roles: MARKETING_CONTENT_ROLES },
  { id: "media-library", routePrefix: "/admin/media", roles: MARKETING_CONTENT_ROLES },
  { id: "about-the-paseo", routePrefix: "/admin/introduction", roles: BANNER_ROLES },
  { id: "brand-partners", routePrefix: "/admin/brand-partners", roles: MARKETING_CONTENT_ROLES },
  { id: "contact-messages", routePrefix: "/admin/contact", roles: MARKETING_CONTENT_ROLES },
  { id: "leasing-inquiries", routePrefix: "/admin/leasing", roles: MARKETING_CONTENT_ROLES },
  { id: "categories", routePrefix: "/admin/categories", roles: CONTENT_EDITOR_ROLES },
  { id: "post-categories", routePrefix: "/admin/post-categories", roles: CONTENT_EDITOR_ROLES },
  { id: "tags", routePrefix: "/admin/tags", roles: CONTENT_EDITOR_ROLES },
  { id: "seo", routePrefix: "/admin/seo", roles: CONTENT_EDITOR_ROLES },
  { id: "search", routePrefix: "/admin/search", roles: MARKETING_CONTENT_ROLES },
  { id: "users", routePrefix: "/admin/users", roles: ADMIN_ROLES },
  { id: "roles", routePrefix: "/admin/roles", roles: SUPER_ADMIN_ROLES },
  { id: "settings", routePrefix: "/admin/settings", roles: ADMIN_ROLES },
  { id: "localization", routePrefix: "/admin/settings/localization", roles: ADMIN_ROLES },
  { id: "recaptcha", routePrefix: "/admin/recaptcha", roles: ADMIN_ROLES },
] as const satisfies readonly AdminModulePermission[];

const permissionsById = new Map<AdminModuleId, AdminModulePermission>(
  ADMIN_MODULE_PERMISSIONS.map((permission) => [permission.id, permission]),
);

export function getModuleRoles(moduleId: AdminModuleId): readonly AppRole[] {
  const permission = permissionsById.get(moduleId);
  if (!permission) {
    throw new Error(`Unknown admin module permission: ${moduleId}`);
  }

  return permission.roles;
}

export function findModulePermissionForPathname(pathname: string): AdminModulePermission | null {
  let matched: AdminModulePermission | null = null;

  for (const permission of ADMIN_MODULE_PERMISSIONS) {
    if (!pathname.startsWith(permission.routePrefix)) {
      continue;
    }

    if (!matched || permission.routePrefix.length > matched.routePrefix.length) {
      matched = permission;
    }
  }

  return matched;
}
