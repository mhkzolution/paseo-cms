import type { Prisma } from "@prisma/client";

import { BRANCH_SLUGS, DEFAULT_STORE_BRANCH_SLUG } from "@/lib/branches/branch-config";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import { prisma } from "@/lib/prisma";
import { decodeSlugParam, slugMatchesStored } from "@/lib/slug";
import { parseOperatingHours, type StoreOperatingHour } from "@/lib/stores/operating-hours";
import { getStoreFloorLabel, getStoreLocationLabel, getStoreZoneLabel } from "@/lib/store-zones/names";
import { getStoreThaiName } from "@/lib/stores/store-names";

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  color: string | null;
  sortOrder: number;
  storeCount: number;
};

export type StoreBranch = {
  slug: string;
  label: string;
  image: string | null;
  storeCount: number;
};

export type ArchiveStore = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  cover: string | null;
  description: string | null;
  floorId: string | null;
  floor: string | null;
  zoneId: string | null;
  zone: string | null;
  location: string | null;
  operatingHours: StoreOperatingHour[];
  category: { name: string; slug: string; color: string | null; image?: string | null } | null;
  branch: { name: string; slug: string; image?: string | null };
};

export type StoreDetail = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  cover: string | null;
  description: string | null;
  phone1: string | null;
  phone2: string | null;
  zoneId: string | null;
  locationId: string | null;
  floorId: string | null;
  floor: string | null;
  zone: string | null;
  location: string | null;
  storeType: string | null;
  operatingHours: StoreOperatingHour[];
  category: { name: string; slug: string; color: string | null; image?: string | null } | null;
  branch: { name: string; slug: string; image?: string | null };
};

const archiveStoreSelect = {
  id: true,
  name: true,
  nameTh: true,
  nameEn: true,
  slug: true,
  logo: true,
  cover: true,
  description: true,
  zoneId: true,
  operatingHours: true,
  storeZone: {
    select: {
      id: true,
      floorId: true,
      name: true,
      nameTh: true,
      nameEn: true,
      floor: { select: { id: true, name: true, nameTh: true, nameEn: true } },
    },
  },
  storeLocation: { select: { id: true, name: true, nameTh: true, nameEn: true } },
  category: { select: { name: true, slug: true, color: true, image: true } },
  branch: { select: { name: true, nameTh: true, nameEn: true, slug: true, image: true } },
} as const;

const storeDetailSelect = {
  id: true,
  name: true,
  nameTh: true,
  nameEn: true,
  slug: true,
  logo: true,
  cover: true,
  description: true,
  phone1: true,
  phone2: true,
  zoneId: true,
  locationId: true,
  storeType: true,
  operatingHours: true,
  storeZone: {
    select: {
      id: true,
      floorId: true,
      name: true,
      nameTh: true,
      nameEn: true,
      floor: { select: { id: true, name: true, nameTh: true, nameEn: true } },
    },
  },
  storeLocation: { select: { id: true, name: true, nameTh: true, nameEn: true } },
  category: { select: { name: true, slug: true, color: true, image: true } },
  branch: { select: { name: true, nameTh: true, nameEn: true, slug: true, image: true } },
} as const;

function mapArchiveStore(store: Prisma.StoreGetPayload<{ select: typeof archiveStoreSelect }>): ArchiveStore {
  return {
    id: store.id,
    name: getStoreThaiName(store),
    slug: store.slug,
    logo: store.logo,
    cover: store.cover,
    description: store.description,
    zoneId: store.zoneId,
    floorId: store.storeZone?.floorId ?? store.storeZone?.floor?.id ?? null,
    floor: store.storeZone?.floor ? getStoreFloorLabel(store.storeZone.floor) : null,
    zone: store.storeZone ? getStoreZoneLabel(store.storeZone) : null,
    location: store.storeLocation ? getStoreLocationLabel(store.storeLocation) : null,
    operatingHours: parseOperatingHours(store.operatingHours),
    category: store.category,
    branch: {
      name: getBranchThaiName(store.branch),
      slug: store.branch.slug,
      image: store.branch.image,
    },
  };
}

function mapStoreDetail(store: Prisma.StoreGetPayload<{ select: typeof storeDetailSelect }>): StoreDetail {
  return {
    id: store.id,
    name: getStoreThaiName(store),
    slug: store.slug,
    logo: store.logo,
    cover: store.cover,
    description: store.description,
    phone1: store.phone1,
    phone2: store.phone2,
    zoneId: store.zoneId,
    locationId: store.locationId,
    floorId: store.storeZone?.floorId ?? store.storeZone?.floor?.id ?? null,
    floor: store.storeZone?.floor ? getStoreFloorLabel(store.storeZone.floor) : null,
    zone: store.storeZone ? getStoreZoneLabel(store.storeZone) : null,
    location: store.storeLocation ? getStoreLocationLabel(store.storeLocation) : null,
    storeType: store.storeType,
    operatingHours: parseOperatingHours(store.operatingHours),
    category: store.category,
    branch: {
      name: getBranchThaiName(store.branch),
      slug: store.branch.slug,
      image: store.branch.image,
    },
  };
}

export async function getStoreCategories(branchId?: string): Promise<StoreCategory[]> {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, scope: "STORE" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      color: true,
      sortOrder: true,
      _count: {
        select: {
          stores: {
            where: {
              deletedAt: null,
              ...(branchId ? { branchId } : {}),
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      color: category.color,
      sortOrder: category.sortOrder,
      storeCount: category._count.stores,
    }))
    .filter((category) => category.storeCount > 0);
}

export async function getStoreBranches(): Promise<StoreBranch[]> {
  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    select: {
      name: true,
      nameTh: true,
      nameEn: true,
      slug: true,
      image: true,
      _count: { select: { stores: { where: { deletedAt: null } } } },
    },
  });

  const order = new Map(BRANCH_SLUGS.map((slug, index) => [slug, index]));

  return branches
    .map((branch) => ({
      slug: branch.slug,
      label: getBranchThaiName(branch),
      image: branch.image,
      storeCount: branch._count.stores,
    }))
    .filter((branch) => branch.storeCount > 0)
    .sort((a, b) => {
      const aOrder = order.get(a.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
      const bOrder = order.get(b.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
      return aOrder - bOrder;
    });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, deletedAt: null, scope: "STORE" },
    select: { id: true, name: true, slug: true, image: true, color: true, sortOrder: true },
  });
}

export function publishedStoreWhere(categoryId?: string, branchId?: string): Prisma.StoreWhereInput {
  return {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(branchId ? { branchId } : {}),
  };
}

export async function getPublishedStores(options?: { categorySlug?: string; branchId?: string }) {
  const category = options?.categorySlug ? await getCategoryBySlug(options.categorySlug) : null;

  const stores = await prisma.store.findMany({
    where: publishedStoreWhere(category?.id, options?.branchId),
    select: archiveStoreSelect,
    orderBy: { name: "asc" },
  });

  return stores.map(mapArchiveStore);
}

export async function getStoreBySlug(rawSlug: string) {
  const slug = decodeSlugParam(rawSlug);

  const direct = await prisma.store.findFirst({
    where: { slug, deletedAt: null },
    select: storeDetailSelect,
  });

  if (direct) return mapStoreDetail(direct);

  const candidates = await prisma.store.findMany({
    where: { deletedAt: null },
    select: storeDetailSelect,
    take: 2000,
  });

  const matched = candidates.find((item) => slugMatchesStored(item.slug, slug));
  return matched ? mapStoreDetail(matched) : null;
}

export function buildStoresHref(query?: { category?: string; branch?: string }) {
  const params = new URLSearchParams();
  if (query?.category) params.set("category", query.category);
  params.set("branch", query?.branch ?? DEFAULT_STORE_BRANCH_SLUG);
  return `/stores?${params.toString()}`;
}

export function buildStoreDetailHref(
  storeSlug: string,
  query?: { category?: string; branch?: string },
) {
  const params = new URLSearchParams();
  if (query?.category) params.set("category", query.category);
  if (query?.branch) params.set("branch", query.branch);
  const qs = params.toString();
  return qs ? `/stores/${storeSlug}?${qs}` : `/stores/${storeSlug}`;
}

export { DEFAULT_STORE_BRANCH_SLUG };
