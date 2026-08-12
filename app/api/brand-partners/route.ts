import { NextResponse } from "next/server";

import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { brandPartnerSchema } from "@/validators/content.validator";

export async function GET() {
  const { authorized, status } = await checkModuleAccess("brand-partners");
  if (!authorized) return forbiddenError(status);

  const brandPartners = await prisma.brandPartner.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ brandPartners });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkModuleAccess("brand-partners");
  if (!authorized) return forbiddenError(status);

  const parsed = brandPartnerSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const item = await prisma.brandPartner.create({ data: parsed.data });

  return NextResponse.json({ item }, { status: 201 });
}
