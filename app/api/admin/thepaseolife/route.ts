import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { thePaseoLifeSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("thepaseolife");
  if (!authorized) return forbiddenError(status);

  const items = await prisma.thePaseoLifePost.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("thepaseolife");
  if (!authorized) return forbiddenError(status);

  const parsed = thePaseoLifeSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const maxSort = await prisma.thePaseoLifePost.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true },
  });

  const item = await prisma.thePaseoLifePost.create({
    data: {
      ...parsed.data,
      sortOrder: parsed.data.sortOrder || (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
