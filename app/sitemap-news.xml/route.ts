import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { escapeXml } from "@/lib/seo";

export async function GET() {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);
  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: "PUBLISHED",
      publishedAt: { gte: twoDaysAgo },
      seo: { is: { noindex: false, includeInNewsSitemap: true } },
    },
    include: { seo: true },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${posts
    .map((post) => {
      const publishedAt = post.publishedAt ?? post.createdAt;
      return `<url>
    <loc>${escapeXml(`${baseUrl}/news/${post.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(settings.siteName)}</news:name>
        <news:language>th</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(publishedAt.toISOString())}</news:publication_date>
      <news:title>${escapeXml(post.seo?.seoTitle || post.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("")}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
