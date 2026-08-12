import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import {
  getIntegrationSettings,
  saveIntegrationSettings,
} from "@/lib/integration-settings";
import { checkModuleAccess } from "@/lib/rbac";
import { auditIntegrationSettingsUpdate } from "@/lib/settings-audit";
import { integrationSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("settings");
  if (!authorized) return forbiddenError(status);

  const integrations = await getIntegrationSettings();

  return NextResponse.json(integrations);
}

export async function PATCH(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("settings");
  if (!authorized) return forbiddenError(status);

  const parsed = integrationSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const before = await getIntegrationSettings();
  const integrations = await saveIntegrationSettings({
    ...before,
    ...parsed.data,
  });
  await auditIntegrationSettingsUpdate({
    user: session.user,
    before,
    after: integrations,
  });

  return NextResponse.json(integrations);
}
