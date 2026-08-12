import "server-only";

import type { LocalizationSettings } from "@/lib/localization-settings";
import { formatNumberWithSettings } from "@/lib/number";
import { getLocalizationSettings } from "@/lib/settings-cache";

export async function formatNumber(value: number, settings?: LocalizationSettings) {
  const resolved = settings ?? (await getLocalizationSettings());
  return formatNumberWithSettings(value, resolved);
}
