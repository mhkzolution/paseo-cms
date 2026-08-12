import { redirect } from "next/navigation";

import { requireModuleAccess } from "@/lib/rbac";

export default async function BannersIndexPage() {
  await requireModuleAccess("banners");
  redirect("/admin/banners/site");
}
