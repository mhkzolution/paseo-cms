import { BookOpen } from "lucide-react";

import { BannerListPage } from "@/features/banners/banner-list-page";
import { IntroductionForm } from "@/features/introduction/introduction-form";
import {
  DEFAULT_INTRODUCTION_SETTINGS,
  getSettings,
  INTRODUCTION_SETTINGS_KEYS,
} from "@/lib/settings";
import { requireModuleAccess } from "@/lib/rbac";

export default async function IntroductionPage() {
  await requireModuleAccess("about-the-paseo");

  const settings = await getSettings(INTRODUCTION_SETTINGS_KEYS, DEFAULT_INTRODUCTION_SETTINGS);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="flex items-center gap-2 text-muted">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Content</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Introduction</h1>
        <p className="text-sm text-muted">
          จัดการเนื้อหาหน้า About us (/about) — banner, โลโก้, รายละเอียด, พันธกิจ และวิสัยทัศน์
        </p>
      </div>

      <BannerListPage scope="about" variant="embedded" />

      <IntroductionForm defaultValues={settings} />
    </div>
  );
}
