import { Link } from "@/i18n/navigation";

import { StoreListGrid } from "@/features/stores/store-archive-section";
import type { BranchStore } from "@/lib/branches/types";
import { buildStoresHref } from "@/lib/stores";

type BranchStoreGridProps = {
  stores: BranchStore[];
  branchName: string;
  branchSlug: string;
};

export function BranchStoreGrid({ stores, branchName, branchSlug }: BranchStoreGridProps) {
  if (!stores.length) return null;

  const displayBranchName = branchName;

  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--branch-primary)]">ร้านค้า</p>
            <h2 className="mt-2 text-3xl font-semibold">ร้านค้าใน {displayBranchName}</h2>
          </div>
          <Link
            href={buildStoresHref({ branch: branchSlug })}
            className="text-sm font-medium text-[var(--branch-primary)] hover:underline"
          >
            ดูร้านค้าทั้งหมด
          </Link>
        </div>

        <div className="mt-10">
          <StoreListGrid
            stores={stores.map((store) => ({
              id: store.id,
              name: store.name,
              slug: store.slug,
              logo: store.logo,
              operatingHours: store.operatingHours,
              category: store.category,
              branchName: displayBranchName,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
