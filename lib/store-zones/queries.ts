import { prisma } from "@/lib/prisma";
import { getStoreFloorLabel, getStoreLocationLabel, getStoreZoneLabel } from "@/lib/store-zones/names";

export type StoreFloorOption = {
  id: string;
  label: string;
  sortOrder: number;
  floorPlanImage: string | null;
};

export type StoreZoneOption = {
  id: string;
  floorId: string;
  label: string;
  sortOrder: number;
  floorPlanImage: string | null;
};

export type StoreLocationOption = {
  id: string;
  zoneId: string;
  label: string;
  sortOrder: number;
};

export async function getStoreFloorsForBranch(branchId: string): Promise<StoreFloorOption[]> {
  const floors = await prisma.storeFloor.findMany({
    where: { branchId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return floors.map((floor) => ({
    id: floor.id,
    label: getStoreFloorLabel(floor),
    sortOrder: floor.sortOrder,
    floorPlanImage: floor.floorPlanImage,
  }));
}

export async function getStoreZonesForFloor(floorId: string): Promise<StoreZoneOption[]> {
  const zones = await prisma.storeZone.findMany({
    where: { floorId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return zones.map((zone) => ({
    id: zone.id,
    floorId: zone.floorId,
    label: getStoreZoneLabel(zone),
    sortOrder: zone.sortOrder,
    floorPlanImage: zone.floorPlanImage,
  }));
}

export async function getStoreLocationsForZone(zoneId: string): Promise<StoreLocationOption[]> {
  const locations = await prisma.storeLocation.findMany({
    where: { zoneId, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return locations.map((location) => ({
    id: location.id,
    zoneId: location.zoneId,
    label: getStoreLocationLabel(location),
    sortOrder: location.sortOrder,
  }));
}

export async function getStoreFloorsByBranchIds(branchIds: string[]) {
  const floors = await prisma.storeFloor.findMany({
    where: { branchId: { in: branchIds }, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const floorsByBranch: Record<string, StoreFloorOption[]> = {};
  for (const branchId of branchIds) {
    floorsByBranch[branchId] = [];
  }

  for (const floor of floors) {
    floorsByBranch[floor.branchId]?.push({
      id: floor.id,
      label: getStoreFloorLabel(floor),
      sortOrder: floor.sortOrder,
      floorPlanImage: floor.floorPlanImage,
    });
  }

  return floorsByBranch;
}

export async function getStoreZonesByFloorIds(floorIds: string[]) {
  const zones = await prisma.storeZone.findMany({
    where: { floorId: { in: floorIds }, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const zonesByFloor: Record<string, StoreZoneOption[]> = {};
  for (const floorId of floorIds) {
    zonesByFloor[floorId] = [];
  }

  for (const zone of zones) {
    zonesByFloor[zone.floorId]?.push({
      id: zone.id,
      floorId: zone.floorId,
      label: getStoreZoneLabel(zone),
      sortOrder: zone.sortOrder,
      floorPlanImage: zone.floorPlanImage,
    });
  }

  return zonesByFloor;
}

export async function getStoreLocationsByZoneIds(zoneIds: string[]) {
  const locations = await prisma.storeLocation.findMany({
    where: { zoneId: { in: zoneIds }, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const locationsByZone: Record<string, StoreLocationOption[]> = {};
  for (const zoneId of zoneIds) {
    locationsByZone[zoneId] = [];
  }

  for (const location of locations) {
    locationsByZone[location.zoneId]?.push({
      id: location.id,
      zoneId: location.zoneId,
      label: getStoreLocationLabel(location),
      sortOrder: location.sortOrder,
    });
  }

  return locationsByZone;
}
