import { prisma } from "@/lib/prisma";

import { BRANCH_SLUGS } from "./branch-config";
import type { BranchRecord } from "./types";

const branchSelect = {
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
} as const;

export async function getAllBranches(): Promise<BranchRecord[]> {
  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    select: branchSelect,
  });

  const order = new Map(BRANCH_SLUGS.map((slug, index) => [slug, index]));

  return branches.sort((a, b) => {
    const aOrder = order.get(a.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
    const bOrder = order.get(b.slug as (typeof BRANCH_SLUGS)[number]) ?? 99;
    return aOrder - bOrder;
  });
}
