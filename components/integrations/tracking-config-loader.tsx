import { ConsentAwareTrackingScripts } from "@/components/integrations/consent-aware-tracking-scripts";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import { getIntegrationSettings } from "@/lib/integration-settings";

export async function TrackingConfigLoader() {
  let settings;

  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }

  const config = resolveTrackingConfiguration(settings);

  return (
    <ConsentAwareTrackingScripts
      gtmContainerId={config.gtmContainerId}
      gaMeasurementId={config.gaMeasurementId}
      metaPixelId={config.metaPixelId}
    />
  );
}
