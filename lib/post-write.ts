import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateSlug, splitKeywords } from "@/lib/seo";

type PostSlugClient = Pick<PrismaClient, "post"> | Prisma.TransactionClient;

export async function buildUniquePostSlug(baseSlug: string, excludeId?: string, client: PostSlugClient = prisma) {
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await client.post.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function buildUniqueTagSlug(
  tx: Prisma.TransactionClient,
  baseSlug: string,
  excludeId?: string,
) {
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await tx.tag.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function resolveTagIds(
  tx: Prisma.TransactionClient,
  existingTagIds: string[],
  newTags: string | null,
) {
  const resolvedTagIds: string[] = [];
  const names = splitKeywords(newTags);

  for (const name of names) {
    const baseSlug = generateSlug(name) || "tag";

    const existing = await tx.tag.findFirst({
      where: {
        deletedAt: null,
        OR: [{ slug: baseSlug }, { name }],
      },
      select: { id: true, slug: true, name: true },
    });

    if (existing) {
      // Repair legacy Thai slugs that dropped combining marks (สระ/วรรณยุกต์).
      if (existing.slug !== baseSlug && generateSlug(existing.name) === baseSlug) {
        const uniqueSlug = await buildUniqueTagSlug(tx, baseSlug, existing.id);
        await tx.tag.update({ where: { id: existing.id }, data: { slug: uniqueSlug } });
      }
      resolvedTagIds.push(existing.id);
      continue;
    }

    const slug = await buildUniqueTagSlug(tx, baseSlug);
    const tag = await tx.tag.create({ data: { name, slug }, select: { id: true } });
    resolvedTagIds.push(tag.id);
  }

  return [...new Set([...existingTagIds, ...resolvedTagIds])];
}

export async function syncPostRelations(
  tx: Prisma.TransactionClient,
  postId: string,
  values: {
    tagIds: string[];
    branchIds: string[];
    relatedPostIds: string[];
    alternates: { locale: string; url: string }[];
    faqs: { question: string; answer: string }[];
    images: { url: string; alt?: string | null; caption?: string | null }[];
  },
) {
  await Promise.all([
    tx.postTag.deleteMany({ where: { postId } }),
    tx.postBranch.deleteMany({ where: { postId } }),
    tx.postRelated.deleteMany({ where: { postId } }),
    tx.postAlternate.deleteMany({ where: { postId } }),
    tx.postFaq.deleteMany({ where: { postId } }),
    tx.postImage.deleteMany({ where: { postId } }),
  ]);

  await Promise.all([
    values.tagIds.length
      ? tx.postTag.createMany({ data: values.tagIds.map((tagId) => ({ postId, tagId })), skipDuplicates: true })
      : Promise.resolve(),
    values.branchIds.length
      ? tx.postBranch.createMany({
          data: values.branchIds.map((branchId) => ({ postId, branchId })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.relatedPostIds.length
      ? tx.postRelated.createMany({
          data: values.relatedPostIds.map((relatedPostId, sortOrder) => ({ postId, relatedPostId, sortOrder })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    values.alternates.length
      ? tx.postAlternate.createMany({ data: values.alternates.map((alternate) => ({ postId, ...alternate })) })
      : Promise.resolve(),
    values.faqs.length
      ? tx.postFaq.createMany({
          data: values.faqs.map((faq, sortOrder) => ({ postId, ...faq, sortOrder })),
        })
      : Promise.resolve(),
    values.images.length
      ? tx.postImage.createMany({
          data: values.images.map((image, sortOrder) => ({
            postId,
            url: image.url,
            alt: image.alt ?? null,
            caption: image.caption ?? null,
            sortOrder,
          })),
        })
      : Promise.resolve(),
  ]);
}
