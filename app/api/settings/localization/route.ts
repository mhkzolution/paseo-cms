import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { normalizeLocalizationSettings } from "@/lib/localization-settings";
import { checkModuleAccess } from "@/lib/rbac";
import { getLocalizationSettings, saveLocalizationSettings } from "@/lib/settings-cache";
import { localizationSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("localization");
  if (!authorized) return forbiddenError(status);

  const localization = await getLocalizationSettings();

  return NextResponse.json({ localization });
}

export async function PATCH(request: Request) {
  const { authorized, status } = await checkModuleAccess("localization");
  if (!authorized) return forbiddenError(status);

  const parsed = localizationSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const localization = await saveLocalizationSettings(normalizeLocalizationSettings(parsed.data));

  return NextResponse.json({ localization });
}
