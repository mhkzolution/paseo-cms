"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Filter, X } from "lucide-react";

import { getCatalogEntry } from "@/lib/seo-check-catalog";
import type { WorkspaceContentType } from "@/lib/seo-workspace/types";

import {
  countActiveFilters,
  DEFAULT_WORKSPACE_FILTERS,
  filtersToSearchParams,
  parseWorkspaceFilters,
  type WorkspaceFilterOption,
  type WorkspaceFilterState,
} from "@/features/seo-workspace/workspace-filters";

type SeoWorkspaceFiltersProps = {
  categories: WorkspaceFilterOption[];
  branches: WorkspaceFilterOption[];
  tags: WorkspaceFilterOption[];
};

const CONTENT_TYPES: Array<{ value: WorkspaceContentType; label: string }> = [
  { value: "post", label: "Posts" },
  { value: "event", label: "Events" },
  { value: "promotion", label: "Promotions" },
];

const SCORE_BANDS = [
  { value: "all", label: "All" },
  { value: "excellent", label: "Excellent (90+)" },
  { value: "good", label: "Good (70–89)" },
  { value: "needs_attention", label: "Needs Attention (<70)" },
] as const;

function FilterPanel({
  filters,
  categories,
  branches,
  tags,
  onChange,
  onClear,
}: {
  filters: WorkspaceFilterState;
  categories: WorkspaceFilterOption[];
  branches: WorkspaceFilterOption[];
  tags: WorkspaceFilterOption[];
  onChange: (next: WorkspaceFilterState) => void;
  onClear: () => void;
}) {
  const issueLabel = useMemo(() => {
    if (!filters.issue) return null;

    try {
      return getCatalogEntry(filters.issue).issueLabel;
    } catch {
      return filters.issue;
    }
  }, [filters.issue]);

  const toggleType = (type: WorkspaceContentType) => {
    const nextTypes = filters.types.includes(type)
      ? filters.types.filter((value) => value !== type)
      : [...filters.types, type];

    onChange({
      ...filters,
      types: nextTypes.length > 0 ? nextTypes : DEFAULT_WORKSPACE_FILTERS.types,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-paseo-dark hover:underline"
        >
          Clear filters
        </button>
      </div>

      {issueLabel ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-paseo/30 bg-paseo-hover px-3 py-2 text-xs">
          <span>
            Issue: <span className="font-medium text-foreground">{issueLabel}</span>
          </span>
          <button
            type="button"
            aria-label="Clear issue filter"
            onClick={() => onChange({ ...filters, issue: "" })}
            className="text-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Content type</p>
        {CONTENT_TYPES.map((type) => (
          <label key={type.value} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={filters.types.includes(type.value)}
              onChange={() => toggleType(type.value)}
              className="h-4 w-4 rounded border-border accent-paseo"
            />
            {type.label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">SEO score</p>
        {SCORE_BANDS.map((band) => (
          <label key={band.value} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="seo-score-band"
              checked={filters.band === band.value}
              onChange={() => onChange({ ...filters, band: band.value })}
              className="h-4 w-4 border-border accent-paseo"
            />
            {band.label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="seo-filter-category" className="text-xs font-medium text-foreground">
          Category
        </label>
        <select
          id="seo-filter-category"
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="seo-filter-branch" className="text-xs font-medium text-foreground">
          Branch
        </label>
        <select
          id="seo-filter-branch"
          value={filters.branch}
          onChange={(event) => onChange({ ...filters, branch: event.target.value })}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch.value} value={branch.value}>
              {branch.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="seo-filter-tag" className="text-xs font-medium text-foreground">
          Tag
        </label>
        <select
          id="seo-filter-tag"
          value={filters.tag}
          onChange={(event) => onChange({ ...filters, tag: event.target.value })}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.value} value={tag.value}>
              {tag.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function SeoWorkspaceFilters({ categories, branches, tags }: SeoWorkspaceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filters = useMemo(() => parseWorkspaceFilters(searchParams), [searchParams]);
  const activeCount = countActiveFilters(filters);

  const applyFilters = (next: WorkspaceFilterState) => {
    const params = filtersToSearchParams(next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const panel = (
    <FilterPanel
      filters={filters}
      categories={categories}
      branches={branches}
      tags={tags}
      onChange={applyFilters}
      onClear={clearFilters}
    />
  );

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-paseo px-2 py-0.5 text-xs text-foreground">{activeCount}</span>
        ) : null}
      </button>

      <aside className="hidden rounded-md border border-border bg-surface p-4 lg:sticky lg:top-6 lg:block lg:self-start">
        {panel}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-80 flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Filters</p>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scrollbar-paseo flex-1 overflow-y-auto p-4">{panel}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SeoWorkspaceSettingsLink() {
  return (
    <Link href="/admin/settings/seo" className="text-sm font-medium text-paseo-dark hover:underline">
      SEO Settings
    </Link>
  );
}
