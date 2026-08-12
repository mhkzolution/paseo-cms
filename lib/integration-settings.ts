import {
  DEFAULT_INTEGRATION_SETTINGS,
  getSettings,
  INTEGRATION_KEYS,
  saveSettings,
  type IntegrationKey,
  type IntegrationSettings,
} from "@/lib/settings";

export type { IntegrationKey, IntegrationSettings };

export {
  DEFAULT_INTEGRATION_SETTINGS,
  INTEGRATION_KEYS,
};

export function normalizeIntegrationSettingsValues(
  values: Partial<Record<IntegrationKey, string | null | undefined>>,
): IntegrationSettings {
  return {
    gaMeasurementId: values.gaMeasurementId?.trim() ?? "",
    gtmContainerId: values.gtmContainerId?.trim() ?? "",
    metaPixelId: values.metaPixelId?.trim() ?? "",
    lineOaId: values.lineOaId?.trim() ?? "",
  };
}

export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  return getSettings(INTEGRATION_KEYS, DEFAULT_INTEGRATION_SETTINGS);
}

export async function saveIntegrationSettings(
  values: Partial<Record<IntegrationKey, string | null | undefined>>,
): Promise<IntegrationSettings> {
  const integrations = normalizeIntegrationSettingsValues(values);
  await saveSettings(integrations);
  return integrations;
}
