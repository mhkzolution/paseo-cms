import { cn } from "@/lib/utils";
import type { AppRole } from "@/types";

const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  MARKETING: "Marketing",
  VIEWER: "Viewer",
};

const ROLE_CLASSES: Record<AppRole, string> = {
  SUPER_ADMIN: "bg-paseo text-foreground",
  ADMIN: "bg-paseo-hover text-paseo-dark",
  EDITOR: "bg-[#E8F0D8] text-paseo-dark",
  MARKETING: "bg-[#F3F1EC] text-foreground",
  VIEWER: "bg-muted/20 text-muted",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ROLE_CLASSES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
