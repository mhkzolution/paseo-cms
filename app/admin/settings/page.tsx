import { Settings } from "lucide-react";

import { SettingsForm } from "@/features/settings/settings-form";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { requireModuleAccess } from "@/lib/rbac";

export default async function SettingsPage() {
  await requireModuleAccess("settings");

  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <Settings className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">System</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Manage site identity, contact channels, and public URLs.</p>
      </div>

      <SettingsForm defaultValues={settings} />
    </div>
  );
}
