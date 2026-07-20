import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus, Store as StoreIcon } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { getBranchAdminLabel } from "@/lib/branches/branch-names";
import { getStoreFloorLabel, getStoreLocationLabel, getStoreZoneLabel } from "@/lib/store-zones/names";
import { getStoreAdminLabel } from "@/lib/stores/store-names";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function StoresPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const stores = await prisma.store.findMany({
    where: { deletedAt: null },
    include: {
      branch: true,
      category: true,
      storeZone: {
        include: {
          floor: true,
        },
      },
      storeLocation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="ร้านค้า"
        description="จัดการข้อมูลร้านค้า สาขา และหมวดหมู่"
        action={
          <Link
            href="/admin/stores/new"
            className="inline-flex items-center gap-2 rounded-md bg-paseo px-3 py-2 text-sm font-medium text-foreground hover:bg-paseo-dark hover:text-white sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            เพิ่มร้านค้า
          </Link>
        }
      />

      {stores.length === 0 ? (
        <EmptyState icon={StoreIcon} title="ยังไม่มีร้านค้า" description="เพิ่มร้านค้าแรกของคุณ" />
      ) : (
        <AdminTableShell minWidth="56rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">โลโก้</th>
                <th className="px-4 py-3 font-medium">ชื่อร้าน</th>
                <th className="px-4 py-3 font-medium">สาขา</th>
                <th className="px-4 py-3 font-medium">ชั้น</th>
                <th className="px-4 py-3 font-medium">โซน</th>
                <th className="px-4 py-3 font-medium">เลขที่ห้อง</th>
                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border bg-background">
                      {store.logo ? (
                        <Image src={store.logo} alt={getStoreAdminLabel(store)} fill className="object-contain p-1" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <ImageIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{getStoreAdminLabel(store)}</td>
                  <td className="px-4 py-3 text-muted">{getBranchAdminLabel(store.branch)}</td>
                  <td className="px-4 py-3 text-muted">
                    {store.storeZone?.floor ? getStoreFloorLabel(store.storeZone.floor) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {store.storeZone ? getStoreZoneLabel(store.storeZone) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {store.storeLocation ? getStoreLocationLabel(store.storeLocation) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{store.category?.name ?? "ไม่ระบุหมวดหมู่"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
                      <Link
                        href={`/admin/stores/${store.id}/edit`}
                        className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-background"
                      >
                        Edit
                      </Link>
                      <DeleteResourceButton endpoint={`/api/stores/${store.id}`} label={getStoreAdminLabel(store)} />
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
