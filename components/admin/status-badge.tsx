import { cn } from "@/lib/utils";

type Status = "ACTIVE" | "INACTIVE" | "SUSPENDED";

const STATUS_LABELS: Record<Status, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

const STATUS_CLASSES: Record<Status, string> = {
  ACTIVE: "bg-paseo-hover text-paseo-dark",
  INACTIVE: "bg-muted/20 text-muted",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
