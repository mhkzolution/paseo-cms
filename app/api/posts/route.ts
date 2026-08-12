import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { forbiddenError, validationError } from "@/lib/content-api";
import { resolvePostKindForSave } from "@/lib/categories";
import { buildUniquePostSlug, resolveTagIds, syncPostRelations } from "@/lib/post-write";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { enrichSeoForSave } from "@/lib/seo-content-save";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { postSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("news");
  if (!authorized) return forbiddenError(status);

  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      author: true,
      seo: true,
      tags: { include: { tag: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("news");
  if (!authorized) return forbiddenError(status);

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const resolvedKind = await resolvePostKindForSave(parsed.data.categoryId);
  const postPayload = {
    ...parsed.data,
    kind: resolvedKind ?? parsed.data.kind,
  };

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(postPayload.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(postPayload.slug ?? postPayload.title) || "post";
  const slug = await buildUniquePostSlug(baseSlug);
  const enriched = await enrichSeoForSave(prisma, postPayload, {
    contentType: "post",
    slug,
    isCreate: true,
  });
  const { tagIds, branchIds, relatedPostIds, newTags, seo, alternates, faqs, images, ...postInput } = enriched;

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        ...postInput,
        slug: enriched.slug,
        authorId: session.user.id,
        readingTimeMinutes: estimateReadingTime(postInput.content),
        seo: {
          create: {
            ...seo,
            secondaryKeywords: splitKeywords(seo.secondaryKeywords),
            customJsonLd: customJsonLd ?? Prisma.JsonNull,
          },
        },
      },
    });

    const resolvedTagIds = await resolveTagIds(tx, tagIds, newTags ?? null);

    await syncPostRelations(tx, created.id, {
      tagIds: resolvedTagIds,
      branchIds,
      relatedPostIds,
      alternates,
      faqs,
      images,
    });

    await persistSeoAudit(tx, { postId: created.id }, toSeoScoreInput(enriched, { contentType: "post" }));

    return tx.post.findUnique({
      where: { id: created.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  return NextResponse.json({ post }, { status: 201 });
}
