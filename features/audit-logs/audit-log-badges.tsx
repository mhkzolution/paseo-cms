import type { AuditAction, AuditModule, AuditSeverity } from "@prisma/client";

import { cn } from "@/lib/utils";

import { formatEnumLabel } from "@/features/audit-logs/audit-logs-filter-state";

const SEVERITY_CLASSES: Record<AuditSeverity, string> = {
  INFO: "bg-muted/20 text-muted",
  WARNING: "bg-amber-100 text-amber-900",
  CRITICAL: "bg-red-100 text-red-800",
};

const MODULE_CLASSES: Record<AuditModule, string> = {
  AUTH: "bg-[#F3F1EC] text-foreground",
  POSTS: "bg-paseo-hover text-paseo-dark",
  EVENTS: "bg-[#E8F0D8] text-paseo-dark",
  PROMOTIONS: "bg-paseo/30 text-paseo-dark",
  PAGES: "bg-muted/20 text-muted",
  SETTINGS: "bg-[#F3F1EC] text-foreground",
  LOCALIZATION: "bg-[#E8F0D8] text-paseo-dark",
  MEDIA: "bg-paseo-hover text-paseo-dark",
  USERS: "bg-paseo text-foreground",
};

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function AuditSeverityBadge({ severity }: { severity: AuditSeverity }) {
  return <Badge label={severity} className={SEVERITY_CLASSES[severity]} />;
}

export function AuditModuleBadge({ module }: { module: AuditModule }) {
  return <Badge label={formatEnumLabel(module)} className={MODULE_CLASSES[module]} />;
}

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return (
    <Badge
      label={formatEnumLabel(action)}
      className="bg-background text-foreground ring-1 ring-inset ring-border"
    />
  );
}
