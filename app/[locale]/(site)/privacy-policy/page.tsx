import type { Metadata } from "next";

import { PrivacyPolicyContent } from "@/features/legal/privacy-policy-content";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return {
    title: "นโยบายความเป็นส่วนตัว",
    description: `นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของ ${settings.siteName}`,
  };
}

export default async function PrivacyPolicyPage() {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-foreground">
      <PrivacyPolicyContent siteName={settings.siteName} contactEmail={settings.contactEmail} />
    </main>
  );
}
