import { unlink } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { validationError } from "@/lib/content-api";
import { mediaListSelect } from "@/lib/media";
import { checkModuleAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { mediaPatchSchema } from "@/validators/media.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await params;
  const parsed = mediaPatchSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.folderId !== undefined && parsed.data.folderId !== null) {
    const folder = await prisma.mediaFolder.findFirst({
      where: { id: parsed.data.folderId, deletedAt: null },
      select: { id: true },
    });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  const media = await prisma.media.update({
    where: { id },
    data: {
      ...(parsed.data.altText !== undefined ? { altText: parsed.data.altText } : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.caption !== undefined ? { caption: parsed.data.caption } : {}),
      ...(parsed.data.filename !== undefined ? { filename: parsed.data.filename } : {}),
      ...(parsed.data.folderId !== undefined ? { folderId: parsed.data.folderId } : {}),
    },
    select: mediaListSelect,
  });

  return NextResponse.json({ media });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await params;

  const media = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });

  // Best-effort cleanup — don't fail the request if the file is already gone.
  try {
    await unlink(path.join(process.cwd(), "public", media.path));
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true });
}
