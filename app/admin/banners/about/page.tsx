import { redirect } from "next/navigation";

import { requireModuleAccess } from "@/lib/rbac";

export default async function AboutBannersPage() {
  await requireModuleAccess("banners");
  redirect("/admin/introduction");
}
