import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  ArchiveBranchTiles,
  ArchiveFilterSection,
  type ArchiveTileItem,
} from "@/features/archive/archive-tile-filters";
import { HomeEventsSection } from "@/features/home/home-events-section";
import { ARCHIVE_EVENT_LIMIT, buildEventsHref, getBranchBySlug, getHomeStyleEvents } from "@/lib/events";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import { getHomeBranches } from "@/lib/home-page";

export const revalidate = 300;

interface EventsPageProps {
  searchParams: Promise<{ branch?: string }>;
}

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const { branch: branchSlug } = await searchParams;
  const branch = branchSlug ? await getBranchBySlug(branchSlug) : null;

  return {
    title: branch ? `กิจกรรม ${branch.name}` : "กิจกรรม The Paseo",
    description: branch
      ? `กิจกรรมและอีเวนต์ที่กำลังจัดและใกล้ถึงที่ ${branch.name}`
      : "กิจกรรมและอีเวนต์ที่กำลังจัดและใกล้ถึงจากทุกสาขา The Paseo",
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { branch: branchSlug } = await searchParams;
  const branch = branchSlug ? await getBranchBySlug(branchSlug) : null;

  const [branches, events, t] = await Promise.all([
    getHomeBranches(),
    getHomeStyleEvents({ branchId: branch?.id, limit: ARCHIVE_EVENT_LIMIT }),
    getTranslations("events"),
  ]);

  const branchLabel = branch ? getBranchThaiName(branch) : null;

  const branchItems: ArchiveTileItem[] = branches.map((item) => ({
    slug: item.slug,
    label: item.nameTh,
    image: item.image,
    href: buildEventsHref({ branch: item.slug }),
  }));

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <section className="mx-auto w-full max-w-7xl px-5 pt-12 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">{t("title")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {branchLabel ? `กิจกรรมที่ ${branchLabel}` : "กิจกรรม The Paseo"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            อีเวนต์ที่กำลังจัดและใกล้ถึงจากทุกสาขา เลือกดูตามสาขาที่สนใจได้
          </p>
        </div>

        <ArchiveFilterSection title="สาขา" className="mt-8">
          <ArchiveBranchTiles
            items={branchItems}
            activeSlug={branch?.slug}
            allOption={{
              href: "/events",
              label: "ทุกสาขา",
              active: !branch,
            }}
          />
        </ArchiveFilterSection>
      </section>

      <HomeEventsSection
        events={events}
        showViewAll={false}
        showHeading={false}
        variant="compact"
        className="pt-6"
      />
    </main>
  );
}
