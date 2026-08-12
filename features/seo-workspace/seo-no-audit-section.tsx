import type { SeoWorkspaceSnapshot } from "@/lib/seo-workspace/types";

type SeoNoAuditSectionProps = {
  noAudit: SeoWorkspaceSnapshot["noAudit"];
};

export function SeoNoAuditSection({ noAudit }: SeoNoAuditSectionProps) {
  const total = noAudit.posts + noAudit.events + noAudit.promotions;

  if (total === 0) {
    return (
      <section aria-labelledby="seo-no-audit-heading" className="space-y-3">
        <h2 id="seo-no-audit-heading" className="text-sm font-semibold text-foreground">
          No SEO audit yet
        </h2>
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          All published content has been audited.
        </p>
      </section>
    );
  }

  const cards = [
    { label: "Posts", count: noAudit.posts, types: "post" },
    { label: "Events", count: noAudit.events, types: "event" },
    { label: "Promotions", count: noAudit.promotions, types: "promotion" },
  ] as const;

  return (
    <section aria-labelledby="seo-no-audit-heading" className="space-y-3">
      <h2 id="seo-no-audit-heading" className="text-sm font-semibold text-foreground">
        No SEO audit yet ({total.toLocaleString()})
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {card.count.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted">Published without audit</p>
          </div>
        ))}
      </div>
    </section>
  );
}
