import { getBannersForPlacement, getBranchPlacementBySlug } from "@/lib/banners";
import { getBrandPartnersForPlacement } from "@/lib/brand-partners";
import { getUpcomingEventsForBranch } from "@/lib/events";
import { getPostArchivesForBranch } from "@/lib/post-archives";
import { ARCHIVE_PROMOTION_LIMIT, getActivePromotionsForBranch } from "@/lib/promotions";
import { prisma } from "@/lib/prisma";
import { parseOperatingHours } from "@/lib/stores/operating-hours";
import { getStoreThaiName } from "@/lib/stores/store-names";

import { getBranchConfig, isBranchSlug } from "./branch-config";
import type { BranchPageData } from "./types";

export async function getBranchPageData(slug: string): Promise<BranchPageData | null> {
  if (!isBranchSlug(slug)) return null;

  const config = getBranchConfig(slug);
  const branch = await prisma.branch.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      nameTh: true,
      nameEn: true,
      slug: true,
      image: true,
      thumbnail: true,
      shortDescription: true,
      address: true,
      phone: true,
      leasingPhone1: true,
      leasingPhone2: true,
      mapsUrl: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!branch) return null;

  const placement = await getBranchPlacementBySlug(slug);

  const [banners, postArchives, stores, events, promotions, brandPartners] = await Promise.all([
    placement ? getBannersForPlacement(placement) : Promise.resolve([]),
    getPostArchivesForBranch(branch.id),
    prisma.store.findMany({
      where: { branchId: branch.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameTh: true,
        nameEn: true,
        slug: true,
        logo: true,
        operatingHours: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: { name: "asc" },
    }),
    getUpcomingEventsForBranch(branch.id, 6),
    getActivePromotionsForBranch(branch.id, ARCHIVE_PROMOTION_LIMIT),
    placement ? getBrandPartnersForPlacement(placement) : Promise.resolve([]),
  ]);

  return {
    branch,
    banners,
    postArchives,
    stores: stores.map((store) => ({
      id: store.id,
      name: getStoreThaiName(store),
      slug: store.slug,
      logo: store.logo,
      operatingHours: parseOperatingHours(store.operatingHours),
      category: store.category,
    })),
    events,
    promotions,
    brandPartners,
    theme: config.theme,
    sections: config.sections,
  };
}
