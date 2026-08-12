"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";

import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_DATE_PRESETS,
  AUDIT_MODULE_OPTIONS,
  AUDIT_SEVERITY_OPTIONS,
  countActiveAuditFilters,
  DEFAULT_AUDIT_LOGS_FILTERS,
  filterStateToSearchParams,
  formatEnumLabel,
  parseAuditLogsFilterState,
  resolveDatePreset,
  type AuditLogsDatePreset,
  type AuditLogsFilterState,
} from "@/features/audit-logs/audit-logs-filter-state";

const selectClassName =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";

function FilterFields({
  filters,
  onChange,
  onClear,
}: {
  filters: AuditLogsFilterState;
  onChange: (next: AuditLogsFilterState) => void;
  onClear: () => void;
}) {
  const [searchDraft, setSearchDraft] = useState(filters.search);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  const commitSearch = () => {
    if (searchDraft !== filters.search) {
      onChange({ ...filters, search: searchDraft });
    }
  };

  const applyPreset = (preset: AuditLogsDatePreset) => {
    const { dateFrom, dateTo } = resolveDatePreset(preset);
    onChange({ ...filters, preset, dateFrom, dateTo });
  };

  const applyCustomRange = (patch: Partial<Pick<AuditLogsFilterState, "dateFrom" | "dateTo">>) => {
    onChange({
      ...filters,
      ...patch,
      preset: "",
    });
  };

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        <label htmlFor="audit-filter-search" className="text-xs font-medium text-foreground">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="audit-filter-search"
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onBlur={commitSearch}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitSearch();
              }
            }}
            placeholder="Entity name, slug, or user"
            className={`${selectClassName} pl-9`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="audit-filter-module" className="text-xs font-medium text-foreground">
            Module
          </label>
          <select
            id="audit-filter-module"
            value={filters.module}
            onChange={(event) => onChange({ ...filters, module: event.target.value })}
            className={selectClassName}
          >
            <option value="">All modules</option>
            {AUDIT_MODULE_OPTIONS.map((module) => (
              <option key={module} value={module}>
                {formatEnumLabel(module)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="audit-filter-action" className="text-xs font-medium text-foreground">
            Action
          </label>
          <select
            id="audit-filter-action"
            value={filters.action}
            onChange={(event) => onChange({ ...filters, action: event.target.value })}
            className={selectClassName}
          >
            <option value="">All actions</option>
            {AUDIT_ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {formatEnumLabel(action)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="audit-filter-severity" className="text-xs font-medium text-foreground">
            Severity
          </label>
          <select
            id="audit-filter-severity"
            value={filters.severity}
            onChange={(event) => onChange({ ...filters, severity: event.target.value })}
            className={selectClassName}
          >
            <option value="">All severities</option>
            {AUDIT_SEVERITY_OPTIONS.map((severity) => (
              <option key={severity} value={severity}>
                {formatEnumLabel(severity)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Date range</p>
        <div className="flex flex-wrap gap-2">
          {AUDIT_DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => applyPreset(preset.value)}
              className={
                filters.preset === preset.value
                  ? "rounded-md bg-paseo px-3 py-1.5 text-xs font-medium text-foreground"
                  : "rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="audit-filter-date-from" className="text-xs font-medium text-muted">
              From
            </label>
            <input
              id="audit-filter-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => applyCustomRange({ dateFrom: event.target.value })}
              className={selectClassName}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="audit-filter-date-to" className="text-xs font-medium text-muted">
              To
            </label>
            <input
              id="audit-filter-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(event) => applyCustomRange({ dateTo: event.target.value })}
              className={selectClassName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filters = useMemo(() => parseAuditLogsFilterState(searchParams), [searchParams]);
  const activeCount = countActiveAuditFilters(filters);

  const pushFilters = (next: AuditLogsFilterState, resetPage = true) => {
    const params = filterStateToSearchParams(next, { resetPage });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const panel = (
    <FilterFields
      filters={filters}
      onChange={(next) => pushFilters(next, true)}
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

      <div className="hidden rounded-md border border-border bg-surface p-4 lg:block">{panel}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-surface shadow-xl">
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

export { DEFAULT_AUDIT_LOGS_FILTERS };
