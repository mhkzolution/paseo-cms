import Link from "next/link";

import { AdminTableShell } from "@/components/admin/admin-table";
import type { InternalLinkOpportunity } from "@/lib/seo-workspace/types";
import { cn } from "@/lib/utils";

const TYPE_LABELS = {
  post: "Post",
  event: "Event",
  promotion: "Promotion",
} as const;

const COVERAGE_CLASSES = {
  "0 links": "bg-red-50 text-red-800",
  "1 link": "bg-amber-50 text-amber-900",
  "2 links": "bg-amber-50 text-amber-900",
  "3+ links": "bg-emerald-50 text-emerald-800",
} as const;

type SeoInternalLinksSectionProps = {
  items: InternalLinkOpportunity[];
};

export function SeoInternalLinksSection({ items }: SeoInternalLinksSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="seo-internal-links-heading" className="space-y-3">
      <h2 id="seo-internal-links-heading" className="text-sm font-semibold text-foreground">
        Internal link opportunities
      </h2>

      <AdminTableShell minWidth="48rem">
        <table className="w-full text-left text-sm" aria-label="Internal link opportunities">
          <thead className="border-b border-border bg-background text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Coverage</th>
              <th className="px-4 py-3 font-medium">Potential</th>
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
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      COVERAGE_CLASSES[item.coverageLabel],
                    )}
                  >
                    {item.coverageLabel}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-foreground">
                  {item.recoverablePotential > 0 ? `+${item.recoverablePotential} pts` : "—"}
                </td>
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
    </section>
  );
}
