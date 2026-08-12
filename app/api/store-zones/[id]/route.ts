import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { toStoreZonePersistence } from "@/lib/store-zones/names";
import { storeZoneSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("stores");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = storeZoneSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.storeZone.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบโซน" }, { status: 404 });
  }

  const zone = await prisma.storeZone.update({
    where: { id },
    data: toStoreZonePersistence(parsed.data),
  });

  return NextResponse.json({ zone });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("stores");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const now = new Date();

  await prisma.$transaction([
    prisma.store.updateMany({
      where: { zoneId: id, deletedAt: null },
      data: { zoneId: null, locationId: null },
    }),
    prisma.storeLocation.updateMany({
      where: { zoneId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.storeZone.update({
      where: { id },
      data: { deletedAt: now },
    }),
  ]);

  return NextResponse.json({ success: true });
}
