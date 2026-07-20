import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { getRecaptchaEnvStatus } from "@/lib/recaptcha";
import { checkRole } from "@/lib/rbac";
import { getRecaptchaSettings, saveSettings } from "@/lib/settings";
import { recaptchaSchema } from "@/validators/content.validator";

const RECAPTCHA_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

function normalizeRecaptchaValues(values: {
  recaptchaSiteKey?: string | null;
  recaptchaSecretKey?: string | null;
}) {
  return {
    recaptchaSiteKey: values.recaptchaSiteKey?.trim() ?? "",
    recaptchaSecretKey: values.recaptchaSecretKey?.trim() ?? "",
  };
}

export async function GET() {
  const { authorized, status } = await checkRole([...RECAPTCHA_ROLES]);
  if (!authorized) return forbiddenError(status);

  const recaptcha = await getRecaptchaSettings();

  return NextResponse.json({
    recaptcha,
    envFallback: getRecaptchaEnvStatus(),
  });
}

export async function PATCH(request: Request) {
  const { authorized, status } = await checkRole([...RECAPTCHA_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = recaptchaSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const recaptcha = normalizeRecaptchaValues(parsed.data);
  await saveSettings(recaptcha);

  return NextResponse.json({
    recaptcha,
    envFallback: getRecaptchaEnvStatus(),
  });
}
