import { NextResponse } from "next/server";

import { revalidateBannerPages } from "@/lib/banners-revalidate";
import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { bannerSchema } from "@/validators/content.validator";

const MARKETING_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

export async function GET() {
  const { authorized, status } = await checkRole([...MARKETING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const banners = await prisma.banner.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkRole([...MARKETING_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = bannerSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const item = await prisma.banner.create({ data: parsed.data });
  revalidateBannerPages(parsed.data);

  return NextResponse.json({ item }, { status: 201 });
}
