import Link from "next/link";

import type { QuickWinItem } from "@/lib/seo-workspace/types";

type SeoQuickWinsSectionProps = {
  items: QuickWinItem[];
};

export function SeoQuickWinsSection({ items }: SeoQuickWinsSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="seo-quick-wins-heading" className="space-y-3">
      <h2 id="seo-quick-wins-heading" className="text-sm font-semibold text-foreground">
        Quick wins
      </h2>

      <ul className="divide-y divide-border rounded-md border border-border bg-surface">
        {items.map((item) => (
          <li key={item.checkId} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.issue}</p>
              <p className="text-xs text-muted">{item.affectedCount.toLocaleString()} items affected</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold tabular-nums text-foreground">
                +{item.estimatedImpact} pts
              </span>
              <Link href={item.deepLink} className="text-sm font-medium text-paseo-dark hover:underline">
                View affected items
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
