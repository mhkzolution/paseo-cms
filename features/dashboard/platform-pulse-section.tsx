import type { PlatformPulse } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type PlatformPulseSectionProps = {
  pulse: PlatformPulse;
};

function KpiCard({
  label,
  value,
  subtext,
  accentClass,
}: {
  label: string;
  value: string;
  subtext: string;
  accentClass?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-surface p-4", accentClass)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{subtext}</p>
    </div>
  );
}

export function PlatformPulseSection({ pulse }: PlatformPulseSectionProps) {
  const coverageWarning = pulse.auditCoveragePercent < 80;
  const avgDisplay = pulse.auditedPublishedCount === 0 ? "—" : String(pulse.averageSeoScore);

  return (
    <section aria-labelledby="platform-pulse-heading" className="space-y-3">
      <h2 id="platform-pulse-heading" className="sr-only">
        Platform pulse
      </h2>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Posts" value={pulse.posts.toLocaleString()} subtext="All statuses" />
        <KpiCard label="Total Events" value={pulse.events.toLocaleString()} subtext="All statuses" />
        <KpiCard
          label="Total Promotions"
          value={pulse.promotions.toLocaleString()}
          subtext="All statuses"
        />
        <KpiCard
          label="Published"
          value={`${pulse.publishedPercent}%`}
          subtext={`${pulse.publishedCount.toLocaleString()} of ${pulse.totalCount.toLocaleString()} content`}
        />
        <KpiCard
          label="Audit Coverage"
          value={`${pulse.auditCoveragePercent}%`}
          subtext={`${pulse.auditedPublishedCount.toLocaleString()} of ${pulse.publishedCount.toLocaleString()} published`}
          accentClass={coverageWarning ? "border-l-4 border-l-amber-500" : undefined}
        />
        <KpiCard
          label="Avg SEO"
          value={avgDisplay}
          subtext={`Audited only · ${pulse.auditCoveragePercent}% coverage`}
          accentClass={coverageWarning ? "border-l-4 border-l-amber-500" : undefined}
        />
      </div>
    </section>
  );
}
