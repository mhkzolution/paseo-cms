import { prisma } from "@/lib/prisma";
import type { ArchiveEvent } from "@/lib/events";
import type { ArchivePost } from "@/lib/post-archives";
import type { ArchivePromotion } from "@/lib/promotions";
import { generateSlug } from "@/lib/seo";
import { getPublishedStores, type ArchiveStore } from "@/lib/stores";

export type TagContent = {
  tag: { id: string; name: string; slug: string; description: string | null };
  posts: ArchivePost[];
  stores: ArchiveStore[];
  events: ArchiveEvent[];
  promotions: ArchivePromotion[];
};

const publishedVisibleFilter = {
  deletedAt: null,
  status: "PUBLISHED" as const,
  OR: [{ seo: null }, { seo: { is: { noindex: false } } }],
};

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
} as const;

/** Previous slugifier that turned Thai combining marks into hyphens. */
function legacyGenerateSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function stripMarks(value: string) {
  return value.normalize("NFC").replace(/\p{M}/gu, "");
}

function decodeSlugParam(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC");
  } catch {
    return value.normalize("NFC");
  }
}

export function buildTagHref(slug: string) {
  return `/tags/${slug}`;
}

async function ensureCanonicalTagSlug(tag: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}) {
  const canonical = generateSlug(tag.name) || "tag";
  if (tag.slug === canonical) return tag;

  let candidate = canonical;
  let suffix = 2;
  while (
    await prisma.tag.findFirst({
      where: { slug: candidate, NOT: { id: tag.id } },
      select: { id: true },
    })
  ) {
    candidate = `${canonical}-${suffix}`;
    suffix += 1;
  }

  return prisma.tag.update({
    where: { id: tag.id },
    data: { slug: candidate },
    select: tagSelect,
  });
}

function tagMatchesSlug(
  tag: { name: string; slug: string },
  slug: string,
) {
  const canonical = generateSlug(tag.name);
  return (
    tag.slug === slug ||
    canonical === slug ||
    legacyGenerateSlug(tag.name) === slug ||
    stripMarks(tag.slug) === stripMarks(slug) ||
    stripMarks(canonical) === stripMarks(slug)
  );
}

export async function getTagBySlug(rawSlug: string) {
  const slug = decodeSlugParam(rawSlug);

  const direct = await prisma.tag.findFirst({
    where: { slug, deletedAt: null },
    select: tagSelect,
  });
  if (direct) return ensureCanonicalTagSlug(direct);

  // Match legacy broken Thai slugs / mark-stripped URL variants.
  const candidates = await prisma.tag.findMany({
    where: { deletedAt: null },
    select: tagSelect,
    take: 500,
  });

  const matched = candidates.find((tag) => tagMatchesSlug(tag, slug)) ?? null;
  return matched ? ensureCanonicalTagSlug(matched) : null;
}

export async function getContentByTagSlug(slug: string): Promise<TagContent | null> {
  const tag = await getTagBySlug(slug);
  if (!tag) return null;

  const [posts, events, promotions, matchingCategory] = await Promise.all([
    prisma.post.findMany({
      where: {
        ...publishedVisibleFilter,
        tags: { some: { tagId: tag.id } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        coverImageAlt: true,
        kind: true,
        publishedAt: true,
        category: { select: { name: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
    prisma.event.findMany({
      where: {
        ...publishedVisibleFilter,
        tags: { some: { tagId: tag.id } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        coverImageAlt: true,
        eventDate: true,
        eventEndDate: true,
        location: true,
      },
      orderBy: [{ eventDate: "desc" }],
      take: 24,
    }),
    prisma.promotion.findMany({
      where: {
        ...publishedVisibleFilter,
        tags: { some: { tagId: tag.id } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        featuredImage: true,
        coverImageAlt: true,
        startDate: true,
        endDate: true,
      },
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
      take: 24,
    }),
    // Stores have no Tag relation — match store category by tag slug or name.
    prisma.category.findFirst({
      where: {
        deletedAt: null,
        OR: [{ slug: tag.slug }, { name: tag.name }],
      },
      select: { slug: true },
    }),
  ]);

  const stores = matchingCategory
    ? (await getPublishedStores({ categorySlug: matchingCategory.slug })).slice(0, 24)
    : [];

  return {
    tag,
    posts,
    stores,
    events,
    promotions,
  };
}
