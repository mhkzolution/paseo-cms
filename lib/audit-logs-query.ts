import {
  AuditAction,
  AuditModule,
  AuditSeverity,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const AUDIT_LOG_PAGE_SIZES = [25, 50, 100] as const;

export const AUDIT_LOG_ORDER_BY: Prisma.AuditLogOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type ParsedAuditLogsListQuery = {
  page: number;
  pageSize: number;
  module?: AuditModule;
  action?: AuditAction;
  severity?: AuditSeverity;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function normalizeAuditSearch(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim() ?? "";
  if (trimmed.length < 2) return undefined;
  return trimmed;
}

function readQueryValue(input: Record<string, string | string[] | undefined>, key: string) {
  const value = input[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseEnumValue<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function parsePageSize(raw: string | undefined): number {
  const parsed = Number(raw);
  if (parsed === 25 || parsed === 50 || parsed === 100) return parsed;
  return 50;
}

/**
 * Converts YYYY-MM-DD admin date inputs to UTC instants using Asia/Bangkok
 * start-of-day (00:00:00) and end-of-day (23:59:59.999).
 *
 * Uses explicit +07:00 offsets because existing parseBangkokDateTime stores
 * wall-clock values as UTC slots without timezone conversion.
 */
export function resolveBangkokDayBounds(
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } {
  const bounds: { gte?: Date; lte?: Date } = {};

  if (dateFrom && DATE_ONLY_PATTERN.test(dateFrom)) {
    bounds.gte = new Date(`${dateFrom}T00:00:00+07:00`);
  }

  if (dateTo && DATE_ONLY_PATTERN.test(dateTo)) {
    bounds.lte = new Date(`${dateTo}T23:59:59.999+07:00`);
  }

  return bounds;
}

export function parseAuditLogsListQuery(
  input: Record<string, string | string[] | undefined>,
): ParsedAuditLogsListQuery {
  return {
    page: parsePage(readQueryValue(input, "page")),
    pageSize: parsePageSize(readQueryValue(input, "pageSize")),
    module: parseEnumValue(readQueryValue(input, "module"), Object.values(AuditModule)),
    action: parseEnumValue(readQueryValue(input, "action"), Object.values(AuditAction)),
    severity: parseEnumValue(readQueryValue(input, "severity"), Object.values(AuditSeverity)),
    search: normalizeAuditSearch(readQueryValue(input, "search")),
    dateFrom: readQueryValue(input, "dateFrom") || undefined,
    dateTo: readQueryValue(input, "dateTo") || undefined,
  };
}

export function buildAuditLogsWhere(filters: ParsedAuditLogsListQuery): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.module) where.module = filters.module;
  if (filters.action) where.action = filters.action;
  if (filters.severity) where.severity = filters.severity;

  const { gte, lte } = resolveBangkokDayBounds(filters.dateFrom, filters.dateTo);
  if (gte || lte) {
    where.createdAt = {};
    if (gte) where.createdAt.gte = gte;
    if (lte) where.createdAt.lte = lte;
  }

  const search = normalizeAuditSearch(filters.search);
  if (search) {
    where.OR = [
      { entityName: { contains: search } },
      { entitySlug: { contains: search } },
      { userName: { contains: search } },
    ];
  }

  return where;
}

export const auditLogListSelect = {
  id: true,
  createdAt: true,
  severity: true,
  module: true,
  action: true,
  entityName: true,
  entitySlug: true,
  userName: true,
} as const;

export async function listAuditLogs(filters: ParsedAuditLogsListQuery) {
  const where = buildAuditLogsWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: AUDIT_LOG_ORDER_BY,
      skip,
      take: filters.pageSize,
      select: auditLogListSelect,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / filters.pageSize),
    },
  };
}

export const auditLogDetailSelect = {
  id: true,
  createdAt: true,
  severity: true,
  module: true,
  action: true,
  userId: true,
  userName: true,
  userRole: true,
  entityId: true,
  entityType: true,
  entityName: true,
  entitySlug: true,
  changes: true,
  ipAddress: true,
  userAgent: true,
} as const;

export async function getAuditLogById(id: string) {
  const row = await prisma.auditLog.findUnique({
    where: { id },
    select: auditLogDetailSelect,
  });

  if (!row) return null;

  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    userRole: row.userRole ?? null,
    changes: row.changes as Record<string, unknown> | null,
  };
}
