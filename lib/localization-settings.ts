import type { AppLocale } from "@/i18n/routing";

export const LOCALIZATION_SETTING_ID = "default";

/** Legacy key-value storage in `settings` table (fallback before dedicated table exists). */
export const LOCALIZATION_LEGACY_SETTING_KEYS = [
  "defaultLanguage",
  "supportedLanguages",
  "dateLocale",
  "timeLocale",
  "numberLocale",
  "calendarSystem",
  "weekStartsOn",
  "timezone",
  "dateFormat",
  "timeFormat",
  "currency",
  "currencyPosition",
] as const;

export type LocalizationLegacySettingKey = (typeof LOCALIZATION_LEGACY_SETTING_KEYS)[number];

export const LANGUAGE_OPTIONS = [
  { value: "th", label: "Thai (th)", nativeLabel: "ไทย" },
  { value: "en", label: "English (en)", nativeLabel: "English" },
] as const;

export const REGIONAL_LOCALE_OPTIONS = [
  { value: "th-TH", label: "th-TH" },
  { value: "en-US", label: "en-US" },
  { value: "en-GB", label: "en-GB" },
] as const;

export const NUMBER_LOCALE_OPTIONS = [
  { value: "th-TH", label: "th-TH (1,234.56)" },
  { value: "en-US", label: "en-US (1,234.56)" },
  { value: "de-DE", label: "de-DE (1.234,56)" },
] as const;

export const CALENDAR_SYSTEM_OPTIONS = [
  { value: "gregorian", label: "Gregorian" },
  { value: "buddhist", label: "Buddhist Era" },
] as const;

export const WEEK_STARTS_ON_OPTIONS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "UTC", label: "UTC" },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY" },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: "24h", label: "24 Hour" },
  { value: "12h", label: "12 Hour (AM/PM)" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "THB", label: "THB" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
] as const;

export const CURRENCY_POSITION_OPTIONS = [
  { value: "before", label: "Before amount (฿10,000)" },
  { value: "after", label: "After amount (10,000 บาท)" },
] as const;

export type AppLanguage = (typeof LANGUAGE_OPTIONS)[number]["value"];
export type RegionalLocale = (typeof REGIONAL_LOCALE_OPTIONS)[number]["value"];
export type NumberLocale = (typeof NUMBER_LOCALE_OPTIONS)[number]["value"];
export type CalendarSystem = (typeof CALENDAR_SYSTEM_OPTIONS)[number]["value"];
export type WeekStartsOn = (typeof WEEK_STARTS_ON_OPTIONS)[number]["value"];
export type LocalizationTimezone = (typeof TIMEZONE_OPTIONS)[number]["value"];
export type DateFormatPattern = (typeof DATE_FORMAT_OPTIONS)[number]["value"];
export type TimeFormatPattern = (typeof TIME_FORMAT_OPTIONS)[number]["value"];
export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["value"];
export type CurrencyPosition = (typeof CURRENCY_POSITION_OPTIONS)[number]["value"];

export type LocalizationSettings = {
  defaultLanguage: AppLanguage;
  supportedLanguages: AppLanguage[];
  dateLocale: RegionalLocale;
  timeLocale: RegionalLocale;
  numberLocale: NumberLocale;
  calendarSystem: CalendarSystem;
  weekStartsOn: WeekStartsOn;
  timezone: LocalizationTimezone;
  dateFormat: DateFormatPattern;
  timeFormat: TimeFormatPattern;
  currency: CurrencyCode;
  currencyPosition: CurrencyPosition;
};

export const DEFAULT_LOCALIZATION_SETTINGS: LocalizationSettings = {
  defaultLanguage: "th",
  supportedLanguages: ["th"],
  dateLocale: "th-TH",
  timeLocale: "th-TH",
  numberLocale: "th-TH",
  calendarSystem: "buddhist",
  weekStartsOn: "monday",
  timezone: "Asia/Bangkok",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  currency: "THB",
  currencyPosition: "before",
};

const LANGUAGE_VALUES = new Set(LANGUAGE_OPTIONS.map((option) => option.value));
const REGIONAL_LOCALE_VALUES = new Set(REGIONAL_LOCALE_OPTIONS.map((option) => option.value));
const NUMBER_LOCALE_VALUES = new Set(NUMBER_LOCALE_OPTIONS.map((option) => option.value));
const CALENDAR_SYSTEM_VALUES = new Set(CALENDAR_SYSTEM_OPTIONS.map((option) => option.value));
const WEEK_STARTS_ON_VALUES = new Set(WEEK_STARTS_ON_OPTIONS.map((option) => option.value));
const TIMEZONE_VALUES = new Set(TIMEZONE_OPTIONS.map((option) => option.value));
const DATE_FORMAT_VALUES = new Set(DATE_FORMAT_OPTIONS.map((option) => option.value));
const TIME_FORMAT_VALUES = new Set(TIME_FORMAT_OPTIONS.map((option) => option.value));
const CURRENCY_VALUES = new Set(CURRENCY_OPTIONS.map((option) => option.value));
const CURRENCY_POSITION_VALUES = new Set(CURRENCY_POSITION_OPTIONS.map((option) => option.value));

function pickOptionValue<T extends string>(value: string | undefined, allowed: Set<T>, fallback: T): T {
  return allowed.has(value as T) ? (value as T) : fallback;
}

function normalizeSupportedLanguages(
  value: unknown,
  defaultLanguage: AppLanguage,
): AppLanguage[] {
  const raw = Array.isArray(value) ? value : [];
  const normalized = raw
    .filter((entry): entry is AppLanguage => typeof entry === "string" && LANGUAGE_VALUES.has(entry as AppLanguage))
    .filter((entry, index, array) => array.indexOf(entry) === index);

  if (!normalized.includes(defaultLanguage)) {
    normalized.unshift(defaultLanguage);
  }

  return normalized.length > 0 ? normalized : [defaultLanguage];
}

export function normalizeLocalizationSettings(
  values: Partial<LocalizationSettings> & {
    supportedLanguages?: unknown;
  },
): LocalizationSettings {
  const defaultLanguage = pickOptionValue(
    values.defaultLanguage,
    LANGUAGE_VALUES,
    DEFAULT_LOCALIZATION_SETTINGS.defaultLanguage,
  );

  return {
    defaultLanguage,
    supportedLanguages: normalizeSupportedLanguages(values.supportedLanguages, defaultLanguage),
    dateLocale: pickOptionValue(values.dateLocale, REGIONAL_LOCALE_VALUES, DEFAULT_LOCALIZATION_SETTINGS.dateLocale),
    timeLocale: pickOptionValue(values.timeLocale, REGIONAL_LOCALE_VALUES, DEFAULT_LOCALIZATION_SETTINGS.timeLocale),
    numberLocale: pickOptionValue(values.numberLocale, NUMBER_LOCALE_VALUES, DEFAULT_LOCALIZATION_SETTINGS.numberLocale),
    calendarSystem: pickOptionValue(
      values.calendarSystem,
      CALENDAR_SYSTEM_VALUES,
      DEFAULT_LOCALIZATION_SETTINGS.calendarSystem,
    ),
    weekStartsOn: pickOptionValue(values.weekStartsOn, WEEK_STARTS_ON_VALUES, DEFAULT_LOCALIZATION_SETTINGS.weekStartsOn),
    timezone: pickOptionValue(values.timezone, TIMEZONE_VALUES, DEFAULT_LOCALIZATION_SETTINGS.timezone),
    dateFormat: pickOptionValue(values.dateFormat, DATE_FORMAT_VALUES, DEFAULT_LOCALIZATION_SETTINGS.dateFormat),
    timeFormat: pickOptionValue(values.timeFormat, TIME_FORMAT_VALUES, DEFAULT_LOCALIZATION_SETTINGS.timeFormat),
    currency: pickOptionValue(values.currency, CURRENCY_VALUES, DEFAULT_LOCALIZATION_SETTINGS.currency),
    currencyPosition: pickOptionValue(
      values.currencyPosition,
      CURRENCY_POSITION_VALUES,
      DEFAULT_LOCALIZATION_SETTINGS.currencyPosition,
    ),
  };
}

export function getLanguageNativeLabel(language: AppLanguage) {
  return LANGUAGE_OPTIONS.find((option) => option.value === language)?.nativeLabel ?? language;
}

export function isAppLocale(value: string): value is AppLocale {
  return value === "th" || value === "en";
}

export function getSupportedAppLocales(settings: LocalizationSettings): AppLocale[] {
  return settings.supportedLanguages.filter(isAppLocale);
}

export const LOCALIZATION_PREVIEW_SAMPLE_DATE = new Date("2026-08-11T11:45:00.000Z");
export const LOCALIZATION_PREVIEW_NUMBER = 1_234_567.89;
export const LOCALIZATION_PREVIEW_CURRENCY_AMOUNT = 10_000;
