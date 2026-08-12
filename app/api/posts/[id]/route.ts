import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { AuditModule } from "@/lib/audit-log";
import { forbiddenError, validationError } from "@/lib/content-api";
import { auditContentDelete, auditContentUpdate } from "@/lib/content-audit";
import { resolvePostKindForSave } from "@/lib/categories";
import { buildUniquePostSlug, resolveTagIds, syncPostRelations } from "@/lib/post-write";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { enrichSeoForSave } from "@/lib/seo-content-save";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { postSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("news");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const resolvedKind = await resolvePostKindForSave(parsed.data.categoryId);
  const postPayload = {
    ...parsed.data,
    kind: resolvedKind ?? parsed.data.kind,
  };

  const existing = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: {
      seo: {
        select: {
          seoTitle: true,
          seoDescription: true,
          focusKeyword: true,
          canonicalUrl: true,
          noindex: true,
          nofollow: true,
        },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(postPayload.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(postPayload.slug ?? postPayload.title) || "post";
  const slug = await buildUniquePostSlug(baseSlug, id);
  const slugChanged = existing.slug !== slug;
  const enriched = await enrichSeoForSave(prisma, postPayload, {
    contentType: "post",
    slug,
    isCreate: false,
  });
  const { tagIds, branchIds, relatedPostIds, newTags, seo, alternates, faqs, images, ...postInput } = enriched;

  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({
      where: { id },
      data: {
        ...postInput,
        slug: enriched.slug,
        readingTimeMinutes: estimateReadingTime(postInput.content),
        seo: {
          upsert: {
            create: {
              ...seo,
              secondaryKeywords: splitKeywords(seo.secondaryKeywords),
              customJsonLd: customJsonLd ?? Prisma.JsonNull,
            },
            update: {
              ...seo,
              secondaryKeywords: splitKeywords(seo.secondaryKeywords),
              customJsonLd: customJsonLd ?? Prisma.JsonNull,
            },
          },
        },
      },
    });

    if (slugChanged) {
      await tx.postSlugHistory.upsert({
        where: { oldSlug: existing.slug },
        create: {
          postId: id,
          oldSlug: existing.slug,
          newSlug: slug,
          statusCode: "MOVED_PERMANENTLY",
        },
        update: {
          newSlug: slug,
          statusCode: "MOVED_PERMANENTLY",
        },
      });
      await tx.seoRedirect.upsert({
        where: { fromPath: `/news/${existing.slug}` },
        create: {
          fromPath: `/news/${existing.slug}`,
          toPath: `/news/${slug}`,
          statusCode: "MOVED_PERMANENTLY",
        },
        update: {
          toPath: `/news/${slug}`,
          statusCode: "MOVED_PERMANENTLY",
          isActive: true,
          deletedAt: null,
        },
      });
    }

    const resolvedTagIds = await resolveTagIds(tx, tagIds, newTags ?? null);
    await syncPostRelations(tx, updated.id, {
      tagIds: resolvedTagIds,
      branchIds,
      relatedPostIds,
      alternates,
      faqs,
      images,
    });

    await persistSeoAudit(tx, { postId: updated.id }, toSeoScoreInput(enriched, { contentType: "post" }));

    return tx.post.findUnique({
      where: { id: updated.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  if (post) {
    await auditContentUpdate({
      user: session.user,
      module: AuditModule.POSTS,
      entityType: "Post",
      before: existing,
      after: post,
    });
  }

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("news");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const existing = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, slug: true },
  });
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });

  await auditContentDelete({
    user: session.user,
    module: AuditModule.POSTS,
    entityType: "Post",
    entity: existing,
  });

  return NextResponse.json({ success: true });
}
