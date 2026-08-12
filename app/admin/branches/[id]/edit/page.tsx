import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BranchEditorForm } from "@/features/branches/branch-editor-form";
import { getBranchEnglishName, getBranchThaiName } from "@/lib/branches/branch-names";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

interface EditBranchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  await requireModuleAccess("branches");

  const { id } = await params;
  const branch = await prisma.branch.findFirst({ where: { id, deletedAt: null } });
  if (!branch) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/branches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to branches
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit branch</h1>
      </div>

      <BranchEditorForm
        mode="edit"
        endpoint={`/api/branches/${branch.id}`}
        returnHref="/admin/branches"
        submitLabel="Save changes"
        defaultValues={{
          nameTh: getBranchThaiName(branch),
          nameEn: getBranchEnglishName(branch),
          slug: branch.slug,
          image: branch.image ?? "",
          thumbnail: branch.thumbnail ?? "",
          shortDescription: branch.shortDescription ?? "",
          address: branch.address ?? "",
          phone: branch.phone ?? "",
          leasingPhone1: branch.leasingPhone1 ?? "",
          leasingPhone2: branch.leasingPhone2 ?? "",
          mapsUrl: branch.mapsUrl ?? "",
          latitude: branch.latitude ?? "",
          longitude: branch.longitude ?? "",
        }}
      />
    </div>
  );
}
