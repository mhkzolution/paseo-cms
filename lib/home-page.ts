import { prisma } from "@/lib/prisma";
import { getBranchThaiName, getBranchEnglishName } from "@/lib/branches/branch-names";
import { BRANCH_SLUGS } from "@/lib/branches/branch-config";
import {
  getPublishedStores,
  getStoreCategories,
  type ArchiveStore,
  type StoreCategory,
} from "@/lib/stores";
import { getStoreFloorLabel, getStoreZoneLabel } from "@/lib/store-zones/names";

export type HomeBranchSummary = {
  slug: string;
  nameTh: string;
  nameEn: string;
  image: string | null;
  address: string | null;
  phone: string | null;
};

export type HomeZoneSummary = {
  id: string;
  name: string;
  sortOrder: number;
  floorPlanImage: string | null;
};

export type HomeFloorSummary = {
  id: string;
  name: string;
  sortOrder: number;
  floorPlanImage: string | null;
  zones: HomeZoneSummary[];
};

export type HomeDirectoryData = {
  branches: HomeBranchSummary[];
  storesByBranch: Record<string, ArchiveStore[]>;
  floorsByBranch: Record<string, HomeFloorSummary[]>;
  categories: StoreCategory[];
};

export async function getHomeBranches(): Promise<HomeBranchSummary[]> {
  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    select: {
      slug: true,
      name: true,
      nameTh: true,
      nameEn: true,
      image: true,
      address: true,
      phone: true,
    },
  });

  const order = new Map(BRANCH_SLUGS.map((slug, index) => [slug, index]));

  return branches
    .map((branch) => ({
      slug: branch.slug,
      nameTh: getBranchThaiName(branch),
      nameEn: getBranchEnglishName(branch),
      image: branch.image,
      address: branch.address,
      phone: branch.phone,
    }))
    .sort((a, b) => {
      const aOrder = order.get(a.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
      const bOrder = order.get(b.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
      return aOrder - bOrder;
    });
}

export async function getHomeDirectoryData(): Promise<HomeDirectoryData> {
  const [branches, categories] = await Promise.all([
    getHomeBranches(),
    getStoreCategories(),
  ]);
  const branchRecords = await prisma.branch.findMany({
    where: { deletedAt: null, slug: { in: branches.map((b) => b.slug) } },
    select: { id: true, slug: true },
  });

  const storesByBranch: Record<string, ArchiveStore[]> = {};
  const floorsByBranch: Record<string, HomeFloorSummary[]> = {};

  const floors = await prisma.storeFloor.findMany({
    where: { branchId: { in: branchRecords.map((branch) => branch.id) }, deletedAt: null },
    include: {
      zones: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  for (const branch of branchRecords) {
    floorsByBranch[branch.slug] = floors
      .filter((floor) => floor.branchId === branch.id)
      .map((floor) => ({
        id: floor.id,
        name: getStoreFloorLabel(floor),
        sortOrder: floor.sortOrder,
        floorPlanImage: floor.floorPlanImage,
        zones: floor.zones.map((zone) => ({
          id: zone.id,
          name: getStoreZoneLabel(zone),
          sortOrder: zone.sortOrder,
          floorPlanImage: zone.floorPlanImage,
        })),
      }));
  }

  await Promise.all(
    branchRecords.map(async (branch) => {
      storesByBranch[branch.slug] = await getPublishedStores({ branchId: branch.id });
    }),
  );

  return { branches, storesByBranch, floorsByBranch, categories };
}
