import {
  DEFAULT_LOCALIZATION_SETTINGS,
  LOCALIZATION_LEGACY_SETTING_KEYS,
  LOCALIZATION_SETTING_ID,
  normalizeLocalizationSettings,
  type LocalizationSettings,
} from "@/lib/localization-settings";
import {
  getLocalizationSettingDelegate,
  isMissingLocalizationTableError,
  prisma,
} from "@/lib/prisma";

type LocalizationSettingRow = {
  defaultLanguage: string;
  supportedLanguages: unknown;
  dateLocale: string;
  timeLocale: string;
  numberLocale: string;
  calendarSystem: string;
  weekStartsOn: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  currencyPosition: string;
};

function mapRowToSettings(row: LocalizationSettingRow): LocalizationSettings {
  return normalizeLocalizationSettings({
    defaultLanguage: row.defaultLanguage,
    supportedLanguages: row.supportedLanguages,
    dateLocale: row.dateLocale,
    timeLocale: row.timeLocale,
    numberLocale: row.numberLocale,
    calendarSystem: row.calendarSystem,
    weekStartsOn: row.weekStartsOn,
    timezone: row.timezone,
    dateFormat: row.dateFormat,
    timeFormat: row.timeFormat,
    currency: row.currency,
    currencyPosition: row.currencyPosition,
  });
}

function mapSettingsToRow(settings: LocalizationSettings) {
  return {
    defaultLanguage: settings.defaultLanguage,
    supportedLanguages: settings.supportedLanguages,
    dateLocale: settings.dateLocale,
    timeLocale: settings.timeLocale,
    numberLocale: settings.numberLocale,
    calendarSystem: settings.calendarSystem,
    weekStartsOn: settings.weekStartsOn,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    currency: settings.currency,
    currencyPosition: settings.currencyPosition,
  };
}

function mapLegacyValuesToSettings(values: Record<string, string>): LocalizationSettings {
  let supportedLanguages: unknown;
  if (values.supportedLanguages) {
    try {
      supportedLanguages = JSON.parse(values.supportedLanguages);
    } catch {
      supportedLanguages = undefined;
    }
  }

  return normalizeLocalizationSettings({
    ...DEFAULT_LOCALIZATION_SETTINGS,
    defaultLanguage: values.defaultLanguage,
    supportedLanguages,
    dateLocale: values.dateLocale,
    timeLocale: values.timeLocale,
    numberLocale: values.numberLocale,
    calendarSystem: values.calendarSystem,
    weekStartsOn: values.weekStartsOn,
    timezone: values.timezone,
    dateFormat: values.dateFormat,
    timeFormat: values.timeFormat,
    currency: values.currency,
    currencyPosition: values.currencyPosition,
  });
}

function mapSettingsToLegacyValues(settings: LocalizationSettings) {
  const normalized = normalizeLocalizationSettings(settings);

  return {
    defaultLanguage: normalized.defaultLanguage,
    supportedLanguages: JSON.stringify(normalized.supportedLanguages),
    dateLocale: normalized.dateLocale,
    timeLocale: normalized.timeLocale,
    numberLocale: normalized.numberLocale,
    calendarSystem: normalized.calendarSystem,
    weekStartsOn: normalized.weekStartsOn,
    timezone: normalized.timezone,
    dateFormat: normalized.dateFormat,
    timeFormat: normalized.timeFormat,
    currency: normalized.currency,
    currencyPosition: normalized.currencyPosition,
  };
}

async function readLegacyLocalizationSettings(): Promise<LocalizationSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...LOCALIZATION_LEGACY_SETTING_KEYS] }, deletedAt: null },
    select: { key: true, value: true },
  });

  const values: Record<string, string> = {};
  for (const row of rows) {
    values[row.key] = row.value;
  }

  return mapLegacyValuesToSettings(values);
}

async function writeLegacyLocalizationSettings(settings: LocalizationSettings): Promise<LocalizationSettings> {
  const normalized = normalizeLocalizationSettings(settings);
  const legacyValues = mapSettingsToLegacyValues(normalized);

  await prisma.$transaction(
    Object.entries(legacyValues).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value, deletedAt: null },
      }),
    ),
  );

  return normalized;
}

async function readDedicatedLocalizationSettings(): Promise<LocalizationSettings | null> {
  const delegate = getLocalizationSettingDelegate(prisma);
  if (!delegate) {
    return null;
  }

  try {
    const existing = await delegate.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!existing) {
      return null;
    }

    return mapRowToSettings(existing);
  } catch (error) {
    if (isMissingLocalizationTableError(error)) {
      return null;
    }

    throw error;
  }
}

async function writeDedicatedLocalizationSettings(settings: LocalizationSettings): Promise<boolean> {
  const delegate = getLocalizationSettingDelegate(prisma);
  if (!delegate) {
    return false;
  }

  const normalized = normalizeLocalizationSettings(settings);
  const data = mapSettingsToRow(normalized);

  try {
    await delegate.upsert({
      where: { id: LOCALIZATION_SETTING_ID },
      create: {
        id: LOCALIZATION_SETTING_ID,
        ...data,
      },
      update: data,
    });

    return true;
  } catch (error) {
    if (isMissingLocalizationTableError(error)) {
      return false;
    }

    throw error;
  }
}

export async function readLocalizationSettingsFromDatabase(): Promise<LocalizationSettings> {
  const dedicated = await readDedicatedLocalizationSettings();
  if (dedicated) {
    return dedicated;
  }

  const legacy = await readLegacyLocalizationSettings();

  const seeded = await writeDedicatedLocalizationSettings(legacy);
  if (seeded) {
    return legacy;
  }

  return legacy;
}

export async function writeLocalizationSettingsToDatabase(settings: LocalizationSettings): Promise<LocalizationSettings> {
  const normalized = normalizeLocalizationSettings(settings);

  const savedToDedicated = await writeDedicatedLocalizationSettings(normalized);
  if (savedToDedicated) {
    return normalized;
  }

  return writeLegacyLocalizationSettings(normalized);
}
