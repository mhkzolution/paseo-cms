import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCurrencyWithSettings } from "@/lib/currency";
import { formatDateRangeWithSettings, formatDateWithSettings, formatTimeWithSettings } from "@/lib/datetime-formatters";
import { buildLocaleLanguageAlternates } from "@/lib/i18n/localization-routing";
import { getLocalizationPreviewSamples } from "@/lib/localization-preview";
import {
  LOCALIZATION_PREVIEW_SAMPLE_DATE,
  normalizeLocalizationSettings,
} from "@/lib/localization-settings";
import { formatNumberWithSettings } from "@/lib/number";
import { localizationSchema } from "@/validators/content.validator";

describe("localization settings v2", () => {
  const sampleDate = LOCALIZATION_PREVIEW_SAMPLE_DATE;

  it("validates enterprise localization settings", () => {
    const parsed = localizationSchema.safeParse({
      defaultLanguage: "th",
      supportedLanguages: ["th", "en"],
      dateLocale: "th-TH",
      timeLocale: "th-TH",
      numberLocale: "th-TH",
      calendarSystem: "buddhist",
      weekStartsOn: "monday",
      timezone: "Asia/Bangkok",
      dateFormat: "DD MMM YYYY",
      timeFormat: "24h",
      currency: "THB",
      currencyPosition: "before",
    });

    assert.equal(parsed.success, true);
  });

  it("rejects default language outside supported languages", () => {
    const parsed = localizationSchema.safeParse({
      defaultLanguage: "en",
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
    });

    assert.equal(parsed.success, false);
  });

  it("normalizes supported languages and keeps default language", () => {
    const normalized = normalizeLocalizationSettings({
      defaultLanguage: "en",
      supportedLanguages: ["en"],
      dateLocale: "en-US",
      timeLocale: "en-US",
      numberLocale: "en-US",
      calendarSystem: "gregorian",
      weekStartsOn: "sunday",
      timezone: "UTC",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "12h",
      currency: "USD",
      currencyPosition: "before",
    });

    assert.deepEqual(normalized.supportedLanguages, ["en"]);
    assert.equal(normalized.defaultLanguage, "en");
  });

  it("formats buddhist thai preview values", () => {
    const settings = normalizeLocalizationSettings({
      defaultLanguage: "th",
      supportedLanguages: ["th"],
      dateLocale: "th-TH",
      timeLocale: "th-TH",
      numberLocale: "th-TH",
      calendarSystem: "buddhist",
      weekStartsOn: "monday",
      timezone: "Asia/Bangkok",
      dateFormat: "DD MMM YYYY",
      timeFormat: "24h",
      currency: "THB",
      currencyPosition: "before",
    });

    const preview = getLocalizationPreviewSamples(settings, sampleDate);

    assert.equal(preview.languageLabel, "ไทย");
    assert.match(preview.dateSample, /2569/);
    assert.match(preview.timeSample, /18:45 น\./);
    assert.equal(preview.numberSample, "1,234,567.89");
    assert.equal(preview.currencySample, "฿10,000");
  });

  it("formats german number locale and after currency", () => {
    const settings = normalizeLocalizationSettings({
      defaultLanguage: "en",
      supportedLanguages: ["en", "th"],
      dateLocale: "en-GB",
      timeLocale: "en-GB",
      numberLocale: "de-DE",
      calendarSystem: "gregorian",
      weekStartsOn: "monday",
      timezone: "UTC",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      currency: "THB",
      currencyPosition: "after",
    });

    assert.equal(formatNumberWithSettings(1234.56, settings), "1.234,56");
    assert.equal(formatCurrencyWithSettings(10000, settings), "10.000 บาท");
    assert.equal(formatDateWithSettings(sampleDate, settings), "11/08/2026");
    assert.match(formatTimeWithSettings(sampleDate, settings), /11:45/);
  });

  it("builds locale alternates from supported languages", () => {
    const settings = normalizeLocalizationSettings({
      defaultLanguage: "th",
      supportedLanguages: ["th", "en"],
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
    });

    const alternates = buildLocaleLanguageAlternates("/news", settings, "https://thepaseo.co.th");

    assert.equal(alternates.th, "https://thepaseo.co.th/news");
    assert.equal(alternates.en, "https://thepaseo.co.th/en/news");
  });

  it("formats date ranges using localization settings", () => {
    const settings = normalizeLocalizationSettings({
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
    });

    const start = new Date("2026-08-11T11:45:00.000Z");
    const end = new Date("2026-08-15T11:45:00.000Z");

    assert.match(formatDateRangeWithSettings(start, end, settings), /11\/08\/2569/);
    assert.equal(
      formatDateRangeWithSettings(start, start, settings),
      formatDateRangeWithSettings(start, null, settings),
    );
  });
});
