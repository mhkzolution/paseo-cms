import { unstable_cache } from "next/cache";

import { buildDashboardSnapshot } from "@/lib/dashboard/build-dashboard-snapshot";
import {
  DASHBOARD_CACHE_TAG,
  DASHBOARD_REVALIDATE_SECONDS,
  type DashboardSnapshot,
} from "@/lib/dashboard/types";

const getCachedDashboardSnapshot = unstable_cache(
  async () => buildDashboardSnapshot(),
  ["dashboard-snapshot"],
  {
    revalidate: DASHBOARD_REVALIDATE_SECONDS,
    tags: [DASHBOARD_CACHE_TAG],
  },
);

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return getCachedDashboardSnapshot();
}
