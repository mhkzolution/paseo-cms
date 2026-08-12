import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus, Tag } from "lucide-react";

import { ContentStatusBadge } from "@/components/admin/content-status-badge";
import { SeoScoreBadge } from "@/components/admin/seo-score-badge";
import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { formatDate } from "@/lib/format";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { formatPromotionCategory } from "@/lib/promotion-categories";
import { latestSeoAuditInclude } from "@/lib/seo-audit";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

export default async function PromotionsPage() {
  await requireModuleAccess("promotions");
  const localization = await getLocalizationSettings();

  const promotions = await prisma.promotion.findMany({
    where: { deletedAt: null },
    include: {
      author: true,
      seo: true,
      tags: { include: { tag: true } },
      branches: { include: { branch: true } },
      seoAudits: latestSeoAuditInclude,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Promotions"
        description="Manage campaign windows and promotional content"
        action={
          <Link
            href="/admin/promotions/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add promotion
          </Link>
        }
      />

      {promotions.length === 0 ? (
        <EmptyState icon={Tag} title="No promotions yet" description="Create the first promotion." />
      ) : (
        <AdminTableShell minWidth="56rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">SEO</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promotions.map((promotion) => {
                const audit = promotion.seoAudits[0];
                return (
                  <tr key={promotion.id}>
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-16 overflow-hidden rounded-md border border-border bg-background">
                        {promotion.featuredImage ? (
                          <Image
                            src={promotion.featuredImage}
                            alt={promotion.coverImageAlt || promotion.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{promotion.title}</td>
                    <td className="px-4 py-3 text-muted">{promotion.author?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      <div>{formatPromotionCategory(promotion.category)}</div>
                      <div className="text-xs">
                        {formatDate(promotion.startDate, localization)} – {formatDate(promotion.endDate, localization)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="max-w-56 truncate">
                        {promotion.branches.length
                          ? promotion.branches.map((item) => item.branch.name).join(", ")
                          : "All branches"}
                      </div>
                      <div className="text-xs">
                        {promotion.showOnHome ? "Home" : "Promotion only"}
                        {promotion.seo?.noindex ? " · Noindex" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SeoScoreBadge score={audit?.score} readability={audit?.readability} />
                    </td>
                    <td className="px-4 py-3">
                      <ContentStatusBadge status={promotion.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(promotion.updatedAt, localization)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                        <Link
                          href={`/admin/promotions/${promotion.id}/edit`}
                          className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                        >
                          Edit
                        </Link>
                        <DeleteResourceButton endpoint={`/api/promotions/${promotion.id}`} label={promotion.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </div>
  );
}
