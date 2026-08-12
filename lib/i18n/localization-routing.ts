import { routing, type AppLocale } from "@/i18n/routing";
import { getSupportedAppLocales, isAppLocale, type LocalizationSettings } from "@/lib/localization-settings";

export function resolveLocalizationRouting(settings: LocalizationSettings) {
  const supportedLocales = getSupportedAppLocales(settings);
  const defaultLocale = isAppLocale(settings.defaultLanguage) ? settings.defaultLanguage : routing.defaultLocale;

  return {
    locales: supportedLocales.length > 0 ? supportedLocales : routing.locales,
    defaultLocale,
  };
}

export function buildLocalePath(pathname: string, locale: AppLocale, defaultLocale: AppLocale) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (locale === defaultLocale) {
    return normalized === "" ? "/" : normalized;
  }

  if (normalized === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalized}`;
}

export function buildLocaleLanguageAlternates(
  pathname: string,
  settings: LocalizationSettings,
  siteUrl?: string,
) {
  const { locales, defaultLocale } = resolveLocalizationRouting(settings);
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    const path = buildLocalePath(pathname, locale, defaultLocale);
    languages[locale] = siteUrl ? `${siteUrl.replace(/\/$/, "")}${path}` : path;
  }

  return languages;
}
