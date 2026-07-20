import Link from "next/link";
import Image from "next/image";
import { Handshake, Plus } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { getBranchPlacementLabels } from "@/lib/banners";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function BrandPartnersPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const [brandPartners, branchLabels] = await Promise.all([
    prisma.brandPartner.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getBranchPlacementLabels(),
  ]);

  const placementLabels = {
    home: "หน้าหลัก",
    branch1: branchLabels.branch1,
    branch2: branchLabels.branch2,
    branch3: branchLabels.branch3,
  };

  const formatPlacements = (partner: (typeof brandPartners)[number]) => {
    const items: string[] = [];
    if (partner.showOnHome) items.push(placementLabels.home);
    if (partner.showOnBranch1) items.push(placementLabels.branch1);
    if (partner.showOnBranch2) items.push(placementLabels.branch2);
    if (partner.showOnBranch3) items.push(placementLabels.branch3);
    return items;
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Brand Partners"
        description="จัดการโลโก้แบรนด์สำหรับ Brand Loyalty section"
        action={
          <Link
            href="/admin/brand-partners/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add brand
          </Link>
        }
      />

      {brandPartners.length === 0 ? (
        <EmptyState icon={Handshake} title="No brand partners yet" description="Add the first brand logo." />
      ) : (
        <AdminTableShell>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Pages</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {brandPartners.map((partner) => {
                const placements = formatPlacements(partner);

                return (
                  <tr key={partner.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-16 overflow-hidden rounded border border-border bg-background">
                          <Image
                            src={partner.logo}
                            alt={partner.name}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        </div>
                        <p className="font-medium text-foreground">{partner.name}</p>
                      </div>
                    </td>
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
                    <td className="px-4 py-3 text-muted">{partner.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          partner.isActive
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted"
                        }
                      >
                        {partner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(partner.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                        <Link
                          href={`/admin/brand-partners/${partner.id}/edit`}
                          className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                        >
                          Edit
                        </Link>
                        <DeleteResourceButton endpoint={`/api/brand-partners/${partner.id}`} label={partner.name} />
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
