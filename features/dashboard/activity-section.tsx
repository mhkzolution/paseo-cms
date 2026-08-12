import type { ActivitySeries } from "@/lib/dashboard/types";
import { MiniBarChart } from "@/features/dashboard/mini-bar-chart";

type ActivitySectionProps = {
  published: ActivitySeries;
  created: ActivitySeries;
  updated: ActivitySeries;
};

function ActivityChartCard({ title, series }: { title: string; series: ActivitySeries }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted">Last 30 days</span>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {series.periodTotal.toLocaleString()}
      </p>
      <MiniBarChart data={series.daily} className="mt-4" />
    </div>
  );
}

export function ActivitySection({ published, created, updated }: ActivitySectionProps) {
  return (
    <section aria-labelledby="content-activity-heading" className="space-y-3">
      <h2 id="content-activity-heading" className="text-sm font-semibold text-foreground">
        Content activity
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <ActivityChartCard title="Content published" series={published} />
        <ActivityChartCard title="Content created" series={created} />
        <ActivityChartCard title="Content updated" series={updated} />
      </div>
    </section>
  );
}
