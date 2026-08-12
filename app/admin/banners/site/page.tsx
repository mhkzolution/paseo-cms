import { BannerListPage } from "@/features/banners/banner-list-page";
import { requireModuleAccess } from "@/lib/rbac";

export default async function SiteBannersPage() {
  await requireModuleAccess("banners");
  return <BannerListPage scope="site" />;
}
