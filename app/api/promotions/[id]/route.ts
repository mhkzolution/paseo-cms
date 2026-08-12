import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { AuditModule } from "@/lib/audit-log";
import { forbiddenError, validationError } from "@/lib/content-api";
import { auditContentDelete, auditContentUpdate } from "@/lib/content-audit";
import { buildUniquePromotionSlug, resolveTagIds, syncPromotionRelations } from "@/lib/promotion-write";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { enrichSeoForSave } from "@/lib/seo-content-save";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { promotionSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("promotions");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = promotionSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.promotion.findFirst({
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
  if (!existing) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(parsed.data.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(parsed.data.slug ?? parsed.data.title) || "promotion";
  const slug = await buildUniquePromotionSlug(baseSlug, id);
  const enriched = await enrichSeoForSave(prisma, parsed.data, {
    contentType: "promotion",
    slug,
    isCreate: false,
  });
  const { tagIds, branchIds, relatedPromotionIds, newTags, seo, alternates, faqs, ...promotionInput } = enriched;

  const promotion = await prisma.$transaction(async (tx) => {
    const updated = await tx.promotion.update({
      where: { id },
      data: {
        ...promotionInput,
        slug: enriched.slug,
        readingTimeMinutes: estimateReadingTime(promotionInput.content),
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

    const resolvedTagIds = await resolveTagIds(tx, tagIds, newTags ?? null);
    await syncPromotionRelations(tx, updated.id, {
      tagIds: resolvedTagIds,
      branchIds,
      relatedPromotionIds,
      alternates,
      faqs,
    });

    await persistSeoAudit(tx, { promotionId: updated.id }, toSeoScoreInput(enriched, { contentType: "promotion" }));

    return tx.promotion.findUnique({
      where: { id: updated.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  if (promotion) {
    await auditContentUpdate({
      user: session.user,
      module: AuditModule.PROMOTIONS,
      entityType: "Promotion",
      before: existing,
      after: promotion,
    });
  }

  return NextResponse.json({ promotion });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("promotions");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const existing = await prisma.promotion.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, slug: true },
  });
  if (!existing) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });

  await prisma.promotion.update({ where: { id }, data: { deletedAt: new Date() } });

  await auditContentDelete({
    user: session.user,
    module: AuditModule.PROMOTIONS,
    entityType: "Promotion",
    entity: existing,
  });

  return NextResponse.json({ success: true });
}
