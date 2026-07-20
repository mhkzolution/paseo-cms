import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BranchDirectoryManager } from "@/features/branches/branch-directory-manager";
import { getBranchAdminLabel } from "@/lib/branches/branch-names";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface BranchDirectoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function BranchDirectoryPage({ params }: BranchDirectoryPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const { id } = await params;
  const branch = await prisma.branch.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, nameTh: true, nameEn: true },
  });

  if (!branch) notFound();

  const floors = await prisma.storeFloor.findMany({
    where: { branchId: id, deletedAt: null },
    include: {
      zones: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          locations: {
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              _count: {
                select: {
                  stores: { where: { deletedAt: null } },
                },
              },
            },
          },
          _count: {
            select: {
              stores: { where: { deletedAt: null } },
            },
          },
        },
      },
      _count: {
        select: {
          zones: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/branches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          กลับไปหน้าสาขา
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">จัดการชั้น โซน และที่ตั้งร้านค้า</h1>
        <p className="mt-1 text-sm text-muted">{getBranchAdminLabel(branch)}</p>
      </div>

      <BranchDirectoryManager branchId={branch.id} branchLabel={getBranchAdminLabel(branch)} initialFloors={floors} />
    </div>
  );
}
