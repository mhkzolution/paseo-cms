import { unlink } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { checkRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);
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
