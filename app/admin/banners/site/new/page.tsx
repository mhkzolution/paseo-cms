import { NewBannerPageContent } from "@/features/banners/banner-admin-pages";
import { requireModuleAccess } from "@/lib/rbac";

export default async function NewSiteBannerPage() {
  await requireModuleAccess("banners");
  return <NewBannerPageContent scope="site" />;
}
