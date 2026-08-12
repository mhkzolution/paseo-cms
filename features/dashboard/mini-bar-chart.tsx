import type { DailyCount } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type MiniBarChartProps = {
  data: DailyCount[];
  className?: string;
};

export function MiniBarChart({ data, className }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((point) => point.count));

  return (
    <div className={cn("flex h-24 items-end gap-0.5", className)} aria-hidden="true">
      {data.map((point) => {
        const heightPercent = Math.round((point.count / max) * 100);

        return (
          <div
            key={point.date}
            className="flex-1 rounded-sm bg-paseo/25"
            style={{ height: `${Math.max(heightPercent, point.count > 0 ? 8 : 2)}%` }}
            title={`${point.date}: ${point.count}`}
          />
        );
      })}
    </div>
  );
}
