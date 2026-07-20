import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StoreEditorForm } from "@/features/stores/store-editor-form";
import { getBranchAdminLabel } from "@/lib/branches/branch-names";
import { createDefaultOperatingHours } from "@/lib/stores/operating-hours";
import {
  getStoreFloorsByBranchIds,
  getStoreLocationsByZoneIds,
  getStoreZonesByFloorIds,
} from "@/lib/store-zones/queries";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function NewStorePage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const [branches, categories] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  const branchIds = branches.map((branch) => branch.id);
  const floorsByBranch = await getStoreFloorsByBranchIds(branchIds);
  const floorIds = Object.values(floorsByBranch).flatMap((floors) => floors.map((floor) => floor.id));
  const zonesByFloor = await getStoreZonesByFloorIds(floorIds);
  const zoneIds = Object.values(zonesByFloor).flatMap((zones) => zones.map((zone) => zone.id));
  const locationsByZone = await getStoreLocationsByZoneIds(zoneIds);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/stores" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          กลับไปหน้าร้านค้า
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">เพิ่มร้านค้า</h1>
      </div>

      <StoreEditorForm
        mode="create"
        endpoint="/api/stores"
        returnHref="/admin/stores"
        submitLabel="สร้างร้านค้า"
        branches={branches.map((branch) => ({ id: branch.id, label: getBranchAdminLabel(branch) }))}
        categories={categories.map((category) => ({ id: category.id, label: category.name }))}
        floorsByBranch={floorsByBranch}
        zonesByFloor={zonesByFloor}
        locationsByZone={locationsByZone}
        defaultValues={{
          branchId: branches[0]?.id ?? "",
          categoryId: "",
          nameTh: "",
          nameEn: "",
          slug: "",
          logo: "",
          cover: "",
          description: "",
          phone1: "",
          phone2: "",
          zoneId: "",
          locationId: "",
          storeType: "",
          operatingHours: createDefaultOperatingHours(),
        }}
      />
    </div>
  );
}
