import Link from "next/link";

import { SeoScoreBadge } from "@/components/admin/seo-score-badge";
import { AdminTableShell } from "@/components/admin/admin-table";
import { formatDate } from "@/lib/format";
import type { LocalizationSettings } from "@/lib/localization-settings";
import type { AttentionItem } from "@/lib/seo-workspace/types";
import { getWorkspaceScoreBandLabel } from "@/lib/seo-workspace/workspace-score-band";
import { cn } from "@/lib/utils";

const BAND_PILL_CLASSES = {
  excellent: "bg-emerald-50 text-emerald-800",
  good: "bg-amber-50 text-amber-900",
  needs_attention: "bg-red-50 text-red-800",
} as const;

const TYPE_LABELS = {
  post: "Post",
  event: "Event",
  promotion: "Promotion",
} as const;

type SeoAttentionTableProps = {
  items: AttentionItem[];
  issueFilter?: string;
  localization: LocalizationSettings;
};

export function SeoAttentionTable({ items, issueFilter, localization }: SeoAttentionTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background/60 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">Great job. No critical SEO issues found.</p>
        <p className="mt-1 text-sm text-muted">
          {issueFilter
            ? "No content matches this issue filter."
            : "Published content in this filter is in good shape."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Content requiring attention</h2>
        <span className="text-xs text-muted">Sorted by lowest score</span>
      </div>

      <AdminTableShell minWidth="64rem">
        <table className="w-full text-left text-sm" aria-label="Content requiring attention">
          <thead className="border-b border-border bg-background text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">SEO Score</th>
              <th className="px-4 py-3 font-medium">Potential</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Top Issue</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={`${item.contentType}-${item.id}`}>
                <td className="max-w-xs truncate px-4 py-3 font-medium text-foreground" title={item.title}>
                  {item.title}
                </td>
                <td className="px-4 py-3 text-muted">{TYPE_LABELS[item.contentType]}</td>
                <td className="px-4 py-3">
                  <SeoScoreBadge score={item.seoScore} />
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {item.recoverablePotential > 0 ? (
                    <div>
                      <span className="font-semibold text-foreground">+{item.recoverablePotential} pts</span>
                      <p className="text-xs text-muted">~{item.projectedScore} projected</p>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      BAND_PILL_CLASSES[item.scoreBand],
                    )}
                  >
                    {getWorkspaceScoreBandLabel(item.scoreBand)}
                  </span>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-muted" title={item.topIssue}>
                  {item.topIssue}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(item.updatedAt, localization)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={item.editHref}
                    className="text-sm font-medium text-paseo-dark hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
