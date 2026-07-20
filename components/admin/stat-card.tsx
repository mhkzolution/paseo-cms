import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-paseo-hover text-paseo-dark">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}
