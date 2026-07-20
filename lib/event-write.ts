import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveTagIds } from "@/lib/post-write";

type EventSlugClient = Pick<PrismaClient, "event"> | Prisma.TransactionClient;

export async function buildUniqueEventSlug(baseSlug: string, excludeId?: string, client: EventSlugClient = prisma) {
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await client.event.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function syncEventRelations(
  tx: Prisma.TransactionClient,
  eventId: string,
  values: {
    tagIds: string[];
    branchIds: string[];
    relatedEventIds: string[];
    alternates: { locale: string; url: string }[];
    faqs: { question: string; answer: string }[];
    images: { url: string; alt?: string | null; caption?: string | null }[];
  },
) {
  await Promise.all([
    tx.eventTag.deleteMany({ where: { eventId } }),
    tx.eventBranch.deleteMany({ where: { eventId } }),
    tx.eventRelated.deleteMany({ where: { eventId } }),
    tx.eventAlternate.deleteMany({ where: { eventId } }),
    tx.eventFaq.deleteMany({ where: { eventId } }),
    tx.eventImage.deleteMany({ where: { eventId } }),
  ]);

  await Promise.all([
    values.tagIds.length
      ? tx.eventTag.createMany({ data: values.tagIds.map((tagId) => ({ eventId, tagId })), skipDuplicates: true })
      : Promise.resolve(),
    values.branchIds.length
      ? tx.eventBranch.createMany({
          data: values.branchIds.map((branchId) => ({ eventId, branchId })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.relatedEventIds.length
      ? tx.eventRelated.createMany({
          data: values.relatedEventIds.map((relatedEventId, sortOrder) => ({ eventId, relatedEventId, sortOrder })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.alternates.length
      ? tx.eventAlternate.createMany({ data: values.alternates.map((alternate) => ({ eventId, ...alternate })) })
      : Promise.resolve(),
    values.faqs.length
      ? tx.eventFaq.createMany({
          data: values.faqs.map((faq, sortOrder) => ({ eventId, ...faq, sortOrder })),
        })
      : Promise.resolve(),
    values.images.length
      ? tx.eventImage.createMany({
          data: values.images.map((image, sortOrder) => ({
            eventId,
            url: image.url,
            alt: image.alt ?? null,
            caption: image.caption ?? null,
            sortOrder,
          })),
        })
      : Promise.resolve(),
  ]);
}

export { resolveTagIds };
