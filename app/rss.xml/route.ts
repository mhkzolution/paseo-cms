import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { escapeXml } from "@/lib/seo";

export async function GET() {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);
  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: "PUBLISHED",
      OR: [{ seo: null }, { seo: { is: { noindex: false } } }],
    },
    include: { seo: true, author: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(settings.siteName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(`${settings.siteName} news and updates`)}</description>
    <language>th</language>
    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
    ${posts
      .map((post) => {
        const url = `${baseUrl}/news/${post.slug}`;
        return `<item>
      <title>${escapeXml(post.seo?.seoTitle || post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.seo?.seoDescription || post.excerpt || "")}</description>
      <pubDate>${escapeXml((post.publishedAt ?? post.createdAt).toUTCString())}</pubDate>
      ${post.author?.name ? `<dc:creator>${escapeXml(post.author.name)}</dc:creator>` : ""}
    </item>`;
      })
      .join("")}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
