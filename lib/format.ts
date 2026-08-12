import { formatDateWithSettings } from "@/lib/datetime-formatters";
import { DEFAULT_LOCALIZATION_SETTINGS, type LocalizationSettings } from "@/lib/localization-settings";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDate(
  date: Date | string,
  settings: LocalizationSettings = DEFAULT_LOCALIZATION_SETTINGS,
): string {
  return formatDateWithSettings(new Date(date), settings);
}
