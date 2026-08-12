import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { AuditModule } from "@/lib/audit-log";
import { forbiddenError, validationError } from "@/lib/content-api";
import { auditContentCreate } from "@/lib/content-audit";
import { buildUniqueEventSlug, resolveTagIds, syncEventRelations } from "@/lib/event-write";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { enrichSeoForSave } from "@/lib/seo-content-save";
import { persistSeoAudit, toSeoScoreInput } from "@/lib/seo-audit";
import { estimateReadingTime, generateSlug, parseJsonObject, splitKeywords } from "@/lib/seo";
import { eventSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("events");
  if (!authorized) return forbiddenError(status);

  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    include: {
      author: true,
      seo: true,
      tags: { include: { tag: true } },
      branches: { include: { branch: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("events");
  if (!authorized) return forbiddenError(status);

  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  let customJsonLd = null;
  try {
    customJsonLd = parseJsonObject(parsed.data.seo.customJsonLd);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON-LD" }, { status: 422 });
  }

  const baseSlug = generateSlug(parsed.data.slug ?? parsed.data.title) || "event";
  const slug = await buildUniqueEventSlug(baseSlug);
  const enriched = await enrichSeoForSave(prisma, parsed.data, {
    contentType: "event",
    slug,
    isCreate: true,
  });
  const { tagIds, branchIds, relatedEventIds, newTags, seo, alternates, faqs, images, ...eventInput } = enriched;

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        ...eventInput,
        slug: enriched.slug,
        authorId: session.user.id,
        readingTimeMinutes: estimateReadingTime(eventInput.content),
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

    await syncEventRelations(tx, created.id, {
      tagIds: resolvedTagIds,
      branchIds,
      relatedEventIds,
      alternates,
      faqs,
      images,
    });

    await persistSeoAudit(tx, { eventId: created.id }, toSeoScoreInput(enriched, { contentType: "event" }));

    return tx.event.findUnique({
      where: { id: created.id },
      include: { seo: true, tags: { include: { tag: true } }, branches: { include: { branch: true } } },
    });
  });

  if (event) {
    await auditContentCreate({
      user: session.user,
      module: AuditModule.EVENTS,
      entityType: "Event",
      entity: event,
    });
  }

  return NextResponse.json({ event }, { status: 201 });
}
