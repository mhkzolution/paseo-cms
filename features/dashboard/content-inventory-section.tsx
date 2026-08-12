import Link from "next/link";

import type { ContentInventory } from "@/lib/dashboard/types";

type ContentInventorySectionProps = {
  inventory: ContentInventory;
};

function InventoryCard({
  label,
  slice,
  href,
}: {
  label: string;
  slice: ContentInventory["posts"];
  href: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className="text-2xl font-semibold tabular-nums text-foreground">{slice.total.toLocaleString()}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        <li className="flex justify-between text-muted">
          <span>Published</span>
          <span className="tabular-nums text-foreground">{slice.published.toLocaleString()}</span>
        </li>
        <li className="flex justify-between text-muted">
          <span>Draft</span>
          <span className="tabular-nums text-foreground">{slice.draft.toLocaleString()}</span>
        </li>
      </ul>
      <Link href={href} className="mt-3 inline-block text-xs font-medium text-paseo-dark hover:underline">
        View all {label.toLowerCase()} →
      </Link>
    </div>
  );
}

export function ContentInventorySection({ inventory }: ContentInventorySectionProps) {
  return (
    <section aria-labelledby="content-inventory-heading" className="space-y-3">
      <h2 id="content-inventory-heading" className="text-sm font-semibold text-foreground">
        Content inventory
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <InventoryCard label="Posts" slice={inventory.posts} href="/admin/posts" />
        <InventoryCard label="Events" slice={inventory.events} href="/admin/events" />
        <InventoryCard label="Promotions" slice={inventory.promotions} href="/admin/promotions" />
      </div>
    </section>
  );
}
