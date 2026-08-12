import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { checkModuleAccess } from "@/lib/rbac";
import {
  getSeoSettings,
  normalizeSeoSettingsValues,
  saveSettings,
} from "@/lib/settings";
import { auditSeoSettingsUpdate } from "@/lib/settings-audit";
import { seoSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("seo-settings");
  if (!authorized) return forbiddenError(status);

  const seo = await getSeoSettings();

  return NextResponse.json({ seo });
}

export async function PATCH(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("seo-settings");
  if (!authorized) return forbiddenError(status);

  const parsed = seoSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const after = normalizeSeoSettingsValues(parsed.data);
  const before = { ...(await getSeoSettings()) };
  await saveSettings(after);
  await auditSeoSettingsUpdate({
    user: session.user,
    before,
    after,
  });

  return NextResponse.json({ seo: after });
}
