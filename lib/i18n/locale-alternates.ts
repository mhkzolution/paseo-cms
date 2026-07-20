import type { Metadata } from "next";

import { routing, type AppLocale } from "@/i18n/routing";

function localizedPath(pathname: string, locale: AppLocale) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return normalized === "" ? "/" : normalized;
  }
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

function absoluteUrl(path: string, siteUrl?: string) {
  if (!siteUrl) return path;
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return `${base}${path}`;
}

export function localeLanguageAlternates(pathname: string, siteUrl?: string) {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(localizedPath(pathname, locale), siteUrl);
  }

  return languages;
}

export function withLocaleAlternates(
  metadata: Metadata,
  pathname: string,
  locale: AppLocale | string,
  siteUrl?: string,
): Metadata {
  const languages = localeLanguageAlternates(pathname, siteUrl);
  const canonical = absoluteUrl(localizedPath(pathname, locale as AppLocale), siteUrl);

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical,
      languages,
    },
  };
}
