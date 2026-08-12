import Link from "next/link";

import type { DashboardSeoOverview } from "@/lib/dashboard/types";

type SeoOverviewCardProps = {
  overview: DashboardSeoOverview;
};

export function SeoOverviewCard({ overview }: SeoOverviewCardProps) {
  const avgDisplay = overview.auditedCount === 0 ? "—" : String(overview.averageScore);

  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">SEO overview</h3>
      <p className="mt-1 text-xs text-muted">Based on {overview.auditedCount.toLocaleString()} audited items</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Average</dt>
          <dd className="text-xl font-semibold tabular-nums text-foreground">{avgDisplay}</dd>
        </div>
        <div>
          <dt className="text-muted">Coverage</dt>
          <dd className="font-semibold tabular-nums text-foreground">{overview.coveragePercent}%</dd>
        </div>
        <div>
          <dt className="text-muted">Excellent</dt>
          <dd className="font-medium text-emerald-800">{overview.excellentPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted">Needs attention</dt>
          <dd>
            <Link
              href="/admin/seo/workspace?band=needs_attention"
              className="font-medium text-red-800 hover:underline"
            >
              {overview.needsAttentionPercent}% ({overview.needsAttentionCount.toLocaleString()} items)
            </Link>
          </dd>
        </div>
      </dl>

      <Link
        href="/admin/seo/workspace"
        className="mt-4 inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-background"
      >
        View SEO Workspace
      </Link>
    </div>
  );
}
