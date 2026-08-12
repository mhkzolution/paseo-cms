"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { LocalizationSettings } from "@/lib/localization-settings";

import { AuditLogDrawer } from "@/features/audit-logs/audit-log-drawer";
import { AuditLogsFilters } from "@/features/audit-logs/audit-logs-filters";
import { hasActiveAuditFilters } from "@/features/audit-logs/audit-logs-filter-state";
import { AuditLogsPagination } from "@/features/audit-logs/audit-logs-pagination";
import { AuditLogsTable, type AuditLogListItem } from "@/features/audit-logs/audit-logs-table";

type AuditLogsPageClientProps = {
  items: AuditLogListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    module: string;
    action: string;
    severity: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    preset: string;
  };
  localization: LocalizationSettings;
};

export function AuditLogsPageClient({
  items,
  pagination,
  filters,
  localization,
}: AuditLogsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(null);

  const filtersActive = hasActiveAuditFilters({
    page: pagination.page,
    pageSize: pagination.pageSize,
    ...filters,
    preset: filters.preset as "" | "today" | "7d" | "30d",
  });

  const handleView = useCallback((id: string) => {
    setSelectedAuditLogId(id);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedAuditLogId(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium text-muted">System</div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted">Review who changed what across the CMS.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="lg:w-72 lg:shrink-0">
          <AuditLogsFilters />
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <AuditLogsPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />

          <AuditLogsTable
            items={items}
            localization={localization}
            hasActiveFilters={filtersActive}
            onView={handleView}
            onClearFilters={handleClearFilters}
          />

          {items.length > 0 ? (
            <AuditLogsPagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
            />
          ) : null}
        </div>
      </div>

      <AuditLogDrawer
        open={selectedAuditLogId !== null}
        auditLogId={selectedAuditLogId}
        onClose={handleCloseDrawer}
        localization={localization}
      />
    </div>
  );
}
