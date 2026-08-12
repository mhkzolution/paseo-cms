import type { IntegrationSettings } from "@/lib/integration-settings";

export type TrackingConfiguration = {
  gtmContainerId: string | null;
  gaMeasurementId: string | null;
  metaPixelId: string | null;
};

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveTrackingConfiguration(
  settings: IntegrationSettings,
): TrackingConfiguration {
  const gtmContainerId = normalizeId(settings.gtmContainerId);
  const gaRaw = normalizeId(settings.gaMeasurementId);
  const metaPixelId = normalizeId(settings.metaPixelId);

  return {
    gtmContainerId,
    gaMeasurementId: gtmContainerId ? null : gaRaw,
    metaPixelId,
  };
}
