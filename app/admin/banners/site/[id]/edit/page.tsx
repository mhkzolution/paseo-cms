import { EditBannerPageContent } from "@/features/banners/banner-admin-pages";
import { requireModuleAccess } from "@/lib/rbac";

interface EditSiteBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSiteBannerPage({ params }: EditSiteBannerPageProps) {
  await requireModuleAccess("banners");
  const { id } = await params;
  return <EditBannerPageContent scope="site" id={id} />;
}
