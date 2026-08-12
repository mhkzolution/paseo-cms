import {
  AuditAction,
  AuditModule,
  AuditSeverity,
  Prisma,
  type Role,
} from "@prisma/client";

import { buildDiff } from "@/lib/audit-diff";
import { prisma } from "@/lib/prisma";

export type AuditActor = {
  id: string;
  name: string;
  role?: Role | null;
};

export type AuditRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type CreateAuditLogInput = {
  user?: AuditActor | null;
  action: AuditAction;
  module: AuditModule;
  severity?: AuditSeverity;
  entityId?: string | null;
  entityType?: string | null;
  entityName?: string | null;
  entitySlug?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  context?: AuditRequestContext | null;
};

export function getDefaultSeverity(action: AuditAction): AuditSeverity {
  return action === AuditAction.DELETE ? AuditSeverity.WARNING : AuditSeverity.INFO;
}

export function resolveAuditChanges(input: {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
}): Record<string, unknown> | null {
  if ("changes" in input) {
    return input.changes ?? null;
  }
  if (input.before || input.after) {
    return buildDiff(input.before, input.after);
  }
  return null;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    const severity = input.severity ?? getDefaultSeverity(input.action);
    const changes = resolveAuditChanges(input);

    await prisma.auditLog.create({
      data: {
        userId: input.user?.id ?? null,
        userName: input.user?.name ?? null,
        userRole: input.user?.role ?? null,
        action: input.action,
        module: input.module,
        severity,
        entityId: input.entityId ?? null,
        entityType: input.entityType ?? null,
        entityName: input.entityName ?? null,
        entitySlug: input.entitySlug ?? null,
        changes: changes === null ? Prisma.JsonNull : (changes as Prisma.InputJsonValue),
        ipAddress: input.context?.ipAddress ?? null,
        userAgent: input.context?.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", {
      action: input.action,
      module: input.module,
      entityId: input.entityId,
      error,
    });
  }
}

export { AuditAction, AuditModule, AuditSeverity };
