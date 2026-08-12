import { buildWorkspaceSnapshot } from "@/lib/seo-workspace/build-workspace-snapshot";
import { buildActivitySeries } from "@/lib/dashboard/build-activity-series";
import { buildContentHealth } from "@/lib/dashboard/build-content-health";
import { buildContentInventory } from "@/lib/dashboard/build-content-inventory";
import { buildPlatformPulse } from "@/lib/dashboard/build-platform-pulse";
import { buildRecentActivity } from "@/lib/dashboard/build-recent-activity";
import { buildRecentlyPublished } from "@/lib/dashboard/build-recently-published";
import { buildSeoOverview } from "@/lib/dashboard/build-seo-overview";
import { DASHBOARD_SNAPSHOT_VERSION, type DashboardSnapshot } from "@/lib/dashboard/types";

export async function buildDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [workspace, inventory, activity, recentActivity, recentlyPublished] = await Promise.all([
    buildWorkspaceSnapshot(),
    buildContentInventory(),
    buildActivitySeries(),
    buildRecentActivity(),
    buildRecentlyPublished(),
  ]);

  return {
    version: DASHBOARD_SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    pulse: buildPlatformPulse(inventory, workspace.health),
    activity,
    seoOverview: buildSeoOverview(workspace.health),
    contentHealth: buildContentHealth(workspace.quickWins),
    inventory,
    recentActivity,
    recentlyPublished,
  };
}
