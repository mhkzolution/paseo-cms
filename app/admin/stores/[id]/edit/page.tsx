import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StoreEditorForm } from "@/features/stores/store-editor-form";
import { getBranchAdminLabel } from "@/lib/branches/branch-names";
import { parseOperatingHours } from "@/lib/stores/operating-hours";
import { getStoreEnglishName, getStoreThaiName } from "@/lib/stores/store-names";
import {
  getStoreFloorsByBranchIds,
  getStoreLocationsByZoneIds,
  getStoreZonesByFloorIds,
} from "@/lib/store-zones/queries";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess } from "@/lib/rbac";

interface EditStorePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStorePage({ params }: EditStorePageProps) {
  await requireModuleAccess("stores");

  const { id } = await params;
  const [store, branches, categories] = await Promise.all([
    prisma.store.findFirst({
      where: { id, deletedAt: null },
      include: {
        storeZone: { select: { floorId: true } },
      },
    }),
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { deletedAt: null, scope: "STORE" }, orderBy: { name: "asc" } }),
  ]);

  if (!store) notFound();

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
        <h1 className="mt-2 text-2xl font-semibold text-foreground">แก้ไขร้านค้า</h1>
      </div>

      <StoreEditorForm
        mode="edit"
        endpoint={`/api/stores/${store.id}`}
        returnHref="/admin/stores"
        submitLabel="บันทึกการเปลี่ยนแปลง"
        defaultFloorId={store.storeZone?.floorId ?? ""}
        branches={branches.map((branch) => ({ id: branch.id, label: getBranchAdminLabel(branch) }))}
        categories={categories.map((category) => ({ id: category.id, label: category.name }))}
        floorsByBranch={floorsByBranch}
        zonesByFloor={zonesByFloor}
        locationsByZone={locationsByZone}
        defaultValues={{
          branchId: store.branchId,
          categoryId: store.categoryId ?? "",
          nameTh: getStoreThaiName(store),
          nameEn: getStoreEnglishName(store),
          slug: store.slug,
          logo: store.logo ?? "",
          cover: store.cover ?? "",
          description: store.description ?? "",
          phone1: store.phone1 ?? "",
          phone2: store.phone2 ?? "",
          zoneId: store.zoneId ?? "",
          locationId: store.locationId ?? "",
          storeType: store.storeType ?? "",
          operatingHours: parseOperatingHours(store.operatingHours),
        }}
      />
    </div>
  );
}
