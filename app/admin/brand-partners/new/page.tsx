import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandPartnerForm } from "@/features/brand-partners/brand-partner-form";
import { getBranchPlacementLabels } from "@/lib/banners";
import { requireRole } from "@/lib/rbac";

const EMPTY_BRAND_PARTNER = {
  name: "",
  logo: "",
  linkUrl: "",
  showOnHome: false,
  showOnBranch1: false,
  showOnBranch2: false,
  showOnBranch3: false,
  sortOrder: 0,
  isActive: true,
} as const;

export default async function NewBrandPartnerPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"]);
  const branchLabels = await getBranchPlacementLabels();

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
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add brand partner</h1>
      </div>

      <BrandPartnerForm
        mode="create"
        endpoint="/api/brand-partners"
        returnHref="/admin/brand-partners"
        submitLabel="Create brand"
        defaultValues={EMPTY_BRAND_PARTNER}
        branchLabels={branchLabels}
      />
    </div>
  );
}
