import { NextResponse } from "next/server";

import { getCategoryModuleId } from "@/lib/categories";
import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { categorySchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function requireCategoryAccess(id: string) {
  const category = await prisma.category.findFirst({
    where: { id, deletedAt: null },
    select: { scope: true },
  });

  if (!category) {
    return { authorized: false as const, status: 404 as const, category: null };
  }

  const access = await checkModuleAccess(getCategoryModuleId(category.scope));
  if (!access.authorized) {
    return { authorized: false as const, status: access.status, category: null };
  }

  return { authorized: true as const, status: 200 as const, category };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const access = await requireCategoryAccess(id);
  if (!access.authorized) return forbiddenError(access.status);

  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const { scope: _scope, postKind, ...updateData } = parsed.data;

  const existing = await prisma.category.findFirst({
    where: { slug: updateData.slug, deletedAt: null, NOT: { id } },
    select: { id: true },
  });
  if (existing) return conflictError();

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...updateData,
      ...(access.category.scope === "POST" ? { postKind: postKind ?? null } : {}),
    },
  });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const access = await requireCategoryAccess(id);
  if (!access.authorized) return forbiddenError(access.status);

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
