import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BranchEditorForm } from "@/features/branches/branch-editor-form";
import { requireModuleAccess } from "@/lib/rbac";

export default async function NewBranchPage() {
  await requireModuleAccess("branches");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/branches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to branches
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Add branch</h1>
      </div>

      <BranchEditorForm
        mode="create"
        endpoint="/api/branches"
        returnHref="/admin/branches"
        submitLabel="Create branch"
        defaultValues={{
          nameTh: "",
          nameEn: "",
          slug: "",
          image: "",
          thumbnail: "",
          shortDescription: "",
          address: "",
          phone: "",
          leasingPhone1: "",
          leasingPhone2: "",
          mapsUrl: "",
          latitude: "",
          longitude: "",
        }}
      />
    </div>
  );
}
