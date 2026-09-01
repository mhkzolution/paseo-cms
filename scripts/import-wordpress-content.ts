import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { ensureDefaultPostCategories } from "../lib/categories";
import { extractMediaMetadata } from "../lib/media-metadata";
import { estimateReadingTime, generateSlug } from "../lib/seo";
import { buildUniqueEventSlug, syncEventRelations } from "../lib/event-write";
import { buildUniquePostSlug, syncPostRelations } from "../lib/post-write";

const prisma = new PrismaClient();

const YEAR = process.env.WP_IMPORT_YEAR ?? "2026";
const IMPORT_DIR = path.resolve(__dirname, "wordpress-import");
const PUBLIC_UPLOADS = path.resolve(__dirname, "../public/uploads/wordpress");
const WP_UPLOADS = path.resolve(__dirname, "../../thepaseo_wordpress/wordpress/wp-content/uploads");

type WpCategory = { name: string; slug: string; taxonomy: string };

type WpRecord = {
  wpId: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "PUBLISHED" | "DRAFT";
  publishedAt: string;
  featuredImageRel: string | null;
  featuredImageSource: string | null;
  categories: WpCategory[];
  branchSlugs?: string[];
  eventDate?: string;
  location?: string | null;
};

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1,
  กุมภาพันธ์: 2,
  มีนาคม: 3,
  เมษายน: 4,
  พฤษภาคม: 5,
  มิถุนายน: 6,
  กรกฎาคม: 7,
  สิงหาคม: 8,
  กันยายน: 9,
  ตุลาคม: 10,
  พฤศจิกายน: 11,
  ธันวาคม: 12,
  "ม.ค.": 1,
  "ก.พ.": 2,
  "มี.ค.": 3,
  "เม.ย.": 4,
  "พ.ค.": 5,
  "มิ.ย.": 6,
  "ก.ค.": 7,
  "ส.ค.": 8,
  "ก.ย.": 9,
  "ต.ค.": 10,
  "พ.ย.": 11,
  "ธ.ค.": 12,
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeWpSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function parseThaiEventDates(text: string): { start: Date; end: Date | null } | null {
  const monthPattern = Object.keys(THAI_MONTHS).sort((a, b) => b.length - a.length).join("|");
  const range = text.match(
    new RegExp(`(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})\\s*(${monthPattern})\\s*(\\d{2,4})`, "u"),
  );
  if (range) {
    const monthKey = range[3];
    const month = monthKey ? THAI_MONTHS[monthKey] : undefined;
    if (!month) return null;
    const startDay = Number(range[1]);
    const endDay = Number(range[2]);
    let year = Number(range[4]);
    if (year > 2400) year -= 543;
    if (year < 100) year += 2500 - 543;
    return {
      start: new Date(Date.UTC(year, month - 1, startDay, 10, 0)),
      end: new Date(Date.UTC(year, month - 1, endDay, 20, 0)),
    };
  }

  const single = text.match(new RegExp(`(\\d{1,2})\\s*(${monthPattern})\\s*(\\d{2,4})`, "u"));
  if (single) {
    const monthKey = single[2];
    const month = monthKey ? THAI_MONTHS[monthKey] : undefined;
    if (!month) return null;
    const day = Number(single[1]);
    let year = Number(single[3]);
    if (year > 2400) year -= 543;
    if (year < 100) year += 2500 - 543;
    return { start: new Date(Date.UTC(year, month - 1, day, 10, 0)), end: null };
  }

  return null;
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function originalUploadRel(rel: string) {
  return rel.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "");
}

async function resolveWpFile(rel: string) {
  const candidates = [rel, originalUploadRel(rel)];
  const stem = originalUploadRel(rel);
  const ext = path.extname(stem);
  const withoutExt = stem.slice(0, -ext.length);
  candidates.push(`${withoutExt}-scaled${ext}`);

  for (const candidate of candidates) {
    const absolute = path.join(WP_UPLOADS, candidate);
    if (await pathExists(absolute)) return { rel: candidate, absolute };
  }
  return null;
}

async function copyUpload(rel: string) {
  const resolved = await resolveWpFile(rel);
  if (!resolved) return null;

  const destinationRel = resolved.rel;
  const destinationAbs = path.join(PUBLIC_UPLOADS, destinationRel);
  await mkdir(path.dirname(destinationAbs), { recursive: true });
  if (!(await pathExists(destinationAbs))) {
    await copyFile(resolved.absolute, destinationAbs);
  }
  return `/uploads/wordpress/${destinationRel.split(path.sep).join("/")}`;
}

async function importMedia(publicPath: string, folderId: string | null, originalName: string) {
  const existing = await prisma.media.findFirst({
    where: { path: publicPath, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing.id;

  const absolute = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const buffer = await readFile(absolute);
  const meta = extractMediaMetadata(buffer, {
    mimeType: "",
    originalName,
    mediaType: "IMAGE",
  });

  const created = await prisma.media.create({
    data: {
      folderId,
      filename: path.basename(publicPath),
      path: publicPath,
      type: "IMAGE",
      size: buffer.length,
      originalName: meta.originalName,
      mimeType: meta.mimeType ?? "image/jpeg",
      extension: meta.extension,
      width: meta.width,
      height: meta.height,
    },
    select: { id: true },
  });

  return created.id;
}

async function rewriteContentImages(content: string) {
  const urls = new Set<string>();
  const pattern = /(?:https?:\/\/thepaseo\.co\.th)?\/wp-content\/uploads\/([^"'\\\s>]+)/gi;
  let match: RegExpExecArray | null;
  let rewritten = content;
  const gallery: Array<{ url: string; alt: string | null }> = [];

  while ((match = pattern.exec(content))) {
    if (match[1]) urls.add(match[1]);
  }

  for (const rel of urls) {
    const publicPath = await copyUpload(decodeURIComponent(rel));
    if (!publicPath) continue;
    rewritten = rewritten.replaceAll(`/wp-content/uploads/${rel}`, publicPath);
    rewritten = rewritten.replaceAll(`https://thepaseo.co.th/wp-content/uploads/${rel}`, publicPath);
    gallery.push({ url: publicPath, alt: null });
  }

  return { content: rewritten, gallery };
}

function branchSlugsFromCategories(categories: WpCategory[], explicit?: string[]) {
  const slugs = new Set(explicit ?? []);
  for (const category of categories) {
    const slug = decodeWpSlug(category.slug).toLowerCase();
    if (slug === "mall" || slug === "park" || slug === "town") slugs.add(slug);
  }
  return [...slugs];
}

function postKindFromCategories(categories: WpCategory[]): "NEWS" | "PUBLIC_RELATIONS" {
  const names = categories.map((category) => `${category.name}${decodeWpSlug(category.slug)}`).join(" ");
  if (names.includes("ประชาสัมพันธ์") || names.toLowerCase().includes("public")) {
    return "PUBLIC_RELATIONS";
  }
  return "NEWS";
}

async function loadJson(name: string): Promise<WpRecord[]> {
  const file = path.join(IMPORT_DIR, name);
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as WpRecord[];
}

async function main() {
  await ensureDefaultPostCategories(prisma);

  const author = await prisma.user.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!author) {
    throw new Error("No CMS user found. Seed an admin before importing.");
  }

  const [posts, events, branches, categories] = await Promise.all([
    loadJson("posts.json"),
    loadJson("events.json"),
    prisma.branch.findMany({ where: { deletedAt: null }, select: { id: true, slug: true } }),
    prisma.category.findMany({
      where: { deletedAt: null, scope: "POST" },
      select: { id: true, slug: true, postKind: true },
    }),
  ]);

  const branchBySlug = new Map(branches.map((branch) => [branch.slug, branch.id]));
  const categoryByKind = new Map(
    categories.map((category) => [category.postKind ?? "NEWS", category.id] as const),
  );

  let folder = await prisma.mediaFolder.findFirst({
    where: { slug: `wordpress-${YEAR}`, deletedAt: null },
  });
  if (!folder) {
    folder = await prisma.mediaFolder.create({
      data: { name: `WordPress ${YEAR}`, slug: `wordpress-${YEAR}` },
    });
  }

  let importedPosts = 0;
  let importedEvents = 0;

  for (const post of posts) {
    const title = decodeHtml(post.title).trim();
    const slug = await buildUniquePostSlug(generateSlug(title) || `post-${post.wpId}`);
    const existing = await prisma.post.findFirst({
      where: { OR: [{ slug }, { title }], deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      console.log(`skip post: ${title}`);
      continue;
    }

    const featuredImage = post.featuredImageRel ? await copyUpload(post.featuredImageRel) : null;
    if (featuredImage) {
      await importMedia(featuredImage, folder.id, path.basename(post.featuredImageRel ?? featuredImage));
    }

    const rewritten = await rewriteContentImages(post.content);
    const kind = postKindFromCategories(post.categories);
    const categoryId = categoryByKind.get(kind) ?? categoryByKind.get("NEWS") ?? null;
    const branchIds = branchSlugsFromCategories(post.categories)
      .map((slugName) => branchBySlug.get(slugName))
      .filter((id): id is string => Boolean(id));
    const publishedAt = toDate(post.publishedAt);

    const created = await prisma.post.create({
      data: {
        title,
        slug,
        kind,
        categoryId,
        authorId: author.id,
        excerpt: decodeHtml(post.excerpt),
        content: rewritten.content || `<p>${title}</p>`,
        featuredImage,
        showOnHome: true,
        status: "PUBLISHED",
        publishedAt,
        readingTimeMinutes: estimateReadingTime(rewritten.content),
        seo: {
          create: {
            schemaType: kind === "NEWS" ? "NEWS_ARTICLE" : "ARTICLE",
            includeInSitemap: true,
            includeInNewsSitemap: kind === "NEWS",
            includeInImageSitemap: true,
          },
        },
      },
    });

    await prisma.$transaction((tx) =>
      syncPostRelations(tx, created.id, {
        tagIds: [],
        branchIds,
        relatedPostIds: [],
        alternates: [],
        faqs: [],
        images: rewritten.gallery.filter((image, index, list) => list.findIndex((item) => item.url === image.url) === index),
      }),
    );

    importedPosts += 1;
    console.log(`imported post: ${title}`);
  }

  for (const event of events) {
    const title = decodeHtml(event.title).trim();
    const slug = await buildUniqueEventSlug(generateSlug(title) || `event-${event.wpId}`);
    const existing = await prisma.event.findFirst({
      where: { OR: [{ slug }, { title }], deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      console.log(`skip event: ${title}`);
      continue;
    }

    const featuredImage = event.featuredImageRel ? await copyUpload(event.featuredImageRel) : null;
    if (featuredImage) {
      await importMedia(featuredImage, folder.id, path.basename(event.featuredImageRel ?? featuredImage));
    }

    const rewritten = await rewriteContentImages(event.content);
    const parsedDates = parseThaiEventDates(`${title}\n${event.content}\n${event.excerpt}`);
    const eventDate = parsedDates?.start ?? toDate(event.eventDate || event.publishedAt);
    const eventEndDate = parsedDates?.end ?? null;
    const branchIds = branchSlugsFromCategories(event.categories, event.branchSlugs)
      .map((slugName) => branchBySlug.get(slugName))
      .filter((id): id is string => Boolean(id));
    const publishedAt = toDate(event.publishedAt);

    const created = await prisma.event.create({
      data: {
        title,
        slug,
        authorId: author.id,
        excerpt: decodeHtml(event.excerpt),
        content: rewritten.content || `<p>${title}</p>`,
        featuredImage,
        showOnHome: true,
        status: "PUBLISHED",
        eventDate,
        eventEndDate,
        location: event.location,
        publishedAt,
        readingTimeMinutes: estimateReadingTime(rewritten.content),
        seo: {
          create: {
            schemaType: "EVENT",
            includeInSitemap: true,
            includeInNewsSitemap: false,
            includeInImageSitemap: true,
          },
        },
      },
    });

    await prisma.$transaction((tx) =>
      syncEventRelations(tx, created.id, {
        tagIds: [],
        branchIds,
        relatedEventIds: [],
        alternates: [],
        faqs: [],
        images: rewritten.gallery.filter((image, index, list) => list.findIndex((item) => item.url === image.url) === index),
      }),
    );

    importedEvents += 1;
    console.log(`imported event: ${title}`);
  }

  console.log(`Done. posts=${importedPosts} events=${importedEvents}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
