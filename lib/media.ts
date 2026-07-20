import type { MediaType, Prisma } from "@prisma/client";

import { generateSlug } from "@/lib/seo";

export type MediaRecord = {
  id: string;
  folderId: string | null;
  filename: string;
  path: string;
  type: MediaType;
  size: number;
  createdAt: Date;
};

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
  if (q) where.filename = { contains: q };

  return where;
}

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
