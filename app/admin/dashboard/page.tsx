import { auth } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/dashboard/get-dashboard-snapshot";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { ActivitySection } from "@/features/dashboard/activity-section";
import { ContentHealthCard } from "@/features/dashboard/content-health-card";
import { ContentInventorySection } from "@/features/dashboard/content-inventory-section";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { PlatformPulseSection } from "@/features/dashboard/platform-pulse-section";
import { RecentActivityTimeline } from "@/features/dashboard/recent-activity-timeline";
import { RecentlyPublishedPanel } from "@/features/dashboard/recently-published-panel";
import { SeoOverviewCard } from "@/features/dashboard/seo-overview-card";

export default async function DashboardPage() {
  const session = await auth();
  const [snapshot, localization] = await Promise.all([getDashboardSnapshot(), getLocalizationSettings()]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 font-sans">
      <DashboardHeader userName={session?.user?.name} />

      <main className="flex flex-col gap-8">
        <PlatformPulseSection pulse={snapshot.pulse} />
        <ActivitySection {...snapshot.activity} />

        <div className="grid gap-6 lg:grid-cols-2">
          <SeoOverviewCard overview={snapshot.seoOverview} />
          <ContentHealthCard items={snapshot.contentHealth} />
        </div>

        <ContentInventorySection inventory={snapshot.inventory} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivityTimeline events={snapshot.recentActivity} localization={localization} />
          <RecentlyPublishedPanel {...snapshot.recentlyPublished} localization={localization} />
        </div>
      </main>
    </div>
  );
}
