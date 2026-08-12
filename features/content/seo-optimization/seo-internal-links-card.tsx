"use client";

import type { InternalLinkSuggestion } from "@/lib/seo-assistant";
import { cn } from "@/lib/utils";

import { SeoCopyButton } from "./seo-copy-button";

export const INTERNAL_LINKS_EMPTY_MESSAGE = "ยังไม่มีคำแนะนำลิงก์ในขณะนี้";

export type SeoInternalLinksCardProps = {
  items: InternalLinkSuggestion[];
  stale?: boolean;
  className?: string;
};

export function partitionInternalLinkSuggestions(items: InternalLinkSuggestion[]) {
  const dbItems: InternalLinkSuggestion[] = [];
  const hubItems: InternalLinkSuggestion[] = [];

  for (const item of items) {
    if (item.source === "hub") {
      hubItems.push(item);
    } else {
      dbItems.push(item);
    }
  }

  return { dbItems, hubItems };
}

function InternalLinkRow({
  item,
  variant,
}: {
  item: InternalLinkSuggestion;
  variant: "db" | "hub";
}) {
  return (
    <li
      data-testid={`seo-internal-link-${item.source}-${item.href}`}
      className={cn(
        "grid gap-2 rounded-md border p-3",
        variant === "hub" ? "border-dashed border-border" : "border-border",
      )}
    >
      <p className="text-sm font-medium text-foreground">{item.title}</p>
      <p className="text-xs text-muted" data-testid="seo-internal-link-reason">
        {item.reason}
      </p>
      <SeoCopyButton text={item.href} label="Copy URL" />
    </li>
  );
}

export function SeoInternalLinksCard({ items, stale = false, className }: SeoInternalLinksCardProps) {
  const { dbItems, hubItems } = partitionInternalLinkSuggestions(items);

  return (
    <section
      aria-label="Internal Links"
      data-block="internal-links"
      data-testid="seo-internal-links-card"
      className={cn("grid gap-3 rounded-md border border-border bg-surface p-4", className)}
    >
      <h2 className="text-sm font-semibold text-foreground">Internal Links</h2>

      {stale ? (
        <p className="text-xs text-muted" data-testid="seo-internal-links-stale-notice">
          บันทึกแบบร่างเพื่ออัปเดตคำแนะนำลิงก์
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted" data-testid="seo-internal-links-empty">
          {INTERNAL_LINKS_EMPTY_MESSAGE}
        </p>
      ) : (
        <div className="grid gap-3">
          {dbItems.length > 0 ? (
            <div className="grid gap-2" data-testid="seo-internal-links-suggested">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested Links</h3>
              <ul className="grid gap-2">
                {dbItems.map((item) => (
                  <InternalLinkRow key={`${item.source}-${item.href}`} item={item} variant="db" />
                ))}
              </ul>
            </div>
          ) : null}

          {hubItems.length > 0 ? (
            <div className="grid gap-2" data-testid="seo-internal-links-hub">
              {dbItems.length > 0 ? (
                <hr className="border-border" data-testid="seo-internal-links-divider" />
              ) : null}
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Explore More</h3>
              <ul className="grid gap-2">
                {hubItems.map((item) => (
                  <InternalLinkRow key={`${item.source}-${item.href}`} item={item} variant="hub" />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
