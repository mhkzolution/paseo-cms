import { AuditAction, AuditModule, AuditSeverity } from "@prisma/client";

import {
  AUDIT_LOG_PAGE_SIZES,
  normalizeAuditSearch,
  parseAuditLogsListQuery,
} from "@/lib/audit-logs-query";

export type AuditLogsDatePreset = "today" | "7d" | "30d";

export type AuditLogsFilterState = {
  page: number;
  pageSize: number;
  module: string;
  action: string;
  severity: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  preset: AuditLogsDatePreset | "";
};

export const DEFAULT_AUDIT_LOGS_FILTERS: AuditLogsFilterState = {
  page: 1,
  pageSize: 50,
  module: "",
  action: "",
  severity: "",
  search: "",
  dateFrom: "",
  dateTo: "",
  preset: "",
};

export const AUDIT_MODULE_OPTIONS = Object.values(AuditModule);
export const AUDIT_ACTION_OPTIONS = Object.values(AuditAction);
export const AUDIT_SEVERITY_OPTIONS = Object.values(AuditSeverity);

export const AUDIT_DATE_PRESETS: Array<{ value: AuditLogsDatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

const BANGKOK_TZ = "Asia/Bangkok";

function formatBangkokDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

function shiftBangkokDate(dateStr: string, days: number): string {
  const anchor = new Date(`${dateStr}T12:00:00+07:00`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return formatBangkokDate(anchor);
}

export function resolveDatePreset(preset: AuditLogsDatePreset): { dateFrom: string; dateTo: string } {
  const today = formatBangkokDate(new Date());

  if (preset === "today") {
    return { dateFrom: today, dateTo: today };
  }

  if (preset === "7d") {
    return { dateFrom: shiftBangkokDate(today, -6), dateTo: today };
  }

  return { dateFrom: shiftBangkokDate(today, -29), dateTo: today };
}

export function searchParamsToRecord(
  searchParams: URLSearchParams,
): Record<string, string | string[] | undefined> {
  const record: Record<string, string | string[] | undefined> = {};
  searchParams.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export function parseAuditLogsFilterState(searchParams: URLSearchParams): AuditLogsFilterState {
  const parsed = parseAuditLogsListQuery(searchParamsToRecord(searchParams));
  const presetRaw = searchParams.get("preset");
  const preset: AuditLogsDatePreset | "" =
    presetRaw === "today" || presetRaw === "7d" || presetRaw === "30d" ? presetRaw : "";

  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    module: parsed.module ?? "",
    action: parsed.action ?? "",
    severity: parsed.severity ?? "",
    search: searchParams.get("search")?.trim() ?? "",
    dateFrom: parsed.dateFrom ?? "",
    dateTo: parsed.dateTo ?? "",
    preset,
  };
}

export function hasActiveAuditFilters(state: AuditLogsFilterState): boolean {
  return Boolean(
    state.module ||
      state.action ||
      state.severity ||
      normalizeAuditSearch(state.search) ||
      state.dateFrom ||
      state.dateTo,
  );
}

export function filterStateToSearchParams(
  state: AuditLogsFilterState,
  options?: { resetPage?: boolean },
): URLSearchParams {
  const params = new URLSearchParams();
  const page = options?.resetPage ? 1 : state.page;

  if (page > 1) params.set("page", String(page));
  if (state.pageSize !== DEFAULT_AUDIT_LOGS_FILTERS.pageSize) {
    params.set("pageSize", String(state.pageSize));
  }
  if (state.module) params.set("module", state.module);
  if (state.action) params.set("action", state.action);
  if (state.severity) params.set("severity", state.severity);

  const search = state.search.trim();
  if (search) params.set("search", search);

  if (state.dateFrom) params.set("dateFrom", state.dateFrom);
  if (state.dateTo) params.set("dateTo", state.dateTo);

  if (state.preset) params.set("preset", state.preset);

  return params;
}

export function countActiveAuditFilters(state: AuditLogsFilterState): number {
  let count = 0;
  if (state.module) count += 1;
  if (state.action) count += 1;
  if (state.severity) count += 1;
  if (normalizeAuditSearch(state.search)) count += 1;
  if (state.dateFrom || state.dateTo || state.preset) count += 1;
  return count;
}

export function isAllowedPageSize(value: number): value is (typeof AUDIT_LOG_PAGE_SIZES)[number] {
  return (AUDIT_LOG_PAGE_SIZES as readonly number[]).includes(value);
}

export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
