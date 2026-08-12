import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { extractMediaMetadata } from "@/lib/media-metadata";
import { checkModuleAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  getUploadKind,
  isFileSizeValid,
  type UploadKind,
} from "@/lib/upload";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const KIND_TO_MEDIA_TYPE: Record<UploadKind, "IMAGE" | "PDF" | "VIDEO"> = {
  image: "IMAGE",
  pdf: "PDF",
  video: "VIDEO",
};

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderIdValue = formData.get("folderId");
  const folderId =
    typeof folderIdValue === "string" && folderIdValue && folderIdValue !== "root" ? folderIdValue : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const kind = getUploadKind(file.type);
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: image, PDF, video." },
      { status: 415 },
    );
  }

  if (!isFileSizeValid(kind, file.size)) {
    return NextResponse.json({ error: "File exceeds the size limit" }, { status: 413 });
  }

  if (folderId) {
    const folder = await prisma.mediaFolder.findFirst({
      where: { id: folderId, deletedAt: null },
      select: { id: true },
    });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const extension = path.extname(file.name) || "";
  const storedFilename = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaType = KIND_TO_MEDIA_TYPE[kind];
  const meta = extractMediaMetadata(buffer, {
    mimeType: file.type,
    originalName: file.name,
    mediaType,
  });

  await writeFile(path.join(UPLOAD_DIR, storedFilename), buffer);

  const media = await prisma.media.create({
    data: {
      folderId,
      filename: file.name,
      path: `/uploads/${storedFilename}`,
      type: mediaType,
      size: file.size,
      originalName: meta.originalName,
      mimeType: meta.mimeType,
      extension: meta.extension ?? (extension.replace(/^\./, "").toLowerCase() || null),
      width: meta.width,
      height: meta.height,
    },
  });

  return NextResponse.json({ media }, { status: 201 });
}
