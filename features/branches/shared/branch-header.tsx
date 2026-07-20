import { SiteHeaderLoader } from "@/features/layout/site-header-loader";

type BranchHeaderProps = {
  currentSlug: string;
};

export function BranchHeader({ currentSlug }: BranchHeaderProps) {
  return <SiteHeaderLoader activeHref={`/branches/${currentSlug}`} />;
}
