import { NextResponse } from "next/server";

import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { categorySchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, deletedAt: null, NOT: { id } },
    select: { id: true },
  });
  if (existing) return conflictError();

  const category = await prisma.category.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
