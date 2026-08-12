import { NewBannerPageContent } from "@/features/banners/banner-admin-pages";
import { requireModuleAccess } from "@/lib/rbac";

export default async function NewAboutBannerPage() {
  await requireModuleAccess("banners");
  return <NewBannerPageContent scope="about" />;
}
