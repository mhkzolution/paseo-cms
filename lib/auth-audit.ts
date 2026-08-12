import type { Role } from "@prisma/client";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";

import {
  AuditAction,
  AuditModule,
  createAuditLog,
  type CreateAuditLogInput,
} from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";

export type AuthAuditDependencies = {
  createAuditLog: (input: CreateAuditLogInput) => Promise<void>;
  getAuditRequestContext: typeof getAuditRequestContext;
};

const defaultDependencies: AuthAuditDependencies = {
  createAuditLog,
  getAuditRequestContext,
};

export async function auditAuthSignIn(
  { user }: { user: User },
  dependencies: AuthAuditDependencies = defaultDependencies,
): Promise<void> {
  await dependencies.createAuditLog({
    user: {
      id: user.id ?? "",
      name: user.name ?? user.email ?? "Unknown",
      role: (user.role as Role | undefined) ?? null,
    },
    action: AuditAction.LOGIN,
    module: AuditModule.AUTH,
    context: await dependencies.getAuditRequestContext(),
  });
}

export async function auditAuthSignOut(
  { token }: { token?: JWT | null },
  dependencies: AuthAuditDependencies = defaultDependencies,
): Promise<void> {
  const user = token?.id
    ? {
        id: String(token.id),
        name: typeof token.name === "string" ? token.name : "Unknown",
        role: (token.role as Role | undefined) ?? null,
      }
    : null;

  await dependencies.createAuditLog({
    user,
    action: AuditAction.LOGOUT,
    module: AuditModule.AUTH,
    context: await dependencies.getAuditRequestContext(),
  });
}
