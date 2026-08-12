import { KeyRound } from "lucide-react";

import { RecaptchaForm } from "@/features/settings/recaptcha-form";
import { getRecaptchaEnvStatus } from "@/lib/recaptcha";
import { requireModuleAccess } from "@/lib/rbac";
import { getRecaptchaSettings } from "@/lib/settings";

export default async function RecaptchaSettingsPage() {
  await requireModuleAccess("recaptcha");

  const recaptcha = await getRecaptchaSettings();
  const envFallback = getRecaptchaEnvStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">System</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">reCAPTCHA</h1>
        <p className="text-sm text-muted">
          จัดการ Site key และ Secret key ของ Google reCAPTCHA สำหรับแบบฟอร์มสาธารณะ
        </p>
      </div>

      <RecaptchaForm defaultValues={recaptcha} envFallback={envFallback} />
    </div>
  );
}
