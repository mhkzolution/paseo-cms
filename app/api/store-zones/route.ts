import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { toStoreZonePersistence } from "@/lib/store-zones/names";
import { storeZoneSchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

export async function GET(request: Request) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const floorId = new URL(request.url).searchParams.get("floorId");

  const zones = await prisma.storeZone.findMany({
    where: {
      deletedAt: null,
      ...(floorId ? { floorId } : {}),
    },
    include: {
      locations: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: {
        select: {
          stores: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ zones });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = storeZoneSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const floor = await prisma.storeFloor.findFirst({
    where: { id: parsed.data.floorId, deletedAt: null },
    select: { id: true },
  });
  if (!floor) {
    return NextResponse.json({ error: "ไม่พบชั้นที่เลือก" }, { status: 400 });
  }

  const zone = await prisma.storeZone.create({ data: toStoreZonePersistence(parsed.data) });

  return NextResponse.json({ zone }, { status: 201 });
}
