import type { Prisma, PromotionCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const ARCHIVE_PROMOTION_LIMIT = 48;

export type ArchivePromotion = {
  id: string;
  title: string;
  slug: string;
  category: PromotionCategory;
  featuredImage: string | null;
  coverImageAlt: string | null;
  startDate: Date;
  endDate: Date;
};

const archivePromotionSelect = {
  id: true,
  title: true,
  slug: true,
  category: true,
  featuredImage: true,
  coverImageAlt: true,
  startDate: true,
  endDate: true,
} as const;

function now() {
  return new Date();
}

export function publishedPromotionWhere(
  branchId?: string,
  category?: PromotionCategory,
  showOnHome?: boolean,
): Prisma.PromotionWhereInput {
  const current = now();

  return {
    deletedAt: null,
    status: "PUBLISHED",
    startDate: { lte: current },
    endDate: { gte: current },
    ...(category ? { category } : {}),
    ...(showOnHome ? { showOnHome: true } : {}),
    AND: [
      { OR: [{ seo: null }, { seo: { is: { noindex: false } } }] },
      ...(branchId ? [{ OR: [{ branches: { some: { branchId } } }, { branches: { none: {} } }] }] : []),
    ],
  };
}

export async function getBranchBySlug(slug: string) {
  return prisma.branch.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
}

export async function getPublishedPromotions({
  branchId,
  category,
  showOnHome,
  limit = ARCHIVE_PROMOTION_LIMIT,
  excludeId,
}: {
  branchId?: string;
  category?: PromotionCategory;
  showOnHome?: boolean;
  limit?: number;
  excludeId?: string;
} = {}) {
  return prisma.promotion.findMany({
    where: {
      ...publishedPromotionWhere(branchId, category, showOnHome),
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: archivePromotionSelect,
    orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getActivePromotionsForHome(limit = 6) {
  return getPublishedPromotions({ limit, showOnHome: true });
}

export async function getActivePromotionsForBranch(branchId: string, limit = 6) {
  return getPublishedPromotions({ branchId, limit });
}

export function buildPromotionsHref({
  branch,
  category,
}: {
  branch?: string;
  category?: PromotionCategory | null;
} = {}) {
  const params = new URLSearchParams();
  if (branch) params.set("branch", branch);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/promotions?${query}` : "/promotions";
}

export function formatPromotionDateRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
