"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { StoreArchivePageGrid } from "@/features/stores/store-archive-section";
import type { ArchiveStore } from "@/lib/stores";

type StoresArchiveClientProps = {
  stores: ArchiveStore[];
  listingQuery?: { category?: string; branch?: string };
  emptyMessage: string;
  searchPlaceholder: string;
};

export function StoresArchiveClient({
  stores,
  listingQuery,
  emptyMessage,
  searchPlaceholder,
}: StoresArchiveClientProps) {
  const [query, setQuery] = useState("");

  const filteredStores = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stores;

    return stores.filter((store) => {
      return (
        store.name.toLowerCase().includes(normalized) ||
        store.category?.name.toLowerCase().includes(normalized) ||
        store.location?.toLowerCase().includes(normalized) ||
        store.zone?.toLowerCase().includes(normalized) ||
        store.floor?.toLowerCase().includes(normalized)
      );
    });
  }, [query, stores]);

  const noResultsMessage = query.trim() ? "ไม่พบร้านค้าที่ตรงกับคำค้นหา" : emptyMessage;

  return (
    <div className="flex flex-col gap-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-14 w-full rounded-2xl border border-black/[0.08] bg-white pl-14 pr-5 text-sm outline-none transition-all placeholder:text-muted focus:border-paseo-dark/50 focus:ring-4 focus:ring-paseo/10 sm:h-16 sm:text-base"
        />
      </div>

      <StoreArchivePageGrid
        stores={filteredStores}
        listingQuery={listingQuery}
        emptyMessage={noResultsMessage}
      />
    </div>
  );
}
