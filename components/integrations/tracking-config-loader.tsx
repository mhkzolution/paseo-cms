import { ConsentAwareTrackingScripts } from "@/components/integrations/consent-aware-tracking-scripts";
import { EventsDebugPanel } from "@/components/integrations/events/debug-panel";
import { EventRuntimeProvider } from "@/components/integrations/events/event-runtime-context";
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
    <EventRuntimeProvider
      config={{
        gtmContainerId: config.gtmContainerId,
        gaMeasurementId: config.gaMeasurementId,
        metaPixelId: config.metaPixelId,
      }}
    >
      <ConsentAwareTrackingScripts
        gtmContainerId={config.gtmContainerId}
        gaMeasurementId={config.gaMeasurementId}
        metaPixelId={config.metaPixelId}
      />
      <EventsDebugPanel />
    </EventRuntimeProvider>
  );
}
