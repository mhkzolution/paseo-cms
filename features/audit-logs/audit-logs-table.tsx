"use client";

import { ScrollText } from "lucide-react";
import type { AuditAction, AuditModule, AuditSeverity } from "@prisma/client";

import { AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { formatDateTimeWithSettings } from "@/lib/datetime-formatters";
import type { LocalizationSettings } from "@/lib/localization-settings";

import {
  AuditActionBadge,
  AuditModuleBadge,
  AuditSeverityBadge,
} from "@/features/audit-logs/audit-log-badges";

export type AuditLogListItem = {
  id: string;
  createdAt: string;
  severity: AuditSeverity;
  module: AuditModule;
  action: AuditAction;
  entityName: string | null;
  entitySlug: string | null;
  userName: string | null;
};

type AuditLogsTableProps = {
  items: AuditLogListItem[];
  localization: LocalizationSettings;
  hasActiveFilters: boolean;
  onView: (id: string) => void;
  onClearFilters: () => void;
};

function ViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
    >
      View
    </button>
  );
}

function EntityCell({ name, slug }: { name: string | null; slug: string | null }) {
  if (!name && !slug) {
    return <span className="text-muted">—</span>;
  }

  return (
    <div>
      <div className="font-medium text-foreground">{name ?? slug}</div>
      {name && slug ? <div className="text-xs text-muted">{slug}</div> : null}
    </div>
  );
}

export function AuditLogsTable({
  items,
  localization,
  hasActiveFilters,
  onView,
  onClearFilters,
}: AuditLogsTableProps) {
  if (items.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={ScrollText}
          title="No matching audit logs"
          description="Clear filters or widen the date range."
          action={
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-background"
            >
              Clear filters
            </button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={ScrollText}
        title="No audit logs found"
        description="Audit events will appear here as admins use the CMS."
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <AdminTableShell minWidth="56rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Severity</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">User</th>
                <th className="w-24 px-4 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDateTimeWithSettings(new Date(item.createdAt), localization)}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <AuditSeverityBadge severity={item.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <AuditModuleBadge module={item.module} />
                  </td>
                  <td className="px-4 py-3">
                    <AuditActionBadge action={item.action} />
                  </td>
                  <td className="px-4 py-3">
                    <EntityCell name={item.entityName} slug={item.entitySlug} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted lg:table-cell">
                    {item.userName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ViewButton onClick={() => onView(item.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      </div>

      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <AuditSeverityBadge severity={item.severity} />
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {item.module} • {item.action}
              </span>
            </div>
            <p className="mt-2 font-medium text-foreground">
              {item.entityName ?? item.entitySlug ?? "—"}
            </p>
            <p className="mt-1 text-sm text-muted">by {item.userName ?? "—"}</p>
            <p className="mt-1 text-sm text-muted">
              {formatDateTimeWithSettings(new Date(item.createdAt), localization)}
            </p>
            <div className="mt-3">
              <ViewButton onClick={() => onView(item.id)} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
