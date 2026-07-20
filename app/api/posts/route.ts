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

export async function GET() {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
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
  const { authorized, status, session } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(parsed.data.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(parsed.data.slug ?? parsed.data.title) || "post";
  const slug = await buildUniquePostSlug(baseSlug);
  const { tagIds, branchIds, relatedPostIds, newTags, seo, alternates, faqs, images, ...postInput } = parsed.data;

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        ...postInput,
        slug,
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

    await persistSeoAudit(tx, { postId: created.id }, toSeoScoreInput(parsed.data));

    return tx.post.findUnique({
      where: { id: created.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  return NextResponse.json({ post }, { status: 201 });
}
