import { cn } from "@/lib/utils";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const STATUS_CLASSES: Record<ContentStatus, string> = {
  DRAFT: "bg-muted/20 text-muted",
  PUBLISHED: "bg-paseo-hover text-paseo-dark",
  ARCHIVED: "bg-foreground/5 text-muted",
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {status}
    </span>
  );
}
