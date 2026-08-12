import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import {
  DEFAULT_INTRODUCTION_SETTINGS,
  getSettings,
  INTRODUCTION_SETTINGS_KEYS,
  saveSettings,
} from "@/lib/settings";
import { checkModuleAccess } from "@/lib/rbac";
import { introductionSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("about-the-paseo");
  if (!authorized) return forbiddenError(status);

  const settings = await getSettings(INTRODUCTION_SETTINGS_KEYS, DEFAULT_INTRODUCTION_SETTINGS);

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const { authorized, status } = await checkModuleAccess("about-the-paseo");
  if (!authorized) return forbiddenError(status);

  const parsed = introductionSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  await saveSettings(parsed.data);

  return NextResponse.json({ settings: parsed.data });
}
