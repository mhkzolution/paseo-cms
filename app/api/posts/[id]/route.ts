import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { forbiddenError, validationError } from "@/lib/content-api";
import { buildUniquePostSlug, resolveTagIds, syncPostRelations } from "@/lib/post-write";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { postSchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const current = await prisma.post.findFirst({ where: { id, deletedAt: null }, select: { id: true, slug: true } });
  if (!current) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(parsed.data.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(parsed.data.slug ?? parsed.data.title) || "post";
  const slug = await buildUniquePostSlug(baseSlug, id);
  const slugChanged = current.slug !== slug;
  const { tagIds, branchIds, relatedPostIds, newTags, seo, alternates, faqs, images, ...postInput } = parsed.data;

  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({
      where: { id },
      data: {
        ...postInput,
        slug,
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
        where: { oldSlug: current.slug },
        create: {
          postId: id,
          oldSlug: current.slug,
          newSlug: slug,
          statusCode: "MOVED_PERMANENTLY",
        },
        update: {
          newSlug: slug,
          statusCode: "MOVED_PERMANENTLY",
        },
      });
      await tx.seoRedirect.upsert({
        where: { fromPath: `/news/${current.slug}` },
        create: {
          fromPath: `/news/${current.slug}`,
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

    await persistSeoAudit(tx, { postId: updated.id }, toSeoScoreInput(parsed.data));

    return tx.post.findUnique({
      where: { id: updated.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
