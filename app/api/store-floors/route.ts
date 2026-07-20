import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { toStoreFloorPersistence } from "@/lib/store-zones/names";
import { storeFloorSchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

export async function GET(request: Request) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const branchId = new URL(request.url).searchParams.get("branchId");

  const floors = await prisma.storeFloor.findMany({
    where: {
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      zones: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          locations: {
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              _count: {
                select: {
                  stores: { where: { deletedAt: null } },
                },
              },
            },
          },
          _count: {
            select: {
              stores: { where: { deletedAt: null } },
            },
          },
        },
      },
      _count: {
        select: {
          zones: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ floors });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = storeFloorSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, deletedAt: null },
    select: { id: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "ไม่พบสาขาที่เลือก" }, { status: 400 });
  }

  const floor = await prisma.storeFloor.create({ data: toStoreFloorPersistence(parsed.data) });

  return NextResponse.json({ floor }, { status: 201 });
}
