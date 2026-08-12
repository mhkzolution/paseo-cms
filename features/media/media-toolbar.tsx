"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type MediaFilter = "all" | "IMAGE" | "PDF" | "VIDEO";
export type MediaSort = "newest" | "oldest" | "name-asc" | "name-desc";

const DEFAULT_TYPE_OPTIONS: MediaFilter[] = ["all", "IMAGE", "PDF", "VIDEO"];

const TYPE_LABELS: Record<MediaFilter, string> = {
  all: "All",
  IMAGE: "Images",
  PDF: "PDF",
  VIDEO: "Videos",
};

interface MediaToolbarProps {
  query: string;
  type: MediaFilter;
  sort: MediaSort;
  onQueryChange: (query: string) => void;
  onTypeChange: (type: MediaFilter) => void;
  onSortChange: (sort: MediaSort) => void;
  typeOptions?: MediaFilter[];
  className?: string;
}

export function MediaToolbar({
  query,
  type,
  sort,
  onQueryChange,
  onTypeChange,
  onSortChange,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  className,
}: MediaToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search media</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-paseo"
          placeholder="Search media..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="sr-only">Filter media type</span>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-paseo"
          value={type}
          onChange={(event) => onTypeChange(event.target.value as MediaFilter)}
        >
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {TYPE_LABELS[option]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="sr-only">Sort media</span>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-paseo"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MediaSort)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name-asc">A–Z</option>
          <option value="name-desc">Z–A</option>
        </select>
      </label>
    </div>
  );
}
