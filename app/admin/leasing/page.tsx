import { Building2 } from "lucide-react";

import { AdminPageHeader, AdminTableShell } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteResourceButton } from "@/features/content/delete-resource-button";
import { LeasingStatusSelect } from "@/features/leasing/leasing-status-select";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function LeasingAdminPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const submissions = await prisma.leasingSubmission.findMany({
    where: { deletedAt: null },
    include: {
      branch: {
        select: { name: true, nameTh: true, nameEn: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="พื้นที่เช่า"
        description="ตรวจสอบแบบฟอร์มสนใจเช่าพื้นที่จากหน้าเว็บไซต์และจัดการสถานะติดตาม"
      />

      {submissions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="ยังไม่มีใบสมัคร"
          description="แบบฟอร์มสนใจเช่าพื้นที่จากหน้าเว็บจะแสดงที่นี่"
        />
      ) : (
        <AdminTableShell minWidth="48rem">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">รายละเอียด</th>
                <th className="px-4 py-3 font-medium">ผู้ติดต่อ</th>
                <th className="px-4 py-3 font-medium">สาขา</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">วันที่ส่ง</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((submission) => (
                <tr key={submission.id} className="align-top">
                  <td className="max-w-md px-4 py-3">
                    <p className="font-medium text-foreground">{submission.productCategory}</p>
                    <p className="mt-1 line-clamp-3 text-muted">{submission.productDetails}</p>
                    {submission.details ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted">หมายเหตุ: {submission.details}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <p className="text-foreground">{submission.name}</p>
                    <a href={`mailto:${submission.email}`} className="hover:text-accent">
                      {submission.email}
                    </a>
                    <p>{submission.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{getBranchThaiName(submission.branch)}</td>
                  <td className="px-4 py-3">
                    <LeasingStatusSelect id={submission.id} status={submission.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(submission.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteResourceButton endpoint={`/api/leasing/${submission.id}`} label={submission.name} />
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
