"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AuditAction, AuditModule } from "@prisma/client";

import { formatDateTimeWithSettings } from "@/lib/datetime-formatters";
import type { LocalizationSettings } from "@/lib/localization-settings";

import { AuditLogChanges } from "@/features/audit-logs/audit-log-changes";
import { AuditActionBadge, AuditModuleBadge } from "@/features/audit-logs/audit-log-badges";
import { formatEnumLabel } from "@/features/audit-logs/audit-logs-filter-state";

export type AuditLogDetail = {
  id: string;
  createdAt: string;
  severity: string;
  module: AuditModule;
  action: AuditAction;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  entityId: string | null;
  entityType: string | null;
  entityName: string | null;
  entitySlug: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};

type AuditLogDrawerProps = {
  open: boolean;
  auditLogId: string | null;
  onClose: () => void;
  localization: LocalizationSettings;
};

const emptyValue = (value: string | null | undefined) => value ?? "—";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function AuditLogDrawer({ open, auditLogId, onClose, localization }: AuditLogDrawerProps) {
  if (!open || !auditLogId) return null;

  return (
    <AuditLogDrawerContent
      key={auditLogId}
      auditLogId={auditLogId}
      onClose={onClose}
      localization={localization}
    />
  );
}

function AuditLogDrawerContent({
  auditLogId,
  onClose,
  localization,
}: {
  auditLogId: string;
  onClose: () => void;
  localization: LocalizationSettings;
}) {
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setDetail(null);

    void fetch(`/api/admin/audit-logs/${auditLogId}`)
      .then(async (response) => {
        if (cancelled) return;

        if (response.status === 404) {
          setError("This audit log was not found.");
          return;
        }

        if (response.status === 403 || response.status === 401) {
          setError("You do not have permission to view this audit log.");
          return;
        }

        if (!response.ok) {
          setError("Could not load audit details. Please try again.");
          return;
        }

        const body = (await response.json()) as AuditLogDetail;
        setDetail(body);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load audit details. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auditLogId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Audit log details"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Audit log details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted hover:bg-background hover:text-foreground"
            aria-label="Close audit log details"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-muted">Loading audit details...</p>
          ) : error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : detail ? (
            <div className="space-y-6">
              <header className="flex flex-wrap items-center gap-2">
                <AuditActionBadge action={detail.action} />
                <AuditModuleBadge module={detail.module} />
                <span className="text-sm text-muted">
                  {formatDateTimeWithSettings(new Date(detail.createdAt), localization)}
                </span>
              </header>

              <section>
                <h3 className="text-sm font-semibold text-foreground">Actor</h3>
                <dl className="mt-3 grid gap-3">
                  <DetailField label="User name" value={emptyValue(detail.userName)} />
                  <DetailField
                    label="Role"
                    value={detail.userRole ? formatEnumLabel(detail.userRole) : "—"}
                  />
                </dl>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground">Entity</h3>
                <dl className="mt-3 grid gap-3">
                  <DetailField label="Type" value={emptyValue(detail.entityType)} />
                  <DetailField label="Name" value={emptyValue(detail.entityName)} />
                  <DetailField label="Slug" value={emptyValue(detail.entitySlug)} />
                </dl>
              </section>

              <section className="border-t border-border pt-5">
                <AuditLogChanges changes={detail.changes} />
              </section>

              <section className="border-t border-border pt-5">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Advanced Details
                  </summary>
                  <dl className="mt-3 grid gap-3">
                    <DetailField label="IP Address" value={emptyValue(detail.ipAddress)} />
                    <DetailField label="User Agent" value={emptyValue(detail.userAgent)} />
                    <DetailField label="Audit ID" value={detail.id} />
                  </dl>
                </details>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
