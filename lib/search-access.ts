import { checkModuleAccess } from "@/lib/rbac";

export function isPublicSearchScope(scope: string | null) {
  return scope === "public";
}

export async function authorizeSearchRequest(scope: string | null) {
  if (isPublicSearchScope(scope)) {
    return { authorized: true as const, status: 200 as const };
  }

  return checkModuleAccess("search");
}
