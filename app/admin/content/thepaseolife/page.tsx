import { ThePaseoLifeList } from "@/features/thepaseolife/thepaseolife-list";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

export default async function ThePaseoLifeAdminPage() {
  await requireModuleAccess("thepaseolife");
  const localization = await getLocalizationSettings();

  const items = await prisma.thePaseoLifePost.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return <ThePaseoLifeList items={items} localization={localization} />;
}
