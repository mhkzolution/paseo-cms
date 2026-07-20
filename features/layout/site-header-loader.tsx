import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { getStoreCategories } from "@/lib/stores";

import { SiteHeader } from "./site-header";

type SiteHeaderLoaderProps = {
  activeHref?: string;
};

export async function SiteHeaderLoader({ activeHref }: SiteHeaderLoaderProps) {
  const [settings, storeCategories] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getStoreCategories(),
  ]);

  return (
    <SiteHeader
      activeHref={activeHref}
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
