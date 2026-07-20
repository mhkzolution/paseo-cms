import { prisma } from "@/lib/prisma";

export async function validateStoreZoneAssignment(branchId: string, zoneId: string | null | undefined) {
  if (!zoneId) return true;

  const zone = await prisma.storeZone.findFirst({
    where: {
      id: zoneId,
      deletedAt: null,
      floor: { branchId, deletedAt: null },
    },
    select: { id: true },
  });

  return Boolean(zone);
}

export async function validateStoreLocationAssignment(
  zoneId: string | null | undefined,
  locationId: string | null | undefined,
) {
  if (!locationId) return true;
  if (!zoneId) return false;

  const location = await prisma.storeLocation.findFirst({
    where: { id: locationId, zoneId, deletedAt: null },
    select: { id: true },
  });

  return Boolean(location);
}
