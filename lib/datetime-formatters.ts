import type { LocalizationSettings, LocalizationTimezone } from "@/lib/localization-settings";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function getZonedDateParts(date: Date, timezone: LocalizationTimezone) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
  };
}

function getDisplayYear(year: number, settings: Pick<LocalizationSettings, "calendarSystem">) {
  return settings.calendarSystem === "buddhist" ? year + 543 : year;
}

function formatLongDate(
  date: Date,
  settings: Pick<LocalizationSettings, "dateLocale" | "timezone" | "calendarSystem">,
) {
  const parts = getZonedDateParts(date, settings.timezone);
  const monthLabel = new Intl.DateTimeFormat(settings.dateLocale, {
    timeZone: settings.timezone,
    month: "long",
  }).format(date);
  const year = getDisplayYear(parts.year, settings);

  return `${parts.day} ${monthLabel} ${year}`;
}

export function formatDateWithSettings(
  date: Date,
  settings: Pick<LocalizationSettings, "dateLocale" | "timezone" | "dateFormat" | "calendarSystem">,
) {
  const parts = getZonedDateParts(date, settings.timezone);
  const day = pad2(parts.day);
  const month = pad2(parts.month);
  const year = String(getDisplayYear(parts.year, settings));

  switch (settings.dateFormat) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD MMM YYYY": {
      if (settings.calendarSystem === "buddhist" && settings.dateLocale.startsWith("th")) {
        return formatLongDate(date, settings);
      }

      const monthLabel = new Intl.DateTimeFormat(settings.dateLocale, {
        timeZone: settings.timezone,
        month: "long",
      }).format(date);

      return `${parts.day} ${monthLabel} ${year}`;
    }
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatTimeWithSettings(
  date: Date,
  settings: Pick<LocalizationSettings, "timeLocale" | "timezone" | "timeFormat">,
) {
  const formatted = new Intl.DateTimeFormat(settings.timeLocale, {
    timeZone: settings.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: settings.timeFormat === "12h",
  }).format(date);

  if (settings.timeFormat === "24h" && settings.timeLocale.startsWith("th")) {
    return `${formatted} น.`;
  }

  return formatted;
}

export function formatDateTimeWithSettings(date: Date, settings: LocalizationSettings) {
  return `${formatDateWithSettings(date, settings)} ${formatTimeWithSettings(date, settings)}`;
}

export function formatDateRangeWithSettings(
  start: Date,
  end: Date | null,
  settings: Pick<LocalizationSettings, "dateLocale" | "timezone" | "dateFormat" | "calendarSystem">,
) {
  if (!end) {
    return formatDateWithSettings(start, settings);
  }

  const startLabel = formatDateWithSettings(start, settings);
  const endLabel = formatDateWithSettings(end, settings);

  if (startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
}
