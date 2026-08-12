import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import {
  BANNER_SCOPE_LABELS,
  formatBannerPlacements,
  getBannerScopeWhere,
  getBranchPlacementLabels,
  type BannerScope,
} from "@/lib/banners";
import { formatDate } from "@/lib/format";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

interface BannerListPageProps {
  scope: BannerScope;
  variant?: "page" | "embedded";
}

export async function BannerListPage({ scope, variant = "page" }: BannerListPageProps) {
  await requireModuleAccess("banners");
  const localization = await getLocalizationSettings();

  const [banners, branchLabels] = await Promise.all([
    prisma.banner.findMany({
      where: { deletedAt: null, ...getBannerScopeWhere(scope) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getBranchPlacementLabels(),
  ]);

  const scopeLabel = BANNER_SCOPE_LABELS[scope];
  const baseHref = `/admin/banners/${scope}`;
  const description =
    scope === "site"
      ? "จัดการ banner สไลด์สำหรับหน้าหลักและหน้าสาขา"
      : "จัดการ banner สไลด์สำหรับหน้า About Us (/about)";
  const addButton = (
    <Link
      href={`${baseHref}/new`}
      className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add banner
    </Link>
  );

  const tableContent =
    banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No banners yet" description="Add the first banner slide." />
      ) : (
        <AdminTableShell>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                {scope === "site" ? <th className="px-4 py-3 font-medium">Pages</th> : null}
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {banners.map((banner) => {
                const placements = formatBannerPlacements(banner, branchLabels);

                return (
                  <tr key={banner.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-24 shrink-0 overflow-hidden rounded border border-border bg-background">
                          {banner.image ? (
                            <Image
                              src={banner.image}
                              alt={banner.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <ImageIcon className="h-4 w-4" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{banner.title}</p>
                          {banner.subtitle ? <p className="text-xs text-muted">{banner.subtitle}</p> : null}
                        </div>
                      </div>
                    </td>
                    {scope === "site" ? (
                      <td className="px-4 py-3">
                        {placements.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {placements.map((placement) => (
                              <span
                                key={placement}
                                className="rounded-full bg-paseo-hover px-2 py-0.5 text-xs font-medium text-paseo-dark"
                              >
                                {placement}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-muted">{banner.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          banner.isActive
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted"
                        }
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(banner.updatedAt, localization)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                        <Link
                          href={`${baseHref}/${banner.id}/edit`}
                          className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                        >
                          Edit
                        </Link>
                        <DeleteResourceButton endpoint={`/api/banners/${banner.id}`} label={banner.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTableShell>
      );

  if (variant === "embedded") {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Banner</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          {addButton}
        </div>
        {tableContent}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={`Banner — ${scopeLabel}`} description={description} action={addButton} />
      {tableContent}
    </div>
  );
}
