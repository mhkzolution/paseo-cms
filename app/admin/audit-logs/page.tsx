import { Suspense } from "react";

import { requireModuleAccess } from "@/lib/rbac";
import { listAuditLogs, parseAuditLogsListQuery } from "@/lib/audit-logs-query";
import { getLocalizationSettings } from "@/lib/settings-cache";

import { parseAuditLogsFilterState } from "@/features/audit-logs/audit-logs-filter-state";
import { AuditLogsPageClient } from "@/features/audit-logs/audit-logs-page-client";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModuleAccess("audit-logs");

  const rawParams = await searchParams;
  const query = parseAuditLogsListQuery(rawParams);
  const [result, localization] = await Promise.all([
    listAuditLogs(query),
    getLocalizationSettings(),
  ]);

  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (Array.isArray(value)) {
      if (value[0]) urlParams.set(key, value[0]);
    } else if (value) {
      urlParams.set(key, value);
    }
  }

  const filterState = parseAuditLogsFilterState(urlParams);

  return (
    <Suspense>
      <AuditLogsPageClient
        items={result.items}
        pagination={result.pagination}
        filters={{
          module: filterState.module,
          action: filterState.action,
          severity: filterState.severity,
          search: filterState.search,
          dateFrom: filterState.dateFrom,
          dateTo: filterState.dateTo,
          preset: filterState.preset,
        }}
        localization={localization}
      />
    </Suspense>
  );
}
