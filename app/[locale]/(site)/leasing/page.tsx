import type { Metadata } from "next";

import { LeasingPageContent } from "@/features/leasing/leasing-page-content";
import { getAllBranches } from "@/lib/branches/get-all-branches";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return {
    title: "พื้นที่เช่า",
    description: `สนใจเช่าพื้นที่ใน ${settings.siteName} กรอกแบบฟอร์มเพื่อให้ทีมงานติดต่อกลับ`,
  };
}

export default async function LeasingPage() {
  const [branches, recaptchaSiteKey] = await Promise.all([getAllBranches(), getRecaptchaSiteKey()]);

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-foreground">
      <LeasingPageContent branches={branches} recaptchaSiteKey={recaptchaSiteKey} />
    </main>
  );
}
