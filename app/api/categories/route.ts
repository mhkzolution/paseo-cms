import { NextResponse } from "next/server";

import { getCategoryModuleId } from "@/lib/categories";
import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { categorySchema } from "@/validators/content.validator";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");
  const moduleId =
    scope === "POST" ? "post-categories" : scope === "STORE" ? "categories" : "categories";
  const { authorized, status } = await checkModuleAccess(moduleId);
  if (!authorized) return forbiddenError(status);

  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      ...(scope === "STORE" || scope === "POST" ? { scope } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const { authorized, status } = await checkModuleAccess(getCategoryModuleId(parsed.data.scope));
  if (!authorized) return forbiddenError(status);

  const existing = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, deletedAt: null },
    select: { id: true },
  });
  if (existing) return conflictError();

  const category = await prisma.category.create({
    data: {
      ...parsed.data,
      postKind: parsed.data.scope === "POST" ? parsed.data.postKind ?? null : null,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
