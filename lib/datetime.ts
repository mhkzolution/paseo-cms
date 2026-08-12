import {
  formatDateRangeWithSettings,
  formatDateWithSettings,
  formatTimeWithSettings,
} from "@/lib/datetime-formatters";

export const BANGKOK_TIMEZONE = "Asia/Bangkok";

const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Parse admin datetime-local input as Bangkok wall-clock time.
 * Stored in MySQL DateTime via UTC slots (no timezone offset math).
 */
export function parseBangkokDateTime(value: string): Date {
  const datetimeMatch = value.match(DATE_TIME_LOCAL_PATTERN);
  if (datetimeMatch) {
    const [, year, month, day, hour, minute] = datetimeMatch;
    return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute));
  }

  const dateMatch = value.match(DATE_ONLY_PATTERN);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return new Date(Date.UTC(+year, +month - 1, +day, 0, 0));
  }

  return new Date(value);
}

export function isBangkokDateTimeInput(value: string) {
  return DATE_TIME_LOCAL_PATTERN.test(value) || DATE_ONLY_PATTERN.test(value);
}

/** Format a stored Date back to `<input type="datetime-local" />` value. */
export function toBangkokDateTimeInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";

  const value = new Date(date);
  return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}T${pad2(value.getUTCHours())}:${pad2(value.getUTCMinutes())}`;
}

/** Format a stored Date back to `<input type="date" />` value. */
export function toBangkokDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";

  const value = new Date(date);
  return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
}

export function startOfTodayBangkok(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parseBangkokDateTime(`${ymd}T00:00`);
}

export function formatBangkokDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  void options;
  return formatDateWithSettings(date, {
    dateLocale: "th-TH",
    timezone: "Asia/Bangkok",
    dateFormat: "DD MMM YYYY",
    calendarSystem: "buddhist",
  });
}

export function formatBangkokTime(date: Date) {
  return formatTimeWithSettings(date, {
    timeLocale: "th-TH",
    timezone: "Asia/Bangkok",
    timeFormat: "24h",
  });
}

export function formatBangkokDateRange(start: Date, end: Date | null) {
  return formatDateRangeWithSettings(start, end, {
    dateLocale: "th-TH",
    timezone: "Asia/Bangkok",
    dateFormat: "DD MMM YYYY",
    calendarSystem: "buddhist",
  });
}

export {
  formatDateRangeWithSettings,
  formatDateWithSettings,
  formatDateTimeWithSettings,
  formatTimeWithSettings,
} from "@/lib/datetime-formatters";
