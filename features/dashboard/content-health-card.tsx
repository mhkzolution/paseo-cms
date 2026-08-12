import Link from "next/link";

import type { ContentHealthItem } from "@/lib/dashboard/types";

type ContentHealthCardProps = {
  items: ContentHealthItem[];
};

export function ContentHealthCard({ items }: ContentHealthCardProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">Content health</h3>
      <p className="mt-1 text-xs text-muted">Top issue types across published content</p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No outstanding SEO issues detected.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-md border border-border">
          {items.map((item) => (
            <li key={item.checkId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <Link
                href={`/admin/seo/workspace?issue=${encodeURIComponent(item.checkId)}`}
                className="text-foreground hover:underline"
              >
                {item.label}
              </Link>
              <span className="font-semibold tabular-nums text-foreground">{item.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
