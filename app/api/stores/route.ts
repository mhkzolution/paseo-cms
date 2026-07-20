import { NextResponse } from "next/server";

import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { validateStoreLocationAssignment, validateStoreZoneAssignment } from "@/lib/store-zones/validation";
import { toStorePersistence } from "@/lib/stores/store-names";
import { storeSchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

async function validateStorePlacement(data: {
  branchId: string;
  zoneId?: string | null;
  locationId?: string | null;
}) {
  const zoneValid = await validateStoreZoneAssignment(data.branchId, data.zoneId);
  if (!zoneValid) {
    return "โซนที่เลือกไม่ตรงกับสาขา";
  }

  const locationValid = await validateStoreLocationAssignment(data.zoneId, data.locationId);
  if (!locationValid) {
    return "ที่ตั้งที่เลือกไม่ตรงกับโซน";
  }

  return null;
}

export async function GET() {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const stores = await prisma.store.findMany({
    where: { deletedAt: null },
    include: { branch: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ stores });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = storeSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.store.findFirst({
    where: { slug: parsed.data.slug, deletedAt: null },
    select: { id: true },
  });
  if (existing) return conflictError();

  const placementError = await validateStorePlacement(parsed.data);
  if (placementError) {
    return NextResponse.json({ error: placementError }, { status: 400 });
  }

  const store = await prisma.store.create({ data: toStorePersistence(parsed.data) });

  return NextResponse.json({ store }, { status: 201 });
}
