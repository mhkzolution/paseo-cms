import { getRecaptchaSettings } from "@/lib/settings";

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  "error-codes"?: string[];
};

async function resolveRecaptchaSecretKey(): Promise<string> {
  const settings = await getRecaptchaSettings();
  const fromSettings = settings.recaptchaSecretKey.trim();
  if (fromSettings) return fromSettings;
  return process.env.RECAPTCHA_SECRET_KEY?.trim() ?? "";
}

export async function getRecaptchaSiteKey(): Promise<string> {
  const settings = await getRecaptchaSettings();
  const fromSettings = settings.recaptchaSiteKey.trim();
  if (fromSettings) return fromSettings;
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";
}

export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = await resolveRecaptchaSecretKey();

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[recaptcha] Secret key is not set — skipping verification in development");
      return true;
    }
    return false;
  }

  if (!token) return false;

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return false;

  const data = (await response.json()) as RecaptchaVerifyResponse;
  if (!data.success) return false;

  if (typeof data.score === "number") {
    return data.score >= 0.5;
  }

  return true;
}

export function getRecaptchaEnvStatus() {
  return {
    siteKeyFromEnv: Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()),
    secretKeyFromEnv: Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim()),
  };
}
