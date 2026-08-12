import { EditBannerPageContent } from "@/features/banners/banner-admin-pages";
import { requireModuleAccess } from "@/lib/rbac";

interface EditAboutBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAboutBannerPage({ params }: EditAboutBannerPageProps) {
  await requireModuleAccess("banners");
  const { id } = await params;
  return <EditBannerPageContent scope="about" id={id} />;
}
