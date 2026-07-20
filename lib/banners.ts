import { prisma } from "@/lib/prisma";

export type BranchBannerPlacement = "branch1" | "branch2" | "branch3";
export type BannerPlacement = "home" | BranchBannerPlacement | "about";

export type BannerScope = "site" | "about";

const PLACEMENT_FIELD: Record<
  BannerPlacement,
  "showOnHome" | "showOnBranch1" | "showOnBranch2" | "showOnBranch3" | "showOnAbout"
> = {
  home: "showOnHome",
  branch1: "showOnBranch1",
  branch2: "showOnBranch2",
  branch3: "showOnBranch3",
  about: "showOnAbout",
};

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  home: "หน้าหลัก",
  branch1: "สาขา 1",
  branch2: "สาขา 2",
  branch3: "สาขา 3",
  about: "About Us",
};

export const BANNER_SCOPE_LABELS: Record<BannerScope, string> = {
  site: "หน้าหลัก / สาขา",
  about: "About Us",
};

export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  linkUrl: string | null;
  linkLabel: string | null;
};

export async function getBannersForPlacement(placement: BannerPlacement): Promise<BannerSlide[]> {
  return prisma.banner.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      [PLACEMENT_FIELD[placement]]: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      image: true,
      linkUrl: true,
      linkLabel: true,
    },
  });
}

export async function getBranchPlacementBySlug(slug: string): Promise<BranchBannerPlacement | null> {
  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });

  const index = branches.findIndex((branch) => branch.slug === slug);
  if (index < 0 || index > 2) return null;

  return `branch${index + 1}` as BranchBannerPlacement;
}

export async function getBranchPlacementLabels(): Promise<Record<"branch1" | "branch2" | "branch3", string>> {
  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { name: true },
    take: 3,
  });

  return {
    branch1: branches[0]?.name ?? "สาขา 1",
    branch2: branches[1]?.name ?? "สาขา 2",
    branch3: branches[2]?.name ?? "สาขา 3",
  };
}

export function formatBannerPlacements(
  banner: {
    showOnHome: boolean;
    showOnBranch1: boolean;
    showOnBranch2: boolean;
    showOnBranch3: boolean;
    showOnAbout: boolean;
  },
  branchLabels?: Record<"branch1" | "branch2" | "branch3", string>,
): string[] {
  const placements: string[] = [];
  if (banner.showOnHome) placements.push(BANNER_PLACEMENT_LABELS.home);
  if (banner.showOnBranch1) placements.push(branchLabels?.branch1 ?? BANNER_PLACEMENT_LABELS.branch1);
  if (banner.showOnBranch2) placements.push(branchLabels?.branch2 ?? BANNER_PLACEMENT_LABELS.branch2);
  if (banner.showOnBranch3) placements.push(branchLabels?.branch3 ?? BANNER_PLACEMENT_LABELS.branch3);
  if (banner.showOnAbout) placements.push(BANNER_PLACEMENT_LABELS.about);
  return placements;
}

export function getBannerScopeWhere(scope: BannerScope) {
  if (scope === "about") {
    return { showOnAbout: true };
  }

  return {
    OR: [{ showOnHome: true }, { showOnBranch1: true }, { showOnBranch2: true }, { showOnBranch3: true }],
  };
}
