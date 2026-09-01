import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PublicThePaseoLifePost = {
  id: string;
  image: string;
  title: string;
  description: string | null;
  linkUrl: string;
  openInNewTab: boolean;
  sortOrder: number;
};

const publicOrderBy = [
  { sortOrder: "asc" as const },
  { publishedAt: "desc" as const },
  { createdAt: "desc" as const },
];

export function publishedThePaseoLifeWhere(): Prisma.ThePaseoLifePostWhereInput {
  const now = new Date();

  return {
    deletedAt: null,
    isActive: true,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

export async function getPublishedThePaseoLifePosts() {
  return prisma.thePaseoLifePost.findMany({
    where: publishedThePaseoLifeWhere(),
    orderBy: publicOrderBy,
    select: {
      id: true,
      image: true,
      title: true,
      description: true,
      linkUrl: true,
      openInNewTab: true,
      sortOrder: true,
    },
  });
}

export function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}
