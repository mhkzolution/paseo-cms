import { Link } from "@/i18n/navigation";

import { StoreCardMedia } from "@/features/stores/store-card-media";
import { StoreStatusBadge } from "@/features/stores/store-status-badge";
import type { ArchiveStore } from "@/lib/stores";
import { buildStoreDetailHref, buildStoresHref } from "@/lib/stores";
import { resolveStoreCardMedia } from "@/lib/stores/store-card-media";
import { getStoreOpenStatus } from "@/lib/stores/operating-hours";
import { cn } from "@/lib/utils";

import type { StoreOperatingHour } from "@/lib/stores/operating-hours";

export type StoreCardStore = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  cover?: string | null;
  operatingHours: StoreOperatingHour[];
  category: { name: string; slug?: string; color: string | null; image?: string | null } | null;
  branchName: string;
  branch?: { slug: string; image?: string | null };
};

type StoreCardProps = {
  store: StoreCardStore;
  listingQuery?: { category?: string; branch?: string };
};

export function StoreCard({ store, listingQuery }: StoreCardProps) {
  const status = getStoreOpenStatus(store.operatingHours);
  const media = resolveStoreCardMedia({
    name: store.name,
    logo: store.logo,
    cover: store.cover,
    category: store.category,
    branch: store.branch,
  });

  return (
    <Link href={buildStoreDetailHref(store.slug, listingQuery)} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition-all hover:border-paseo/30 hover:shadow-md">
        <div className="relative">
          <StoreCardMedia media={media} alt={store.name} />
          <StoreStatusBadge isOpen={status.isOpen} className="absolute left-2 top-2 z-10" />
        </div>

        <div className="flex min-h-[7.5rem] flex-1 flex-col gap-2 p-4 text-center sm:min-h-[8rem]">
          <h3 className="line-clamp-2 min-h-[2.5rem] font-semibold text-foreground group-hover:text-paseo-dark">
            {store.name}
          </h3>

          <div className="min-h-[1.25rem]">
            {store.category ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2 py-0.5 text-xs font-medium text-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: store.category.color ?? "#9B8459" }}
                  aria-hidden="true"
                />
                {store.category.name}
              </span>
            ) : null}
          </div>

          <p className="mt-auto text-xs text-muted">{store.branchName}</p>
        </div>
      </article>
    </Link>
  );
}

type StoreArchivePageGridProps = {
  stores: ArchiveStore[];
  emptyMessage?: string;
  listingQuery?: { category?: string; branch?: string };
};

export function StoreArchivePageGrid({
  stores,
  emptyMessage = "ยังไม่มีร้านค้าในหมวดนี้",
  listingQuery,
}: StoreArchivePageGridProps) {
  if (!stores.length) {
    return <p className="py-16 text-center text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={{
            id: store.id,
            name: store.name,
            slug: store.slug,
            logo: store.logo,
            cover: store.cover,
            operatingHours: store.operatingHours,
            category: store.category,
            branchName: store.branch.name,
          }}
          listingQuery={listingQuery}
        />
      ))}
    </div>
  );
}

export function StoreListGrid({ stores }: { stores: StoreCardStore[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
}

type StoreCategoryFilterProps = {
  categories: Array<{
    name: string;
    slug: string;
    image: string | null;
    storeCount: number;
  }>;
  activeSlug?: string;
  activeBranchSlug?: string;
  activeCategoryColor?: string | null;
};

function BranchFilterChip({
  href,
  active,
  label,
  image,
}: {
  href: string;
  active: boolean;
  label: string;
  image: string | null;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 transition-colors",
        active
          ? "border-foreground bg-foreground text-white"
          : "border-border bg-white text-foreground hover:border-foreground/30",
      )}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F3F0EA]">
        {image ? (
          <Image src={image} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <span className="text-sm font-bold text-[#9B8459]">{label.charAt(0)}</span>
        )}
      </span>
      <span className="whitespace-nowrap text-sm font-medium">{label}</span>
    </Link>
  );
}

function CategoryFilterChip({
  href,
  active,
  label,
  image,
}: {
  href: string;
  active: boolean;
  label: string;
  image?: string | null;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-white"
          : "border border-border bg-white text-foreground hover:border-foreground/30",
      )}
    >
      {image ? (
        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/20">
          <Image src={image} alt="" fill className="object-cover" sizes="24px" />
        </span>
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

export function StoreBranchFilter({
  branches,
  activeSlug,
  activeCategorySlug,
}: {
  branches: Array<{ slug: string; label: string; image: string | null; storeCount: number }>;
  activeSlug?: string;
  activeCategorySlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {branches.map((branch) => (
        <BranchFilterChip
          key={branch.slug}
          href={buildStoresHref({ branch: branch.slug, category: activeCategorySlug })}
          active={activeSlug === branch.slug}
          label={branch.label}
          image={branch.image}
        />
      ))}
    </div>
  );
}

export function StoreCategoryFilter({
  categories,
  activeSlug,
  activeBranchSlug,
  activeCategoryColor,
}: StoreCategoryFilterProps) {
  return (
    <div
      className={cn("rounded-2xl p-4 transition-colors", !activeCategoryColor && "bg-transparent")}
      style={activeCategoryColor ? { backgroundColor: activeCategoryColor } : undefined}
    >
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 scrollbar-hidden sm:flex-wrap sm:overflow-x-visible">
        <CategoryFilterChip
          href={buildStoresHref({ branch: activeBranchSlug })}
          active={!activeSlug}
          label="ทุกหมวดหมู่"
        />
        {categories.map((category) => (
          <CategoryFilterChip
            key={category.slug}
            href={buildStoresHref({ category: category.slug, branch: activeBranchSlug })}
            active={activeSlug === category.slug}
            label={category.name}
            image={category.image}
          />
        ))}
      </div>
    </div>
  );
}

export function StoreFilters({
  branches,
  categories,
  activeBranchSlug,
  activeCategorySlug,
  activeCategoryColor,
}: {
  branches: Array<{ slug: string; label: string; image: string | null; storeCount: number }>;
  categories: Array<{
    name: string;
    slug: string;
    image: string | null;
    storeCount: number;
  }>;
  activeBranchSlug?: string;
  activeCategorySlug?: string;
  activeCategoryColor?: string | null;
}) {
  return (
    <div className="grid gap-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">สาขา</p>
        <StoreBranchFilter
          branches={branches}
          activeSlug={activeBranchSlug}
          activeCategorySlug={activeCategorySlug}
        />
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">หมวดหมู่</p>
        <StoreCategoryFilter
          categories={categories}
          activeSlug={activeCategorySlug}
          activeBranchSlug={activeBranchSlug}
          activeCategoryColor={activeCategoryColor}
        />
      </div>
    </div>
  );
}
