"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AUDIT_LOG_PAGE_SIZES } from "@/lib/audit-logs-query";

import {
  filterStateToSearchParams,
  isAllowedPageSize,
  parseAuditLogsFilterState,
} from "@/features/audit-logs/audit-logs-filter-state";

type AuditLogsPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function formatAuditPaginationSummary(page: number, pageSize: number, total: number) {
  if (total === 0) return "No results";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}–${end} of ${total}`;
}

export function AuditLogsPagination({ page, pageSize, total, totalPages }: AuditLogsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = parseAuditLogsFilterState(searchParams);

  const navigate = (patch: { page?: number; pageSize?: number }) => {
    const next = {
      ...filters,
      page: patch.page ?? filters.page,
      pageSize: patch.pageSize ?? filters.pageSize,
    };

    if (patch.pageSize && patch.pageSize !== filters.pageSize) {
      next.page = 1;
    }

    const params = filterStateToSearchParams(next);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const canGoPrev = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{formatAuditPaginationSummary(page, pageSize, total)}</p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (isAllowedPageSize(parsed)) {
                navigate({ pageSize: parsed, page: 1 });
              }
            }}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          >
            {AUDIT_LOG_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => navigate({ page: page - 1 })}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => navigate({ page: page + 1 })}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
