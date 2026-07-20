import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AboutPageContent } from "@/features/about/about-page-content";
import type { AppLocale } from "@/i18n/routing";
import { getBannersForPlacement } from "@/lib/banners";
import { getAllBranches } from "@/lib/branches/get-all-branches";
import { withLocaleAlternates } from "@/lib/i18n/locale-alternates";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [settings, t] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getTranslations({ locale, namespace: "about" }),
  ]);

  return withLocaleAlternates(
    {
      title: t("title"),
      description: `${t("title")} — ${settings.siteName}`,
    },
    "/about",
    locale as AppLocale,
    settings.siteUrl || undefined,
  );
}

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [settings, banners, branches] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getBannersForPlacement("about"),
    getAllBranches(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AboutPageContent settings={settings} banners={banners} branches={branches} />
    </main>
  );
}
