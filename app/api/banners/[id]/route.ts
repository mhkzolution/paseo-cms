import { NextResponse } from "next/server";

import { revalidateAllBannerPages, revalidateBannerPages } from "@/lib/banners-revalidate";
import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { bannerSchema } from "@/validators/content.validator";

const MARKETING_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...MARKETING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = bannerSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  }

  const item = await prisma.banner.update({ where: { id }, data: parsed.data });
  revalidateBannerPages({ ...existing, ...parsed.data });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkRole([...MARKETING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const existing = await prisma.banner.findFirst({ where: { id, deletedAt: null } });

  await prisma.banner.update({ where: { id }, data: { deletedAt: new Date() } });

  if (existing) {
    revalidateBannerPages(existing);
  } else {
    revalidateAllBannerPages();
  }

  return NextResponse.json({ success: true });
}
