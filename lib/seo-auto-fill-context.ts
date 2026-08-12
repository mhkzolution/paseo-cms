import type { PrismaClient } from "@prisma/client";

import { splitKeywords } from "@/lib/seo";

type PrismaLike = Pick<PrismaClient, "tag" | "category">;

export type AutoFillContextInput = {
  tagIds: string[];
  newTags?: string | null;
  categoryId?: string | null;
  promotionCategory?: string | null;
  slug: string;
  isCreate: boolean;
};

export type AutoFillContext = {
  primaryTagName: string | null;
  categoryName: string | null;
  slug: string;
  isCreate: boolean;
};

export const PROMOTION_CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food",
  DRINKS_BAKERY: "Drinks & Bakery",
  MISC: "Misc",
  EDUCATION: "Education",
};

export async function resolveAutoFillContext(
  client: PrismaLike,
  input: AutoFillContextInput,
): Promise<AutoFillContext> {
  let primaryTagName: string | null = null;

  const newTagNames = splitKeywords(input.newTags);
  if (newTagNames.length > 0) {
    primaryTagName = newTagNames[0] ?? null;
  } else if (input.tagIds.length > 0) {
    const tag = await client.tag.findFirst({
      where: { id: input.tagIds[0], deletedAt: null },
      select: { name: true },
    });
    primaryTagName = tag?.name ?? null;
  }

  let categoryName: string | null = null;
  if (input.categoryId) {
    const category = await client.category.findFirst({
      where: { id: input.categoryId, deletedAt: null },
      select: { name: true },
    });
    categoryName = category?.name ?? null;
  } else if (input.promotionCategory) {
    categoryName = PROMOTION_CATEGORY_LABELS[input.promotionCategory] ?? input.promotionCategory;
  }

  return {
    primaryTagName,
    categoryName,
    slug: input.slug,
    isCreate: input.isCreate,
  };
}
