import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { StoreStatusBadge } from "@/features/stores/store-status-badge";
import type { ArchiveStore } from "@/lib/stores";
import { buildStoreDetailHref, buildStoresHref } from "@/lib/stores";
import { getStoreOpenStatus } from "@/lib/stores/operating-hours";
import { cn } from "@/lib/utils";

import type { StoreOperatingHour } from "@/lib/stores/operating-hours";

export type StoreCardStore = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  operatingHours: StoreOperatingHour[];
  category: { name: string; color: string | null } | null;
  branchName: string;
};

type StoreCardProps = {
  store: StoreCardStore;
  listingQuery?: { category?: string; branch?: string };
};

export function StoreCard({ store, listingQuery }: StoreCardProps) {
  const status = getStoreOpenStatus(store.operatingHours);

  return (
    <Link href={buildStoreDetailHref(store.slug, listingQuery)} className="group block">
      <article className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
        <div className="relative flex aspect-square items-center justify-center bg-[#F3F0EA] p-6">
          {store.logo ? (
            <div className="relative h-full w-full">
              <Image
                src={store.logo}
                alt={store.name}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-contain p-2"
              />
            </div>
          ) : (
            <span className="text-3xl font-bold text-[#9B8459]">{store.name.charAt(0)}</span>
          )}
          <StoreStatusBadge isOpen={status.isOpen} className="absolute right-2 top-2" />
        </div>

        <div className="p-4 text-center">
          {store.category ? (
            <p
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
                store.category.color ? "text-white" : "bg-[#F3F0EA] text-muted",
              )}
              style={store.category.color ? { backgroundColor: store.category.color } : undefined}
            >
              {store.category.name}
            </p>
          ) : null}
          <h3 className="mt-1 font-semibold text-foreground group-hover:text-paseo-dark">{store.name}</h3>
          <p className="mt-1 text-xs text-muted">{store.branchName}</p>
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
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-x-visible [&::-webkit-scrollbar]:hidden">
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
