import { NextResponse } from "next/server";

import { buildUniqueFolderSlug } from "@/lib/media";
import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { mediaFolderSchema } from "@/validators/media.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) return forbiddenError(status);

  const folders = await prisma.mediaFolder.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { media: { where: { deletedAt: null } } } },
    },
  });

  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) return forbiddenError(status);

  const parsed = mediaFolderSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const slug = await buildUniqueFolderSlug(parsed.data.name);
  const folder = await prisma.mediaFolder.create({
    data: { name: parsed.data.name, slug },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
