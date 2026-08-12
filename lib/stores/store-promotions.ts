import { generateSlug } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { publishedPromotionWhere } from "@/lib/promotions";

type StorePromotionTarget = {
  id: string;
  name: string;
  slug: string;
};

function normalizeMatchValue(value: string) {
  return value.normalize("NFC").trim().toLowerCase();
}

function tagMatchesStore(tag: { name: string; slug: string }, store: StorePromotionTarget) {
  const tagName = normalizeMatchValue(tag.name);
  const tagSlug = normalizeMatchValue(tag.slug);
  const storeName = normalizeMatchValue(store.name);
  const storeSlug = normalizeMatchValue(store.slug);
  const storeNameSlug = normalizeMatchValue(generateSlug(store.name));

  return (
    tagName === storeName ||
    tagSlug === storeSlug ||
    tagSlug === storeNameSlug ||
    tagName === storeSlug
  );
}

/**
 * Maps store IDs to a short promotion badge label using CMS promotion tags.
 * Promotions linked to a store name/slug via tags show "โปรโมชัน" on directory cards.
 */
export async function getStorePromotionLabels(
  stores: StorePromotionTarget[],
  branchId?: string,
): Promise<Record<string, string>> {
  if (!stores.length) return {};

  const promotions = await prisma.promotion.findMany({
    where: publishedPromotionWhere(branchId),
    select: {
      title: true,
      tags: {
        select: {
          tag: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const labels: Record<string, string> = {};

  for (const store of stores) {
    const match = promotions.find((promotion) =>
      promotion.tags.some(({ tag }) => tagMatchesStore(tag, store)),
    );

    if (match) {
      labels[store.id] = "โปรโมชัน";
    }
  }

  return labels;
}
