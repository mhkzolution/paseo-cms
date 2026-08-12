import { GoogleAnalytics } from "@/components/integrations/google-analytics";
import { GoogleTagManager } from "@/components/integrations/google-tag-manager";
import { MetaPixel } from "@/components/integrations/meta-pixel";
import { canLoadTracking } from "@/components/integrations/consent";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import { getIntegrationSettings } from "@/lib/integration-settings";

export async function TrackingScripts() {
  if (!canLoadTracking()) return null;

  let settings;
  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }

  const config = resolveTrackingConfiguration(settings);

  return (
    <>
      {config.gtmContainerId ? <GoogleTagManager containerId={config.gtmContainerId} /> : null}
      {config.gaMeasurementId ? <GoogleAnalytics measurementId={config.gaMeasurementId} /> : null}
      {config.metaPixelId ? <MetaPixel pixelId={config.metaPixelId} /> : null}
    </>
  );
}
