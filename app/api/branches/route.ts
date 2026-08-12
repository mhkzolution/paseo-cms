import { NextResponse } from "next/server";

import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { toBranchPersistence } from "@/lib/branches/branch-names";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { branchSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("branches");
  if (!authorized) return forbiddenError(status);

  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ branches });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("branches");
  if (!authorized) return forbiddenError(status);

  const parsed = branchSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.branch.findFirst({
    where: { slug: parsed.data.slug, deletedAt: null },
    select: { id: true },
  });
  if (existing) return conflictError();

  const branch = await prisma.branch.create({ data: toBranchPersistence(parsed.data) });

  return NextResponse.json({ branch }, { status: 201 });
}
