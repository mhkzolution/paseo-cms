import { PromotionTabbedSection } from "@/features/promotions/promotion-tabbed-section";
import type { ArchivePromotion } from "@/lib/promotions";

type BranchPromotionsListProps = {
  promotions: ArchivePromotion[];
  branchSlug: string;
};

export function BranchPromotionsList({ promotions, branchSlug }: BranchPromotionsListProps) {
  return (
    <PromotionTabbedSection
      promotions={promotions}
      branchSlug={branchSlug}
      viewAllLabel="ดูทั้งหมด"
    />
  );
}
