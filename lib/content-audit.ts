import type { AuditModule, Role } from "@prisma/client";

import {
  pickContentAuditSnapshot,
  resolveContentAction,
  toAuditActor,
} from "@/lib/audit-content";
import {
  AuditAction,
  createAuditLog,
  type CreateAuditLogInput,
} from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";

export type ContentAuditDependencies = {
  createAuditLog: (input: CreateAuditLogInput) => Promise<void>;
  getAuditRequestContext: typeof getAuditRequestContext;
};

type ContentAuditUser = {
  id: string;
  name?: string | null;
  role?: Role | string | null;
};

type ContentAuditEntity = {
  id: string;
  title: string;
  slug: string;
  status?: string | null;
  [key: string]: unknown;
};

type ContentAuditBaseInput = {
  user?: ContentAuditUser | null;
  module: AuditModule;
  entityType: "Post" | "Event" | "Promotion";
};

const defaultDependencies: ContentAuditDependencies = {
  createAuditLog,
  getAuditRequestContext,
};

export async function auditContentCreate(
  input: ContentAuditBaseInput & { entity: ContentAuditEntity },
  dependencies: ContentAuditDependencies = defaultDependencies,
): Promise<void> {
  const { entity } = input;

  await dependencies.createAuditLog({
    user: toAuditActor(input.user),
    action: AuditAction.CREATE,
    module: input.module,
    entityId: entity.id,
    entityType: input.entityType,
    entityName: entity.title,
    entitySlug: entity.slug,
    before: null,
    after: pickContentAuditSnapshot(entity),
    context: await dependencies.getAuditRequestContext(),
  });
}

export async function auditContentUpdate(
  input: ContentAuditBaseInput & {
    before: ContentAuditEntity;
    after: ContentAuditEntity;
  },
  dependencies: ContentAuditDependencies = defaultDependencies,
): Promise<void> {
  const { before, after } = input;

  await dependencies.createAuditLog({
    user: toAuditActor(input.user),
    action: resolveContentAction(before.status, after.status),
    module: input.module,
    entityId: after.id,
    entityType: input.entityType,
    entityName: after.title,
    entitySlug: after.slug,
    before: pickContentAuditSnapshot(before),
    after: pickContentAuditSnapshot(after),
    context: await dependencies.getAuditRequestContext(),
  });
}

export async function auditContentDelete(
  input: ContentAuditBaseInput & {
    entity: Pick<ContentAuditEntity, "id" | "title" | "slug">;
  },
  dependencies: ContentAuditDependencies = defaultDependencies,
): Promise<void> {
  const { entity } = input;

  await dependencies.createAuditLog({
    user: toAuditActor(input.user),
    action: AuditAction.DELETE,
    module: input.module,
    entityId: entity.id,
    entityType: input.entityType,
    entityName: entity.title,
    entitySlug: entity.slug,
    context: await dependencies.getAuditRequestContext(),
  });
}
