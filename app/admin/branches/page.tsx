import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { getBranchAdminLabel, getBranchEnglishName, getBranchThaiName } from "@/lib/branches/branch-names";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function BranchesPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const branches = await prisma.branch.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Branches"
        description="Manage The Paseo locations and contact details"
        action={
          <Link
            href="/admin/branches/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add branch
          </Link>
        }
      />

      {branches.length === 0 ? (
        <EmptyState icon={MapPin} title="No branches yet" description="Create the first location." />
      ) : (
        <AdminTableShell minWidth="56rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ชื่อภาษาไทย</th>
                <th className="px-4 py-3 font-medium">ชื่อภาษาอังกฤษ</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{getBranchThaiName(branch)}</td>
                  <td className="px-4 py-3 text-muted">{getBranchEnglishName(branch)}</td>
                  <td className="px-4 py-3 text-muted">{branch.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{branch.slug}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(branch.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                      <Link
                        href={`/admin/branches/${branch.id}/directory`}
                        className="rounded-md px-2 py-1 text-sm text-paseo-dark hover:bg-background"
                      >
                        ชั้น/โซน/ที่ตั้ง
                      </Link>
                      <Link
                        href={`/admin/branches/${branch.id}/edit`}
                        className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                      >
                        Edit
                      </Link>
                      <DeleteResourceButton endpoint={`/api/branches/${branch.id}`} label={getBranchAdminLabel(branch)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}
    </div>
  );
}
