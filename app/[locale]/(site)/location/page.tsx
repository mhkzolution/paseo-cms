import type { Metadata } from "next";

import { LocationPageContent } from "@/features/location/location-page-content";
import { getAllBranches } from "@/lib/branches/get-all-branches";
import { DEFAULT_SETTINGS, getSettings, SETTINGS_KEYS } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);

  return {
    title: "ที่ตั้ง",
    description: `ดูที่อยู่ เบอร์ติดต่อ และแผนที่ของสาขา ${settings.siteName}`,
  };
}

export default async function LocationPage() {
  const branches = await getAllBranches();

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-foreground">
      <LocationPageContent branches={branches} />
    </main>
  );
}
