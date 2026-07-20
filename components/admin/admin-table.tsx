import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function AdminPageHeader({ title, description, action, className }: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

interface AdminTableShellProps {
  children: ReactNode;
  className?: string;
  /** Minimum table width before horizontal scroll kicks in */
  minWidth?: string;
}

export function AdminTableShell({
  children,
  className,
  minWidth = "44rem",
}: AdminTableShellProps) {
  return (
    <div className={cn("-mx-1 rounded-lg border border-border bg-surface sm:mx-0", className)}>
      <div className="scrollbar-paseo overflow-x-auto overscroll-x-contain">
        <div style={{ minWidth }} className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
