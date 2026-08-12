import { NextResponse } from "next/server";

import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { toBranchPersistence } from "@/lib/branches/branch-names";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { branchSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("branches");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = branchSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.branch.findFirst({
    where: { slug: parsed.data.slug, deletedAt: null, NOT: { id } },
    select: { id: true },
  });
  if (existing) return conflictError();

  const branch = await prisma.branch.update({ where: { id }, data: toBranchPersistence(parsed.data) });

  return NextResponse.json({ branch });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("branches");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  await prisma.branch.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
