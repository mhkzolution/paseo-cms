import { unstable_cache } from "next/cache";

import { buildWorkspaceSnapshot } from "@/lib/seo-workspace/build-workspace-snapshot";
import {
  SEO_WORKSPACE_CACHE_TAG,
  SEO_WORKSPACE_REVALIDATE_SECONDS,
  type SeoWorkspaceSnapshot,
} from "@/lib/seo-workspace/types";

const getCachedWorkspaceSnapshot = unstable_cache(
  async () => buildWorkspaceSnapshot(),
  ["seo-workspace-snapshot"],
  {
    revalidate: SEO_WORKSPACE_REVALIDATE_SECONDS,
    tags: [SEO_WORKSPACE_CACHE_TAG],
  },
);

export async function getWorkspaceSnapshot(): Promise<SeoWorkspaceSnapshot> {
  return getCachedWorkspaceSnapshot();
}

export async function getPublishedContentCount(): Promise<number> {
  const snapshot = await getWorkspaceSnapshot();
  return snapshot.health.totalPublished;
}
