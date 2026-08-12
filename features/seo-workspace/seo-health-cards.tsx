import type { SeoWorkspaceHealth } from "@/lib/seo-workspace/types";
import { cn } from "@/lib/utils";

type SeoHealthCardsProps = {
  health: SeoWorkspaceHealth;
};

function HealthCard({
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
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-4",
        accentClass,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{subtext}</p>
    </div>
  );
}

export function SeoHealthCards({ health }: SeoHealthCardsProps) {
  const excellentPercent =
    health.auditedCount === 0
      ? 0
      : Math.round((health.excellentCount / health.auditedCount) * 100);
  const needsAttentionPercent =
    health.auditedCount === 0
      ? 0
      : Math.round((health.needsAttentionCount / health.auditedCount) * 100);

  const coverageWarning = health.auditCoverage < 80;

  return (
    <section aria-labelledby="seo-health-heading" className="space-y-3">
      <h2 id="seo-health-heading" className="sr-only">
        SEO health overview
      </h2>

      {coverageWarning ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Average score reflects audited content only ({health.auditedCount.toLocaleString()} of{" "}
          {health.totalPublished.toLocaleString()}). Review unaudited items below or recalculate.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <HealthCard
          label="Total Published"
          value={health.totalPublished.toLocaleString()}
          subtext="Posts, events, promotions"
        />
        <HealthCard
          label="Average Score"
          value={health.auditedCount === 0 ? "—" : String(health.averageScore)}
          subtext="Audited content only"
        />
        <HealthCard
          label="Audit Coverage"
          value={`${health.auditCoverage}%`}
          subtext={`${health.auditedCount.toLocaleString()} / ${health.totalPublished.toLocaleString()}`}
          accentClass={coverageWarning ? "border-l-4 border-l-amber-500" : undefined}
        />
        <HealthCard
          label="Excellent (90+)"
          value={health.excellentCount.toLocaleString()}
          subtext={`${excellentPercent}% of audited`}
          accentClass="border-l-4 border-l-emerald-500"
        />
        <HealthCard
          label="Needs Attention (&lt;70)"
          value={health.needsAttentionCount.toLocaleString()}
          subtext={`${needsAttentionPercent}% of audited`}
          accentClass="border-l-4 border-l-red-500"
        />
      </div>
    </section>
  );
}
