import { EditBannerPageContent } from "@/features/banners/banner-admin-pages";

interface EditAboutBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAboutBannerPage({ params }: EditAboutBannerPageProps) {
  const { id } = await params;
  return <EditBannerPageContent scope="about" id={id} />;
}
