import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { DEFAULT_SETTINGS, getSettings, saveSettings, SETTINGS_KEYS } from "@/lib/settings";
import { checkModuleAccess } from "@/lib/rbac";
import { settingsSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("settings");
  if (!authorized) return forbiddenError(status);

  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const { authorized, status } = await checkModuleAccess("settings");
  if (!authorized) return forbiddenError(status);

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  await saveSettings(parsed.data);

  return NextResponse.json({ settings: parsed.data });
}
