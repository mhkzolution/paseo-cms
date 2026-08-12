import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { brandPartnerSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("brand-partners");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = brandPartnerSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const item = await prisma.brandPartner.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("brand-partners");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  await prisma.brandPartner.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
