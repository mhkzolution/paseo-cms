import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { toStoreLocationPersistence } from "@/lib/store-zones/names";
import { storeLocationSchema } from "@/validators/content.validator";

export async function GET(request: Request) {
  const { authorized, status } = await checkModuleAccess("stores");
  if (!authorized) return forbiddenError(status);

  const zoneId = new URL(request.url).searchParams.get("zoneId");

  const locations = await prisma.storeLocation.findMany({
    where: {
      deletedAt: null,
      ...(zoneId ? { zoneId } : {}),
    },
    include: {
      _count: {
        select: {
          stores: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ locations });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("stores");
  if (!authorized) return forbiddenError(status);

  const parsed = storeLocationSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const zone = await prisma.storeZone.findFirst({
    where: { id: parsed.data.zoneId, deletedAt: null },
    select: { id: true },
  });
  if (!zone) {
    return NextResponse.json({ error: "ไม่พบโซนที่เลือก" }, { status: 400 });
  }

  const location = await prisma.storeLocation.create({
    data: toStoreLocationPersistence(parsed.data),
    include: {
      _count: {
        select: {
          stores: { where: { deletedAt: null } },
        },
      },
    },
  });

  return NextResponse.json({ location }, { status: 201 });
}
