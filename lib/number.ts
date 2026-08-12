import type { LocalizationSettings } from "@/lib/localization-settings";

export function formatNumberWithSettings(
  value: number,
  settings: Pick<LocalizationSettings, "numberLocale">,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(settings.numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}
