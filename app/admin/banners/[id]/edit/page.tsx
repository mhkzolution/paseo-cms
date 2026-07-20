import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface LegacyEditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyEditBannerPage({ params }: LegacyEditBannerPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const { id } = await params;
  const item = await prisma.banner.findFirst({
    where: { id, deletedAt: null },
    select: { showOnAbout: true },
  });

  if (!item) {
    redirect("/admin/banners/site");
  }

  const scope = item.showOnAbout ? "about" : "site";
  redirect(`/admin/banners/${scope}/${id}/edit`);
}
