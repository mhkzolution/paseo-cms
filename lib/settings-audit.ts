import type { Role } from "@prisma/client";

import {
  AuditAction,
  AuditModule,
  createAuditLog,
  type CreateAuditLogInput,
} from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";
import { LOCALIZATION_SETTING_ID } from "@/lib/localization-settings";

export type SettingsAuditDependencies = {
  createAuditLog: (input: CreateAuditLogInput) => Promise<void>;
  getAuditRequestContext: typeof getAuditRequestContext;
};

type SettingsAuditUser = {
  id: string;
  name?: string | null;
  role: Role;
};

type SettingsUpdateAuditInput = {
  user?: SettingsAuditUser | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

const defaultDependencies: SettingsAuditDependencies = {
  createAuditLog,
  getAuditRequestContext,
};

function toAuditActor(user: SettingsAuditUser | null | undefined) {
  return user
    ? {
        id: user.id,
        name: user.name ?? "",
        role: user.role,
      }
    : null;
}

export async function auditSiteSettingsUpdate(
  { user, before, after }: SettingsUpdateAuditInput,
  dependencies: SettingsAuditDependencies = defaultDependencies,
): Promise<void> {
  await dependencies.createAuditLog({
    user: toAuditActor(user),
    action: AuditAction.UPDATE,
    module: AuditModule.SETTINGS,
    entityType: "SiteSettings",
    entityName: "Site Settings",
    before,
    after,
    context: await dependencies.getAuditRequestContext(),
  });
}

export async function auditLocalizationUpdate(
  { user, before, after }: SettingsUpdateAuditInput,
  dependencies: SettingsAuditDependencies = defaultDependencies,
): Promise<void> {
  await dependencies.createAuditLog({
    user: toAuditActor(user),
    action: AuditAction.UPDATE,
    module: AuditModule.LOCALIZATION,
    entityId: LOCALIZATION_SETTING_ID,
    entityType: "LocalizationSetting",
    entityName: "Localization Settings",
    before,
    after,
    context: await dependencies.getAuditRequestContext(),
  });
}
