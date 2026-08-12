"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminTableShell } from "@/components/admin/admin-table";
import { SeoScoreBadge } from "@/components/admin/seo-score-badge";
import { formatDate } from "@/lib/format";
import type { LocalizationSettings } from "@/lib/localization-settings";
import type { RecentlyPublishedItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type RecentlyPublishedPanelProps = {
  posts: RecentlyPublishedItem[];
  events: RecentlyPublishedItem[];
  promotions: RecentlyPublishedItem[];
  localization: LocalizationSettings;
};

type TabId = "posts" | "events" | "promotions";

const TABS: Array<{ id: TabId; label: string; href: string }> = [
  { id: "posts", label: "Posts", href: "/admin/posts" },
  { id: "events", label: "Events", href: "/admin/events" },
  { id: "promotions", label: "Promotions", href: "/admin/promotions" },
];

export function RecentlyPublishedPanel({ posts, events, promotions, localization }: RecentlyPublishedPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("posts");

  const itemsByTab = { posts, events, promotions };
  const items = itemsByTab[activeTab];
  const listHref = TABS.find((tab) => tab.id === activeTab)?.href ?? "/admin/posts";

  return (
    <section aria-labelledby="recently-published-heading" className="space-y-3">
      <h2 id="recently-published-heading" className="text-sm font-semibold text-foreground">
        Recently published
      </h2>

      <div className="rounded-md border border-border bg-surface">
        <div className="flex gap-1 border-b border-border p-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-paseo text-foreground"
                  : "text-muted hover:bg-background hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">No published {activeTab} yet.</p>
        ) : (
          <>
            <div className="hidden md:block">
              <AdminTableShell minWidth="28rem">
                <table className="w-full text-left text-sm" aria-label={`Recently published ${activeTab}`}>
                  <thead className="border-b border-border bg-background text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">SEO Score</th>
                      <th className="px-4 py-3 font-medium">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="max-w-xs truncate px-4 py-3 font-medium text-foreground">
                          <Link href={item.editHref} className="hover:underline">
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <SeoScoreBadge score={item.seoScore} />
                        </td>
                        <td className="px-4 py-3 text-muted">{formatDate(item.publishedAt, localization)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableShell>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <Link href={item.editHref} className="font-medium text-foreground hover:underline">
                    {item.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <SeoScoreBadge score={item.seoScore} />
                    <span>{formatDate(item.publishedAt, localization)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="border-t border-border px-4 py-3">
          <Link href={listHref} className="text-sm font-medium text-paseo-dark hover:underline">
            View all {activeTab} →
          </Link>
        </div>
      </div>
    </section>
  );
}
