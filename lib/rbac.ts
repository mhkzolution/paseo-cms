import { redirect } from "next/navigation";

import { getModuleRoles } from "@/lib/admin-permissions";
import type { AdminModuleId } from "@/types";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/types";

/**
 * Internal page guard. Prefer `requireModuleAccess()` for admin modules.
 */
async function requireRole(allowedRoles: readonly AppRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  return session;
}

/**
 * Enforce access for a registered admin module using the centralized permission registry.
 */
export async function requireModuleAccess(moduleId: AdminModuleId) {
  return requireRole(getModuleRoles(moduleId));
}

/**
 * Internal API guard. Prefer `checkModuleAccess()` for admin modules.
 */
async function checkRole(allowedRoles: readonly AppRole[]) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false as const, status: 401 as const, session: null };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return { authorized: false as const, status: 403 as const, session };
  }

  return { authorized: true as const, status: 200 as const, session };
}

/**
 * Check access for a registered admin module using the centralized permission registry.
 */
export async function checkModuleAccess(moduleId: AdminModuleId) {
  return checkRole(getModuleRoles(moduleId));
}
