import { SiteFooter } from "@/features/layout/site-footer";
import { SiteHeaderLoader } from "@/features/layout/site-header-loader";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeaderLoader />
      {children}
      <SiteFooter />
    </>
  );
}
