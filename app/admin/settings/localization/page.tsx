import { Languages } from "lucide-react";

import { LocalizationForm } from "@/features/settings/localization-form";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { requireModuleAccess } from "@/lib/rbac";

export default async function LocalizationSettingsPage() {
  await requireModuleAccess("localization");

  const localization = await getLocalizationSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <Languages className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Localization</h1>
        <p className="text-sm text-muted">
          จัดการภาษา ภูมิภาค timezone และรูปแบบวันที่/เวลาสำหรับ CMS และเว็บไซต์สาธารณะ
        </p>
      </div>

      <LocalizationForm defaultValues={localization} />
    </div>
  );
}
