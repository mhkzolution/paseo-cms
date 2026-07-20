import type { Metadata } from "next";

import { TermsContent } from "@/features/legal/terms-content";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return {
    title: "ข้อกำหนดการใช้งาน",
    description: `ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์ ${settings.siteName}`,
  };
}

export default async function TermsPage() {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-foreground">
      <TermsContent
        siteName={settings.siteName}
        contactEmail={settings.contactEmail}
        siteUrl={settings.siteUrl}
      />
    </main>
  );
}
