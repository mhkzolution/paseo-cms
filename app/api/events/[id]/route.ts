import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { AuditModule } from "@/lib/audit-log";
import { forbiddenError, validationError } from "@/lib/content-api";
import { auditContentDelete, auditContentUpdate } from "@/lib/content-audit";
import { buildUniqueEventSlug, resolveTagIds, syncEventRelations } from "@/lib/event-write";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { enrichSeoForSave } from "@/lib/seo-content-save";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { eventSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("events");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.event.findFirst({
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
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(parsed.data.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(parsed.data.slug ?? parsed.data.title) || "event";
  const slug = await buildUniqueEventSlug(baseSlug, id);
  const enriched = await enrichSeoForSave(prisma, parsed.data, {
    contentType: "event",
    slug,
    isCreate: false,
  });
  const { tagIds, branchIds, relatedEventIds, newTags, seo, alternates, faqs, images, ...eventInput } = enriched;

  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({
      where: { id },
      data: {
        ...eventInput,
        slug: enriched.slug,
        readingTimeMinutes: estimateReadingTime(eventInput.content),
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
    await syncEventRelations(tx, updated.id, {
      tagIds: resolvedTagIds,
      branchIds,
      relatedEventIds,
      alternates,
      faqs,
      images,
    });

    await persistSeoAudit(tx, { eventId: updated.id }, toSeoScoreInput(enriched, { contentType: "event" }));

    return tx.event.findUnique({
      where: { id: updated.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  if (event) {
    await auditContentUpdate({
      user: session.user,
      module: AuditModule.EVENTS,
      entityType: "Event",
      before: existing,
      after: event,
    });
  }

  return NextResponse.json({ event });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("events");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const existing = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, slug: true },
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });

  await auditContentDelete({
    user: session.user,
    module: AuditModule.EVENTS,
    entityType: "Event",
    entity: existing,
  });

  return NextResponse.json({ success: true });
}
