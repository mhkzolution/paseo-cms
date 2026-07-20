import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { toStoreLocationPersistence } from "@/lib/store-zones/names";
import { storeLocationSchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = storeLocationSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.storeLocation.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบที่ตั้ง" }, { status: 404 });
  }

  const location = await prisma.storeLocation.update({
    where: { id },
    data: toStoreLocationPersistence(parsed.data),
  });

  return NextResponse.json({ location });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const now = new Date();

  await prisma.$transaction([
    prisma.store.updateMany({
      where: { locationId: id, deletedAt: null },
      data: { locationId: null },
    }),
    prisma.storeLocation.update({
      where: { id },
      data: { deletedAt: now },
    }),
  ]);

  return NextResponse.json({ success: true });
}
