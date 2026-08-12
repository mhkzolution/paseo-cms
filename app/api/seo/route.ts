import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { checkModuleAccess } from "@/lib/rbac";
import { getSeoSettings, saveSettings } from "@/lib/settings";
import { seoSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("seo");
  if (!authorized) return forbiddenError(status);

  const seo = await getSeoSettings();

  return NextResponse.json({ seo });
}

export async function PATCH(request: Request) {
  const { authorized, status } = await checkModuleAccess("seo");
  if (!authorized) return forbiddenError(status);

  const parsed = seoSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  await saveSettings(parsed.data);

  return NextResponse.json({ seo: parsed.data });
}
