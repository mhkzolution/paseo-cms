import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BrandPartnerForm } from "@/features/brand-partners/brand-partner-form";
import { getBranchPlacementLabels } from "@/lib/banners";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

interface EditBrandPartnerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBrandPartnerPage({ params }: EditBrandPartnerPageProps) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);

  const { id } = await params;
  const [item, branchLabels] = await Promise.all([
    prisma.brandPartner.findFirst({ where: { id, deletedAt: null } }),
    getBranchPlacementLabels(),
  ]);

  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/brand-partners"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to brand partners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit brand partner</h1>
      </div>

      <BrandPartnerForm
        mode="edit"
        endpoint={`/api/brand-partners/${item.id}`}
        returnHref="/admin/brand-partners"
        submitLabel="Save changes"
        branchLabels={branchLabels}
        defaultValues={{
          name: item.name,
          logo: item.logo,
          linkUrl: item.linkUrl ?? "",
          showOnHome: item.showOnHome,
          showOnBranch1: item.showOnBranch1,
          showOnBranch2: item.showOnBranch2,
          showOnBranch3: item.showOnBranch3,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        }}
      />
    </div>
  );
}
