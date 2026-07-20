"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { SearchPostListItem, SearchStoreListItem, type SearchResultItem } from "@/features/search/search-result-items";
import { Link } from "@/i18n/navigation";
import type { StoreCategory } from "@/lib/stores";
import { buildStoresHref } from "@/lib/stores";
import { cn } from "@/lib/utils";

type SearchResultType = "Post" | "Event" | "Promotion" | "Store";

type SearchResult = SearchResultItem & {
  type: SearchResultType;
};

type SiteSearchPanelProps = {
  open: boolean;
  onClose: () => void;
  storeCategories: StoreCategory[];
};

const TYPE_ORDER: SearchResultType[] = ["Post", "Store", "Event", "Promotion"];

export function SiteSearchPanel({ open, onClose, storeCategories }: SiteSearchPanelProps) {
  const t = useTranslations("search");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const typeLabels = useMemo(
    () =>
      ({
        Post: tNav("news"),
        Event: tNav("events"),
        Promotion: tNav("promotions"),
        Store: tNav("stores"),
      }) satisfies Record<SearchResultType, string>,
    [tNav],
  );

  const groupResults = useCallback(
    (items: SearchResult[]) => {
      const groups = new Map<SearchResultType, SearchResult[]>();
      for (const result of items) {
        const list = groups.get(result.type) ?? [];
        list.push(result);
        groups.set(result.type, list);
      }
      return TYPE_ORDER.filter((type) => groups.has(type)).map((type) => ({
        type,
        label: typeLabels[type],
        items: groups.get(type) ?? [],
      }));
    },
    [typeLabels],
  );

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setResults([]);
        setError(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&scope=public`);
      const body = (await response.json().catch(() => null)) as
        | { results?: SearchResult[]; error?: string }
        | null;

      if (!response.ok) {
        setError(body?.error ?? t("noResults"));
        setResults([]);
        setIsSearching(false);
        return;
      }

      setResults(
        (body?.results ?? []).filter((item) =>
          (TYPE_ORDER as string[]).includes(item.type),
        ) as SearchResult[],
      );
      setIsSearching(false);
    },
    [t],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, query, runSearch]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const grouped = groupResults(results);
  const hasQuery = query.trim().length > 0;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-label={tCommon("closeSearch")}
      />

      <div className="absolute left-0 right-0 top-full z-50 border-b border-black/8 bg-white shadow-lg">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              {tCommon("search")}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("placeholder")}
                className="h-11 w-full rounded-full border border-border bg-[#FAF9F6] pl-10 pr-4 text-sm outline-none transition-colors focus:border-foreground/30 focus:bg-white"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-paseo-hover"
              aria-label={tCommon("closeSearch")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 max-h-[min(60vh,520px)] overflow-y-auto">
            {storeCategories.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9B8459]">
                  {tCommon("categories")}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {storeCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={buildStoresHref({ category: category.slug })}
                      onClick={onClose}
                      className="inline-flex items-center rounded-full border border-[#E8E2D8] bg-[#FAF9F6] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[#9B8459] hover:text-[#9B8459]"
                    >
                      {category.name}
                      <span className="ml-2 text-xs text-muted">({category.storeCount})</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {hasQuery ? (
              <section className={cn(storeCategories.length > 0 && "mt-6 border-t border-border pt-6")}>
                {isSearching ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {tCommon("loading")}
                  </div>
                ) : error ? (
                  <p className="py-8 text-sm text-destructive">{error}</p>
                ) : grouped.length === 0 ? (
                  <p className="py-8 text-sm text-muted">{t("noResults")}</p>
                ) : (
                  <div className="grid gap-6">
                    {grouped.map((group) => (
                      <div key={group.type}>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {group.label}
                        </h3>
                        {group.type === "Store" ? (
                          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                            {group.items.map((item) => (
                              <li key={`${group.type}-${item.id}`}>
                                <SearchStoreListItem item={item} onNavigate={onClose} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="mt-3 grid gap-2">
                            {group.items.map((item) => (
                              <li key={`${group.type}-${item.id}`}>
                                <SearchPostListItem item={item} onNavigate={onClose} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <p className={cn("text-sm text-muted", storeCategories.length > 0 ? "mt-5" : "py-4")}>
                {t("placeholder")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
