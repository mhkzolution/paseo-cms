import {
  ArchiveBranchTiles,
  ArchiveCategoryTiles,
  ArchiveFilterSection,
  type ArchiveTileItem,
} from "@/features/archive/archive-tile-filters";
import { buildStoresHref } from "@/lib/stores";

type StoreArchiveFiltersProps = {
  branches: Array<{ slug: string; label: string; image: string | null }>;
  categories: Array<{ slug: string; name: string; image: string | null }>;
  activeBranchSlug?: string;
  activeCategorySlug?: string;
};

export function StoreArchiveFilters({
  branches,
  categories,
  activeBranchSlug,
  activeCategorySlug,
}: StoreArchiveFiltersProps) {
  const branchItems: ArchiveTileItem[] = branches.map((branch) => ({
    slug: branch.slug,
    label: branch.label,
    image: branch.image,
    href: buildStoresHref({ branch: branch.slug, category: activeCategorySlug }),
  }));

  const categoryItems: ArchiveTileItem[] = categories.map((category) => ({
    slug: category.slug,
    label: category.name,
    image: category.image,
    href: buildStoresHref({ branch: activeBranchSlug, category: category.slug }),
  }));

  return (
    <div className="grid gap-8 sm:gap-10">
      <ArchiveFilterSection title="สาขา">
        <ArchiveBranchTiles items={branchItems} activeSlug={activeBranchSlug} />
      </ArchiveFilterSection>

      <ArchiveFilterSection title="หมวดหมู่">
        <ArchiveCategoryTiles
          items={categoryItems}
          activeSlug={activeCategorySlug}
          allHref={buildStoresHref({ branch: activeBranchSlug })}
        />
      </ArchiveFilterSection>
    </div>
  );
}
