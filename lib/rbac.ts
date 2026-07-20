import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { AppRole } from "@/types";

/**
 * Use in Server Components / pages. Redirects to /login if unauthenticated,
 * or to /admin/dashboard if authenticated but not in an allowed role.
 */
export async function requireRole(allowedRoles: AppRole[]) {
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
 * Use in Route Handlers, where redirecting isn't appropriate — callers
 * should check `authorized` and return a 401/403 response themselves.
 */
export async function checkRole(allowedRoles: AppRole[]) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false as const, status: 401 as const, session: null };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return { authorized: false as const, status: 403 as const, session };
  }

  return { authorized: true as const, status: 200 as const, session };
}
