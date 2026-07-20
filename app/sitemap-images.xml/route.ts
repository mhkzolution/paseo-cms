import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";
import { escapeXml, toAbsoluteUrl } from "@/lib/seo";

export async function GET() {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);
  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: "PUBLISHED",
      OR: [
        { seo: null },
        { seo: { is: { noindex: false, includeInImageSitemap: true } } },
      ],
    },
    include: { seo: true, images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${posts
    .map((post) => {
      const images = [
        post.featuredImage
          ? { url: post.featuredImage, caption: post.coverImageCaption, title: post.coverImageAlt || post.title }
          : null,
        ...post.images.map((image) => ({ url: image.url, caption: image.caption, title: image.alt })),
      ].filter((image): image is { url: string; caption: string | null; title: string | null } => Boolean(image?.url));

      if (!images.length) return "";

      return `<url>
    <loc>${escapeXml(`${baseUrl}/news/${post.slug}`)}</loc>
    ${images
      .map(
        (image) => `<image:image>
      <image:loc>${escapeXml(toAbsoluteUrl(baseUrl, image.url))}</image:loc>
      ${image.title ? `<image:title>${escapeXml(image.title)}</image:title>` : ""}
      ${image.caption ? `<image:caption>${escapeXml(image.caption)}</image:caption>` : ""}
    </image:image>`,
      )
      .join("")}
  </url>`;
    })
    .join("")}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
