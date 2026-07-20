import { getTranslations } from "next-intl/server";

import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { HOME_SECTION_IDS } from "@/lib/home-sections";
import { getStoreCategories } from "@/lib/stores";

import { SiteHeader } from "./site-header";

export async function HomeHeaderLoader() {
  const [settings, storeCategories, t] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getStoreCategories(),
    getTranslations("home"),
  ]);

  const sectionNav = HOME_SECTION_IDS.map((id) => ({
    id,
    label:
      id === "events"
        ? t("eventsTitle")
        : id === "news"
          ? t("newsTitle")
          : id === "introduction"
            ? t("introTitle")
            : id === "directory"
              ? t("directoryTitle")
              : t("membershipTitle"),
  }));

  return (
    <SiteHeader
      sectionNav={sectionNav}
      siteLogo={settings.siteLogo}
      siteName={settings.siteName}
      storeCategories={storeCategories}
      socialLinks={{
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        tiktokUrl: settings.tiktokUrl,
        lineUrl: settings.lineUrl,
      }}
    />
  );
}
