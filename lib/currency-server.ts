import "server-only";

import { formatCurrencyWithSettings } from "@/lib/currency";
import type { LocalizationSettings } from "@/lib/localization-settings";
import { getLocalizationSettings } from "@/lib/settings-cache";

export async function formatCurrency(amount: number, settings?: LocalizationSettings) {
  const resolved = settings ?? (await getLocalizationSettings());
  return formatCurrencyWithSettings(amount, resolved);
}
