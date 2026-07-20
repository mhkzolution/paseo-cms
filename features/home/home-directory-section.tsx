"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Map as MapIcon,
  Search,
  Store,
  X,
  ZoomIn,
} from "lucide-react";

import type { AppLocale } from "@/i18n/routing";
import { getLocalizedName } from "@/lib/i18n/localized-name";
import type { HomeDirectoryData } from "@/lib/home-page";
import type { ArchiveStore } from "@/lib/stores";
import { buildStoreDetailHref } from "@/lib/stores";
import { cn } from "@/lib/utils";

type HomeDirectorySectionProps = {
  data: HomeDirectoryData;
  className?: string;
};

type MobileView = "list" | "map";

const ALL_ZONES = "ทั้งหมด";
const UNCATEGORIZED_SLUG = "__uncategorized__";

type StoreCategoryGroup = {
  slug: string;
  name: string;
  color: string | null;
  stores: ArchiveStore[];
};

function groupStoresByCategory(
  stores: ArchiveStore[],
  categories: HomeDirectoryData["categories"],
): StoreCategoryGroup[] {
  const storesBySlug = new Map<string, ArchiveStore[]>();

  for (const store of stores) {
    const slug = store.category?.slug ?? UNCATEGORIZED_SLUG;
    const existing = storesBySlug.get(slug) ?? [];

    existing.push(store);
    storesBySlug.set(slug, existing);
  }

  const groups = categories
    .filter((category) => storesBySlug.has(category.slug))
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      color: category.color,
      stores: storesBySlug.get(category.slug)!,
    }));

  const uncategorized = storesBySlug.get(UNCATEGORIZED_SLUG);

  if (uncategorized?.length) {
    groups.push({
      slug: UNCATEGORIZED_SLUG,
      name: "อื่นๆ",
      color: null,
      stores: uncategorized,
    });
  }

  return groups;
}

function getDefaultFloorId(
  floors: {
    id: string;
    name: string;
    sortOrder: number;
  }[],
) {
  if (!floors.length) return "";

  const floor1 = floors.find((item) =>
    /ชั้น\s*1|floor\s*1/i.test(item.name),
  );

  if (floor1) return floor1.id;

  const sorted = [...floors].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return sorted[0]?.id ?? "";
}

export function HomeDirectorySection({
  data,
  className,
}: HomeDirectorySectionProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("stores");
  const defaultBranch = data.branches[0]?.slug ?? "";

  const [branchSlug, setBranchSlug] = useState(defaultBranch);

  const [floor, setFloor] = useState(() =>
    getDefaultFloorId(
      data.floorsByBranch[defaultBranch] ?? [],
    ),
  );

  const [zone, setZone] = useState(ALL_ZONES);
  const [query, setQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] =
    useState<string | null>(null);

  const [mobileView, setMobileView] =
    useState<MobileView>("list");

  const [mapImageOpen, setMapImageOpen] =
    useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const branchStores =
    data.storesByBranch[branchSlug] ?? [];

  const floors =
    data.floorsByBranch[branchSlug] ?? [];

  const zonesOnFloor = useMemo(() => {
    return (
      floors.find((item) => item.id === floor)?.zones ?? []
    );
  }, [floor, floors]);

  const filteredStores = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return branchStores.filter((store) => {
      const matchesFloor =
        !floor || store.floorId === floor;

      const matchesZone =
        zone === ALL_ZONES ||
        store.zoneId === zone;

      const matchesQuery =
        !normalizedQuery ||
        store.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        store.category?.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        store.location
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        store.zone
          ?.toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesFloor &&
        matchesZone &&
        matchesQuery
      );
    });
  }, [
    branchStores,
    floor,
    zone,
    query,
  ]);

  const storesByCategory = useMemo(
    () =>
      groupStoresByCategory(
        filteredStores,
        data.categories,
      ),
    [filteredStores, data.categories],
  );

  const activeBranch = data.branches.find(
    (branch) => branch.slug === branchSlug,
  );

  const activeFloor = floors.find(
    (item) => item.id === floor,
  );

  const activeZone = zonesOnFloor.find(
    (item) => item.id === zone,
  );

  const activeMapImage =
    activeZone?.floorPlanImage ??
    activeFloor?.floorPlanImage ??
    null;

  const activeMapLabel =
    activeZone?.name ??
    activeFloor?.name ??
    null;

  useEffect(() => {
    if (!selectedStoreId) return;

    if (
      !filteredStores.some(
        (store) => store.id === selectedStoreId,
      )
    ) {
      setSelectedStoreId(null);
    }
  }, [filteredStores, selectedStoreId]);

  useEffect(() => {
    if (
      !selectedStoreId ||
      !listRef.current
    ) {
      return;
    }

    const selectedItem =
      listRef.current.querySelector(
        `[data-store-id="${selectedStoreId}"]`,
      );

    selectedItem?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedStoreId]);

  useEffect(() => {
    if (!mapImageOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMapImageOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mapImageOpen]);

  function handleBranchChange(
    nextBranch: string,
  ) {
    setBranchSlug(nextBranch);

    setFloor(
      getDefaultFloorId(
        data.floorsByBranch[nextBranch] ?? [],
      ),
    );

    setZone(ALL_ZONES);
    setQuery("");
    setSelectedStoreId(null);
    setMapImageOpen(false);
  }

  function handleFloorChange(
    nextFloor: string,
  ) {
    setFloor(nextFloor);
    setZone(ALL_ZONES);
    setSelectedStoreId(null);
    setMapImageOpen(false);
  }

  return (
    <section
      id="directory"
      className={cn(
        "scroll-mt-[72px] bg-white py-8 sm:py-20 lg:py-24",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* =========================
            Heading
        ========================== */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
            Directory
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            ค้นหาร้านค้าในเดอะพาซิโอ
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
            ค้นหาร้านค้า ร้านอาหาร และบริการ
            พร้อมดูตำแหน่งบนผังของแต่ละสาขา
          </p>
        </div>

        {/* =========================
            Branch Selector
        ========================== */}
        <div className="mt-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {data.branches.map((branch) => {
              const active =
                branch.slug === branchSlug;

              return (
                <button
                  key={branch.slug}
                  type="button"
                  onClick={() =>
                    handleBranchChange(
                      branch.slug,
                    )
                  }
                  className={cn(
                    "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
                    active
                      ? "border-paseo-dark bg-paseo-dark text-white"
                      : "border-black/[0.08] bg-white text-foreground hover:border-paseo-dark/40 hover:bg-paseo-hover",
                  )}
                >
                  {getLocalizedName(branch, locale)}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================
            Search
        ========================== */}
        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder={t("searchPlaceholder")}
            className="h-14 w-full rounded-2xl border border-black/[0.08] bg-[#FCFAF6] pl-14 pr-5 text-sm outline-none transition-all placeholder:text-muted focus:border-paseo-dark/50 focus:bg-white focus:ring-4 focus:ring-paseo/10 sm:h-16 sm:text-base"
          />
        </div>

        {/* =========================
            Floor + Zone
        ========================== */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Floors */}
          <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            <div className="flex min-w-max items-center gap-2">
              {floors.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleFloorChange(item.id)
                  }
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    floor === item.id
                      ? "bg-paseo/15 text-paseo-dark"
                      : "text-muted hover:bg-black/[0.04] hover:text-foreground",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Zone */}
          {zonesOnFloor.length ? (
            <div className="relative shrink-0">
              <select
                value={zone}
                onChange={(event) => {
                  setZone(event.target.value);
                  setSelectedStoreId(null);
                }}
                className="h-10 appearance-none rounded-full border border-black/[0.08] bg-white pl-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors hover:border-paseo-dark/30 focus:border-paseo-dark"
              >
                <option value={ALL_ZONES}>
                  ทุกโซน
                </option>

                {zonesOnFloor.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
          ) : null}
        </div>

        {/* =========================
            Mobile View Switcher
        ========================== */}
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#F3F3EF] p-1 lg:hidden">
          <button
            type="button"
            onClick={() =>
              setMobileView("list")
            }
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all",
              mobileView === "list"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted",
            )}
          >
            <Store
              className="h-4 w-4"
              aria-hidden="true"
            />

            รายชื่อร้าน
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileView("map")
            }
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all",
              mobileView === "map"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted",
            )}
          >
            <MapIcon
              className="h-4 w-4"
              aria-hidden="true"
            />

            ผังร้านค้า
          </button>
        </div>

        {/* =========================
            Directory Workspace
        ========================== */}
        <div className="mt-3 overflow-hidden rounded-3xl border border-black/[0.07] bg-[#FCFAF6] lg:mt-7 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
          {/* =====================
              Store List
          ====================== */}
          <div
            className={cn(
              "min-h-[520px] flex-col bg-white lg:flex lg:min-h-[560px] lg:border-r lg:border-black/[0.07]",
              mobileView === "list"
                ? "flex"
                : "hidden",
            )}
          >
            {/* Result Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <div>
                <p className="font-semibold text-foreground">
                  {filteredStores.length} ร้าน
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  {[
                    activeBranch ? getLocalizedName(activeBranch, locale) : null,
                    activeFloor?.name,
                    activeZone?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <Store
                className="h-5 w-5 text-paseo-dark"
                aria-hidden="true"
              />
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[500px] flex-1 overflow-y-auto"
            >
              {filteredStores.length ? (
                storesByCategory.map((group) => (
                  <section
                    key={group.slug}
                    aria-label={group.name}
                  >
                    {/* Category Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-[#FCFAF6]/95 px-5 py-2.5 backdrop-blur-sm sm:px-6">
                      <div className="flex min-w-0 items-center gap-2">
                        {group.color ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                group.color,
                            }}
                            aria-hidden="true"
                          />
                        ) : null}

                        <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                          {group.name}
                        </p>
                      </div>

                      <p className="shrink-0 text-xs text-muted">
                        {group.stores.length} ร้าน
                      </p>
                    </div>

                    {/* Stores */}
                    <ul>
                      {group.stores.map(
                        (store) => {
                          const selected =
                            selectedStoreId ===
                            store.id;

                          return (
                            <li
                              key={store.id}
                              data-store-id={
                                store.id
                              }
                              className="border-b border-black/[0.05] last:border-b-0"
                            >
                              <Link
                                href={buildStoreDetailHref(
                                  store.slug,
                                  {
                                    branch:
                                      branchSlug,
                                  },
                                )}
                                onClick={() =>
                                  setSelectedStoreId(
                                    store.id,
                                  )
                                }
                                className={cn(
                                  "group flex items-center justify-between gap-2 px-2 py-1 transition-colors sm:px-2",
                                  selected
                                    ? "bg-paseo/10"
                                    : "hover:bg-[#FCFAF6]",
                                )}
                              >
                                {/* Left — Logo + Name */}
                                <span className="flex min-w-0 items-center gap-3 sm:gap-4">
                                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.06] bg-white sm:h-10 sm:w-10">
                                    {store.logo ? (
                                      <Image
                                        src={
                                          store.logo
                                        }
                                        alt={
                                          store.name
                                        }
                                        fill
                                        className="object-contain p-1"
                                        sizes="56px"
                                      />
                                    ) : (
                                      <span className="text-sm font-semibold text-paseo-dark">
                                        {store.name
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </span>

                                  <span className="truncate font-semibold text-foreground transition-colors group-hover:text-paseo-dark">
                                    {store.name}
                                  </span>
                                </span>

                                {/* Right — Zone + Room */}
                                <span className="flex flex-row gap-2 shrink-0 text-right text-xs leading-5 text-muted sm:text-sm">
                                  {store.zone ||
                                  store.location ? (
                                    <>
                                      {store.zone ? (
                                        <span className="block">
                                          {store.zone}
                                        </span>
                                      ) : null}

                                      {store.location ? (
                                        <span className="block">
                                          {store.location}
                                        </span>
                                      ) : null}
                                    </>
                                  ) : (
                                    <span className="block">—</span>
                                  )}
                                </span>
                              </Link>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </section>
                ))
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paseo/10">
                    <Search
                      className="h-6 w-6 text-paseo-dark"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-4 font-semibold text-foreground">
                    ไม่พบร้านค้าที่ค้นหา
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    ลองเปลี่ยนคำค้นหา ชั้น หรือโซน
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =====================
              Map
          ====================== */}
          <div
            className={cn(
              "min-h-[520px] flex-col p-4 sm:p-5 lg:flex lg:min-h-[560px] xl:p-6",
              mobileView === "map"
                ? "flex"
                : "hidden",
            )}
          >
            {/* Map Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapIcon
                    className="h-4 w-4 text-paseo-dark"
                    aria-hidden="true"
                  />

                  <p className="text-sm font-semibold text-foreground">
                    ผังร้านค้า
                  </p>
                </div>

                <p className="mt-1 text-xs text-muted">
                  {[
                    activeBranch ? getLocalizedName(activeBranch, locale) : null,
                    activeMapLabel,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            {/* Map Content */}
            {activeMapImage ? (
              <button
                type="button"
                onClick={() => setMapImageOpen(true)}
                className="group relative flex-1 overflow-hidden rounded-2xl border border-black/[0.06] bg-white"
                aria-label={`ขยายผังร้านค้า ${activeMapLabel ?? ""}`}
              >
                <Image
                  src={activeMapImage}
                  alt={`ผังร้านค้า ${
                    activeMapLabel ?? ""
                  }`}
                  fill
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.01] sm:p-5"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                />

                <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ZoomIn
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </span>
              </button>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.1] bg-white px-6 text-center sm:px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paseo/10">
                  <MapIcon
                    className="h-7 w-7 text-paseo-dark"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-4 font-semibold text-foreground">
                  {activeMapLabel
                    ? `ยังไม่มีผังสำหรับ ${activeMapLabel}`
                    : "เลือกชั้นเพื่อดูผังร้านค้า"}
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  เลือกสาขาและชั้นที่ต้องการ
                  เพื่อค้นหาตำแหน่งร้านค้า
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================
            View All
        ========================== */}
        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href={`/stores?branch=${branchSlug}`}
            className="group inline-flex items-center gap-3 rounded-full border border-black/[0.1] bg-white px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-paseo-dark/40 hover:bg-paseo-dark hover:text-white"
          >
            ดูร้านค้าทั้งหมด

            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      {mapImageOpen && activeMapImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`ดูผังร้านค้า ${activeMapLabel ?? ""}`}
          onClick={() => setMapImageOpen(false)}
        >
          <div
            className="relative flex w-full max-w-6xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMapImageOpen(false)}
              className="absolute -top-2 right-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:-top-12"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="relative h-[min(85vh,900px)] w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={activeMapImage}
                alt={`ผังร้านค้า ${activeMapLabel ?? ""}`}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 1152px, 100vw"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}