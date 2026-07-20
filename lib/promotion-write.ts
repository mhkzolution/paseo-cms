import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveTagIds } from "@/lib/post-write";

type PromotionSlugClient = Pick<PrismaClient, "promotion"> | Prisma.TransactionClient;

export async function buildUniquePromotionSlug(
  baseSlug: string,
  excludeId?: string,
  client: PromotionSlugClient = prisma,
) {
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await client.promotion.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function syncPromotionRelations(
  tx: Prisma.TransactionClient,
  promotionId: string,
  values: {
    tagIds: string[];
    branchIds: string[];
    relatedPromotionIds: string[];
    alternates: { locale: string; url: string }[];
    faqs: { question: string; answer: string }[];
  },
) {
  await Promise.all([
    tx.promotionTag.deleteMany({ where: { promotionId } }),
    tx.promotionBranch.deleteMany({ where: { promotionId } }),
    tx.promotionRelated.deleteMany({ where: { promotionId } }),
    tx.promotionAlternate.deleteMany({ where: { promotionId } }),
    tx.promotionFaq.deleteMany({ where: { promotionId } }),
  ]);

  await Promise.all([
    values.tagIds.length
      ? tx.promotionTag.createMany({
          data: values.tagIds.map((tagId) => ({ promotionId, tagId })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.branchIds.length
      ? tx.promotionBranch.createMany({
          data: values.branchIds.map((branchId) => ({ promotionId, branchId })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.relatedPromotionIds.length
      ? tx.promotionRelated.createMany({
          data: values.relatedPromotionIds.map((relatedPromotionId, sortOrder) => ({
            promotionId,
            relatedPromotionId,
            sortOrder,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.alternates.length
      ? tx.promotionAlternate.createMany({
          data: values.alternates.map((alternate) => ({ promotionId, ...alternate })),
        })
      : Promise.resolve(),
    values.faqs.length
      ? tx.promotionFaq.createMany({
          data: values.faqs.map((faq, sortOrder) => ({ promotionId, ...faq, sortOrder })),
        })
      : Promise.resolve(),
  ]);
}

export { resolveTagIds };
