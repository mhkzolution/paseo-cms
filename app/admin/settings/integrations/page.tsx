import { Link2 } from "lucide-react";

import { IntegrationsForm } from "@/features/settings/integrations-form";
import { getIntegrationSettings } from "@/lib/integration-settings";
import { requireModuleAccess } from "@/lib/rbac";

export default async function IntegrationsSettingsPage() {
  await requireModuleAccess("integrations");

  const integrations = await getIntegrationSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <Link2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="text-sm text-muted">
          จัดการการเชื่อมต่อบริการภายนอกและระบบติดตามข้อมูล
        </p>
      </div>

      <IntegrationsForm defaultValues={integrations} />
    </div>
  );
}
