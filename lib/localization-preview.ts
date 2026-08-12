import { formatCurrencyWithSettings } from "@/lib/currency";
import { formatDateWithSettings, formatTimeWithSettings } from "@/lib/datetime-formatters";
import {
  getLanguageNativeLabel,
  LOCALIZATION_PREVIEW_CURRENCY_AMOUNT,
  LOCALIZATION_PREVIEW_NUMBER,
  type LocalizationSettings,
} from "@/lib/localization-settings";
import { formatNumberWithSettings } from "@/lib/number";

export function getLocalizationPreviewSamples(
  settings: LocalizationSettings,
  date = new Date(),
) {
  return {
    languageLabel: getLanguageNativeLabel(settings.defaultLanguage),
    dateSample: formatDateWithSettings(date, settings),
    timeSample: formatTimeWithSettings(date, settings),
    numberSample: formatNumberWithSettings(LOCALIZATION_PREVIEW_NUMBER, settings),
    currencySample: formatCurrencyWithSettings(LOCALIZATION_PREVIEW_CURRENCY_AMOUNT, settings),
    timezoneLabel: settings.timezone,
  };
}
