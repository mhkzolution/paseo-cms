import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);
  const baseUrl = settings.siteUrl.replace(/\/$/, "");

  const [posts, events, promotions, branches, stores] = await Promise.all([
    prisma.post.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        OR: [
          { seo: null },
          { seo: { is: { noindex: false, includeInSitemap: true } } },
        ],
      },
      select: { slug: true, updatedAt: true, seo: true },
    }),
    prisma.event.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.promotion.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.branch.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.store.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    ...posts.map((post) => ({
      url: `${baseUrl}/news/${post.slug}`,
      lastModified: post.updatedAt,
      priority: post.seo?.sitemapPriority ?? undefined,
      changeFrequency: post.seo?.changeFrequency?.toLowerCase() as MetadataRoute.Sitemap[number]["changeFrequency"],
    })),
    ...events.map((event) => ({ url: `${baseUrl}/events/${event.slug}`, lastModified: event.updatedAt })),
    ...promotions.map((promotion) => ({
      url: `${baseUrl}/promotions/${promotion.slug}`,
      lastModified: promotion.updatedAt,
    })),
    ...branches.map((branch) => ({ url: `${baseUrl}/branches/${branch.slug}`, lastModified: branch.updatedAt })),
    ...stores.map((store) => ({ url: `${baseUrl}/stores/${store.slug}`, lastModified: store.updatedAt })),
  ];
}
