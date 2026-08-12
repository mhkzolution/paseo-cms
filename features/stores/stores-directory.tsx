"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { StoreDirectoryCard } from "@/features/stores/store-directory-card";
import { Link, useRouter } from "@/i18n/navigation";
import type { ArchiveStore } from "@/lib/stores";
import { buildStoresHref } from "@/lib/stores";
import { getStoreOpenStatus } from "@/lib/stores/operating-hours";
import { cn } from "@/lib/utils";

export type StoresDirectoryBranch = {
  slug: string;
  label: string;
  image: string | null;
  storeCount?: number;
};

export type StoresDirectoryCategory = {
  slug: string;
  name: string;
  image: string | null;
  color?: string | null;
  storeCount?: number;
};

type SortKey = "name-asc" | "name-desc" | "open-first";
type StatusFilter = "all" | "open" | "closed";

type StoresDirectoryProps = {
  title: string;
  stores: ArchiveStore[];
  branches: StoresDirectoryBranch[];
  categories: StoresDirectoryCategory[];
  activeBranchSlug?: string;
  activeCategorySlug?: string;
  promotionLabels?: Record<string, string>;
  searchPlaceholder: string;
  emptyMessage: string;
};

function FilterChip({
  href,
  active,
  onClick,
  children,
  className,
}: {
  href?: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const baseClass = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
    active
      ? "border-paseo bg-paseo text-white"
      : "border-black/[0.08] bg-white text-foreground hover:border-paseo/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={baseClass}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {children}
    </button>
  );
}

function ActiveFilterChip({
  label,
  onRemove,
  icon,
}: {
  label: string;
  onRemove: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-paseo/25 bg-paseo/10 px-3 py-1.5 text-xs font-medium text-paseo-dark sm:text-sm"
    >
      {icon}
      <span className="max-w-[10rem] truncate">{label}</span>
      <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
      <span className="sr-only">ลบตัวกรอง {label}</span>
    </button>
  );
}

function FilterPanelContent({
  statusFilter,
  setStatusFilter,
  branches,
  categories,
  activeBranchSlug,
  activeCategorySlug,
  filteredCount,
  onClose,
}: {
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  branches: StoresDirectoryBranch[];
  categories: StoresDirectoryCategory[];
  activeBranchSlug?: string;
  activeCategorySlug?: string;
  filteredCount: number;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">ตัวกรอง</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground"
          aria-label="ปิด"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">สถานะ</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              ทั้งหมด
            </FilterChip>
            <FilterChip active={statusFilter === "open"} onClick={() => setStatusFilter("open")}>
              เปิดอยู่
            </FilterChip>
            <FilterChip active={statusFilter === "closed"} onClick={() => setStatusFilter("closed")}>
              ปิดอยู่
            </FilterChip>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">สาขา</p>
          <div className="flex flex-wrap gap-2">
            {branches.map((branch) => (
              <FilterChip
                key={branch.slug}
                href={buildStoresHref({ branch: branch.slug, category: activeCategorySlug })}
                active={activeBranchSlug === branch.slug}
                onClick={onClose}
              >
                {branch.image ? (
                  <span className="relative h-4 w-4 overflow-hidden rounded-full">
                    <Image src={branch.image} alt="" fill className="object-contain" sizes="16px" />
                  </span>
                ) : null}
                <span>{branch.label}</span>
                {branch.storeCount != null ? (
                  <span
                    className={cn("text-[10px]", activeBranchSlug === branch.slug ? "text-white/80" : "text-muted")}
                  >
                    ({branch.storeCount})
                  </span>
                ) : null}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">หมวดหมู่</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              href={buildStoresHref({ branch: activeBranchSlug })}
              active={!activeCategorySlug}
              onClick={onClose}
            >
              ทั้งหมด
            </FilterChip>
            {categories.map((category) => (
              <FilterChip
                key={category.slug}
                href={buildStoresHref({ branch: activeBranchSlug, category: category.slug })}
                active={activeCategorySlug === category.slug}
                onClick={onClose}
              >
                {category.image ? (
                  <span className="relative h-4 w-4 overflow-hidden rounded-full">
                    <Image src={category.image} alt="" fill className="object-contain" sizes="16px" />
                  </span>
                ) : category.color ? (
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                ) : null}
                <span>{category.name}</span>
                {category.storeCount != null ? (
                  <span
                    className={cn(
                      "text-[10px]",
                      activeCategorySlug === category.slug ? "text-white/80" : "text-muted",
                    )}
                  >
                    ({category.storeCount})
                  </span>
                ) : null}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-black/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-paseo py-2.5 text-sm font-semibold text-white"
        >
          แสดง {filteredCount} ร้าน
        </button>
      </div>
    </>
  );
}

function sortStores(stores: ArchiveStore[], sortKey: SortKey) {
  const sorted = [...stores];

  if (sortKey === "name-desc") {
    return sorted.sort((a, b) => b.name.localeCompare(a.name, "th"));
  }

  if (sortKey === "open-first") {
    return sorted.sort((a, b) => {
      const aOpen = getStoreOpenStatus(a.operatingHours).isOpen ? 1 : 0;
      const bOpen = getStoreOpenStatus(b.operatingHours).isOpen ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return a.name.localeCompare(b.name, "th");
    });
  }

  return sorted.sort((a, b) => a.name.localeCompare(b.name, "th"));
}

export function StoresDirectory({
  title,
  stores,
  branches,
  categories,
  activeBranchSlug,
  activeCategorySlug,
  promotionLabels = {},
  searchPlaceholder,
  emptyMessage,
}: StoresDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const listingQuery = {
    branch: activeBranchSlug,
    category: activeCategorySlug,
  };

  useEffect(() => {
    setFiltersOpen(false);
  }, [activeBranchSlug, activeCategorySlug]);

  useEffect(() => {
    if (!filtersOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  const filteredStores = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let result = stores;

    if (normalized) {
      result = result.filter((store) => {
        return (
          store.name.toLowerCase().includes(normalized) ||
          store.category?.name.toLowerCase().includes(normalized) ||
          store.location?.toLowerCase().includes(normalized) ||
          store.zone?.toLowerCase().includes(normalized) ||
          store.floor?.toLowerCase().includes(normalized) ||
          store.branch.name.toLowerCase().includes(normalized)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((store) => {
        const isOpen = getStoreOpenStatus(store.operatingHours).isOpen;
        return statusFilter === "open" ? isOpen : !isOpen;
      });
    }

    return sortStores(result, sortKey);
  }, [query, sortKey, statusFilter, stores]);

  const activeBranch = branches.find((branch) => branch.slug === activeBranchSlug);
  const activeCategory = categories.find((category) => category.slug === activeCategorySlug);
  const activeFilterCount =
    Number(Boolean(activeCategorySlug)) +
    Number(statusFilter !== "all") +
    Number(Boolean(query.trim()));

  const closeFilters = () => setFiltersOpen(false);

  const filterPanelProps = {
    statusFilter,
    setStatusFilter,
    branches,
    categories,
    activeBranchSlug,
    activeCategorySlug,
    filteredCount: filteredStores.length,
    onClose: closeFilters,
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6]">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <nav className="text-xs text-muted sm:text-sm" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                หน้าแรก
              </Link>
            </li>
            <li aria-hidden="true" className="text-black/25">
              /
            </li>
            <li className="font-medium text-foreground" aria-current="page">
              {title}
            </li>
            {activeBranch ? (
              <>
                <li aria-hidden="true" className="text-black/25">
                  /
                </li>
                <li className="text-foreground">{activeBranch.label}</li>
              </>
            ) : null}
          </ol>
        </nav>
      </div>

      <div className="sticky top-14 z-40 border-b border-black/[0.06] bg-white/95 backdrop-blur-md sm:top-12">
        <div className="mx-auto w-full max-w-7xl pt-4 sm:pt10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 pb-2 pt-1">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {title}
              {activeBranch ? <span className="text-muted"> · {activeBranch.label}</span> : null}
            </h1>
            <p className="shrink-0 rounded-full bg-paseo/10 px-2.5 py-0.5 text-xs font-semibold text-paseo-dark">
              {filteredStores.length} ร้าน
            </p>
          </div>

          <div className="relative pb-2">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-black/[0.08] bg-[#FCFAF6] pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted focus:border-paseo-dark/40 focus:bg-white focus:ring-4 focus:ring-paseo/10"
            />
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm",
                filtersOpen || activeFilterCount > 0
                  ? "border-paseo bg-paseo/10 text-paseo-dark"
                  : "border-black/[0.08] bg-white text-foreground",
              )}
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              ตัวกรอง
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-paseo px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 scrollbar-hidden">
              {activeCategory ? (
                <ActiveFilterChip
                  label={activeCategory.name}
                  onRemove={() => router.push(buildStoresHref({ branch: activeBranchSlug }))}
                />
              ) : null}

              {statusFilter === "open" ? (
                <ActiveFilterChip label="เปิดอยู่" onRemove={() => setStatusFilter("all")} />
              ) : null}

              {statusFilter === "closed" ? (
                <ActiveFilterChip label="ปิดอยู่" onRemove={() => setStatusFilter("all")} />
              ) : null}

              {query.trim() ? (
                <ActiveFilterChip label={`“${query.trim()}”`} onRemove={() => setQuery("")} />
              ) : null}
            </div>

            <label className="relative shrink-0">
              <span className="sr-only">เรียงลำดับ</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="h-8 appearance-none rounded-full border border-black/[0.08] bg-white pl-3 pr-8 text-xs font-medium text-foreground outline-none focus:border-paseo-dark/40 sm:text-sm"
              >
                <option value="name-asc">ชื่อ ก-ฮ</option>
                <option value="name-desc">ชื่อ ฮ-ก</option>
                <option value="open-first">เปิดอยู่ก่อน</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      {filtersOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="ปิดตัวกรอง"
            onClick={closeFilters}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ตัวกรองร้านค้า"
            className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl"
          >
            <FilterPanelContent {...filterPanelProps} />
          </div>
        </div>
      ) : null}

      {/* Desktop: centered modal */}
      {filtersOpen ? (
        <div className="fixed inset-0 z-50 hidden items-center justify-center p-6 md:flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="ปิดตัวกรอง"
            onClick={closeFilters}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ตัวกรองร้านค้า"
            className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <FilterPanelContent {...filterPanelProps} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        {filteredStores.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4 xl:grid-cols-5">
            {filteredStores.map((store) => (
              <StoreDirectoryCard
                key={store.id}
                store={store}
                listingQuery={listingQuery}
                promotionLabel={promotionLabels[store.id] ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.1] bg-white px-6 text-center">
            <Search className="h-8 w-8 text-paseo-dark" aria-hidden="true" />
            <p className="mt-4 font-semibold text-foreground">
              {query.trim() || statusFilter !== "all" ? "ไม่พบร้านค้าที่ตรงกับตัวกรอง" : emptyMessage}
            </p>
            <p className="mt-1 text-sm text-muted">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
            {activeCategorySlug || query.trim() || statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  if (activeCategorySlug) {
                    router.push(buildStoresHref({ branch: activeBranchSlug }));
                  }
                }}
                className="mt-4 inline-flex rounded-full bg-paseo px-4 py-2 text-sm font-semibold text-white"
              >
                ล้างตัวกรอง
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
