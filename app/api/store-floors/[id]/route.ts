import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { toStoreFloorPersistence } from "@/lib/store-zones/names";
import { storeFloorSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("stores");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = storeFloorSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.storeFloor.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบชั้น" }, { status: 404 });
  }

  const floor = await prisma.storeFloor.update({
    where: { id },
    data: toStoreFloorPersistence(parsed.data),
  });

  return NextResponse.json({ floor });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("stores");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const now = new Date();

  const zoneIds = (
    await prisma.storeZone.findMany({
      where: { floorId: id, deletedAt: null },
      select: { id: true },
    })
  ).map((zone) => zone.id);

  await prisma.$transaction([
    prisma.store.updateMany({
      where: { zoneId: { in: zoneIds }, deletedAt: null },
      data: { zoneId: null, locationId: null },
    }),
    prisma.storeLocation.updateMany({
      where: { zoneId: { in: zoneIds }, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.storeZone.updateMany({
      where: { floorId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.storeFloor.update({
      where: { id },
      data: { deletedAt: now },
    }),
  ]);

  return NextResponse.json({ success: true });
}
