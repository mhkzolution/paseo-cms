import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { thePaseoLifeBulkSchema } from "@/validators/content.validator";

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("thepaseolife");
  if (!authorized) return forbiddenError(status);

  const parsed = thePaseoLifeBulkSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const { action, ids } = parsed.data;
  const now = new Date();

  if (action === "reorder") {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.thePaseoLifePost.updateMany({
          where: { id, deletedAt: null },
          data: { sortOrder: index },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await prisma.thePaseoLifePost.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: now },
    });
  } else {
    await prisma.thePaseoLifePost.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { isActive: action === "activate" },
    });
  }

  return NextResponse.json({ success: true });
}
