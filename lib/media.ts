import type { MediaType, Prisma } from "@prisma/client";

import { generateSlug } from "@/lib/seo";

export type MediaRecord = {
  id: string;
  folderId: string | null;
  filename: string;
  originalName: string | null;
  path: string;
  type: MediaType;
  size: number;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaSort = "newest" | "oldest" | "name-asc" | "name-desc";

export function buildMediaWhere({
  folderId,
  type,
  q,
}: {
  folderId?: string;
  type?: MediaType;
  q?: string;
}): Prisma.MediaWhereInput {
  const where: Prisma.MediaWhereInput = { deletedAt: null };

  if (folderId && folderId !== "root" && folderId !== "") {
    where.folderId = folderId;
  }

  if (type) where.type = type;

  if (q) {
    where.OR = [
      { filename: { contains: q } },
      { title: { contains: q } },
      { altText: { contains: q } },
    ];
  }

  return where;
}

export function buildMediaOrderBy(sort?: MediaSort): Prisma.MediaOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name-asc":
      return { filename: "asc" };
    case "name-desc":
      return { filename: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export const mediaListSelect = {
  id: true,
  folderId: true,
  filename: true,
  originalName: true,
  path: true,
  type: true,
  size: true,
  mimeType: true,
  extension: true,
  width: true,
  height: true,
  altText: true,
  title: true,
  caption: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function buildUniqueFolderSlug(name: string, excludeId?: string) {
  const baseSlug = generateSlug(name) || "folder";
  let candidate = baseSlug;
  let suffix = 2;

  const { prisma } = await import("@/lib/prisma");

  while (
    await prisma.mediaFolder.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
