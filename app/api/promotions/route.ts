import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { forbiddenError, validationError } from "@/lib/content-api";
import { buildUniquePromotionSlug, resolveTagIds, syncPromotionRelations } from "@/lib/promotion-write";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { promotionSchema } from "@/validators/content.validator";

const MARKETING_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

export async function GET() {
  const { authorized, status } = await checkRole([...MARKETING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const promotions = await prisma.promotion.findMany({
    where: { deletedAt: null },
    include: {
      author: true,
      seo: true,
      tags: { include: { tag: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  const { authorized, status, session } = await checkRole([...MARKETING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = promotionSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(parsed.data.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(parsed.data.slug ?? parsed.data.title) || "promotion";
  const slug = await buildUniquePromotionSlug(baseSlug);
  const { tagIds, branchIds, relatedPromotionIds, newTags, seo, alternates, faqs, ...promotionInput } = parsed.data;

  const promotion = await prisma.$transaction(async (tx) => {
    const created = await tx.promotion.create({
      data: {
        ...promotionInput,
        slug,
        authorId: session.user.id,
        readingTimeMinutes: estimateReadingTime(promotionInput.content),
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

    await syncPromotionRelations(tx, created.id, {
      tagIds: resolvedTagIds,
      branchIds,
      relatedPromotionIds,
      alternates,
      faqs,
    });

    await persistSeoAudit(tx, { promotionId: created.id }, toSeoScoreInput(parsed.data));

    return tx.promotion.findUnique({
      where: { id: created.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  return NextResponse.json({ promotion }, { status: 201 });
}
