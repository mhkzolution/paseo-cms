import { EditBannerPageContent } from "@/features/banners/banner-admin-pages";

interface EditSiteBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSiteBannerPage({ params }: EditSiteBannerPageProps) {
  const { id } = await params;
  return <EditBannerPageContent scope="site" id={id} />;
}
