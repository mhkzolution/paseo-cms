import type { MetadataRoute } from "next";

import { DEFAULT_SETTINGS, getSeoSettings, getSettings, SETTINGS_KEYS } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [settings, seo] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getSeoSettings(),
  ]);
  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const disallow = seo.robots === "noindex,nofollow";

  return {
    rules: {
      userAgent: "*",
      allow: disallow ? undefined : "/",
      disallow: disallow ? "/" : undefined,
    },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-news.xml`,
      `${baseUrl}/sitemap-images.xml`,
    ],
  };
}
