import { cn } from "@/lib/utils";

export type StatusBadgeTone = "success" | "warning" | "danger" | "muted";

export type StatusBadgeProps = {
  label: string;
  tone: StatusBadgeTone;
  className?: string;
};

const TONE_CLASS: Record<StatusBadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-1 ring-red-200",
  muted: "bg-neutral-100 text-muted ring-1 ring-border",
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
