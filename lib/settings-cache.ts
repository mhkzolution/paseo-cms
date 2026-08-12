import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import type { LocalizationSettings } from "@/lib/localization-settings";
import {
  readLocalizationSettingsFromDatabase,
  writeLocalizationSettingsToDatabase,
} from "@/lib/localization-repository";

export const LOCALIZATION_SETTINGS_CACHE_TAG = "localization-settings";

const getCachedLocalizationSettings = unstable_cache(
  async () => readLocalizationSettingsFromDatabase(),
  ["localization-settings"],
  {
    tags: [LOCALIZATION_SETTINGS_CACHE_TAG],
  },
);

export async function getLocalizationSettings(): Promise<LocalizationSettings> {
  return getCachedLocalizationSettings();
}

export async function saveLocalizationSettings(settings: LocalizationSettings): Promise<LocalizationSettings> {
  const saved = await writeLocalizationSettingsToDatabase(settings);
  invalidateLocalizationSettingsCache();
  return saved;
}

export function invalidateLocalizationSettingsCache() {
  revalidateTag(LOCALIZATION_SETTINGS_CACHE_TAG, { expire: 0 });
}
