import { prisma } from "@/lib/prisma";

export type BrandPartnerPlacement = "home" | "branch1" | "branch2" | "branch3";

const PLACEMENT_FIELD: Record<
  BrandPartnerPlacement,
  "showOnHome" | "showOnBranch1" | "showOnBranch2" | "showOnBranch3"
> = {
  home: "showOnHome",
  branch1: "showOnBranch1",
  branch2: "showOnBranch2",
  branch3: "showOnBranch3",
};

export const BRAND_PARTNER_PLACEMENT_LABELS: Record<BrandPartnerPlacement, string> = {
  home: "หน้าหลัก",
  branch1: "สาขา 1",
  branch2: "สาขา 2",
  branch3: "สาขา 3",
};

export type BrandPartnerLogo = {
  id: string;
  name: string;
  logo: string;
  linkUrl: string | null;
};

export async function getBrandPartnersForPlacement(
  placement: BrandPartnerPlacement,
): Promise<BrandPartnerLogo[]> {
  return prisma.brandPartner.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      [PLACEMENT_FIELD[placement]]: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      logo: true,
      linkUrl: true,
    },
  });
}

export function formatBrandPartnerPlacements(partner: {
  showOnHome: boolean;
  showOnBranch1: boolean;
  showOnBranch2: boolean;
  showOnBranch3: boolean;
}): string[] {
  const placements: string[] = [];
  if (partner.showOnHome) placements.push(BRAND_PARTNER_PLACEMENT_LABELS.home);
  if (partner.showOnBranch1) placements.push(BRAND_PARTNER_PLACEMENT_LABELS.branch1);
  if (partner.showOnBranch2) placements.push(BRAND_PARTNER_PLACEMENT_LABELS.branch2);
  if (partner.showOnBranch3) placements.push(BRAND_PARTNER_PLACEMENT_LABELS.branch3);
  return placements;
}
