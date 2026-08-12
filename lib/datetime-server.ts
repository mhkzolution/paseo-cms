import "server-only";

import {
  formatDateRangeWithSettings,
  formatDateTimeWithSettings,
  formatDateWithSettings,
  formatTimeWithSettings,
} from "@/lib/datetime-formatters";
import type { LocalizationSettings } from "@/lib/localization-settings";
import { getLocalizationSettings } from "@/lib/settings-cache";

export async function formatDate(date: Date, settings?: LocalizationSettings) {
  const resolved = settings ?? (await getLocalizationSettings());
  return formatDateWithSettings(date, resolved);
}

export async function formatTime(date: Date, settings?: LocalizationSettings) {
  const resolved = settings ?? (await getLocalizationSettings());
  return formatTimeWithSettings(date, resolved);
}

export async function formatDateTime(date: Date, settings?: LocalizationSettings) {
  const resolved = settings ?? (await getLocalizationSettings());
  return formatDateTimeWithSettings(date, resolved);
}

export async function formatDateRange(date: Date, end: Date | null, settings?: LocalizationSettings) {
  const resolved = settings ?? (await getLocalizationSettings());
  return formatDateRangeWithSettings(date, end, resolved);
}
