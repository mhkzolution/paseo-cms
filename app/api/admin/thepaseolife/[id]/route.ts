import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { thePaseoLifeSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("thepaseolife");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const item = await prisma.thePaseoLifePost.findFirst({
    where: { id, deletedAt: null },
  });

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  return NextResponse.json({ item });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("thepaseolife");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = thePaseoLifeSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.thePaseoLifePost.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const item = await prisma.thePaseoLifePost.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("thepaseolife");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const existing = await prisma.thePaseoLifePost.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  await prisma.thePaseoLifePost.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
