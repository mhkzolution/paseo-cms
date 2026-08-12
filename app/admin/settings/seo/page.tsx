import Link from "next/link";
import { Globe2 } from "lucide-react";

import { SeoForm } from "@/features/settings/seo-form";
import { requireModuleAccess } from "@/lib/rbac";
import { getSeoSettings } from "@/lib/settings";

export default async function SeoSettingsPage() {
  await requireModuleAccess("seo-settings");

  const seo = await getSeoSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <Globe2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">SEO</h1>
        <p className="text-sm text-muted">
          จัดการ metadata กลาง, การยืนยันตัวตนกับ search engine, Organization schema และค่าเริ่มต้นของการทำ index
        </p>
        <Link
          href="/admin/seo/workspace"
          className="mt-2 inline-block text-sm font-medium text-paseo-dark hover:underline"
        >
          Open SEO Workspace
        </Link>
      </div>

      <SeoForm defaultValues={seo} />
    </div>
  );
}
