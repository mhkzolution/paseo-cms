import type { WorkspaceContentType } from "@/lib/seo-workspace/types";

export const DASHBOARD_SNAPSHOT_VERSION = "dashboard-v1" as const;
export const DASHBOARD_CACHE_TAG = "dashboard-snapshot";
export const DASHBOARD_REVALIDATE_SECONDS = 900;

export type DailyCount = {
  date: string;
  count: number;
};

export type ActivitySeries = {
  daily: DailyCount[];
  periodTotal: number;
};

export type PlatformPulse = {
  posts: number;
  events: number;
  promotions: number;
  publishedPercent: number;
  publishedCount: number;
  totalCount: number;
  auditCoveragePercent: number;
  auditedPublishedCount: number;
  averageSeoScore: number;
};

export type DashboardSeoOverview = {
  averageScore: number;
  coveragePercent: number;
  excellentPercent: number;
  needsAttentionPercent: number;
  needsAttentionCount: number;
  excellentCount: number;
  auditedCount: number;
};

export type ContentHealthItem = {
  checkId: string;
  label: string;
  count: number;
};

export type ContentInventorySlice = {
  total: number;
  published: number;
  draft: number;
};

export type ContentInventory = {
  posts: ContentInventorySlice;
  events: ContentInventorySlice;
  promotions: ContentInventorySlice;
};

export type RecentActivityEventType = "published" | "unpublished" | "created" | "deleted";

export type RecentActivityEvent = {
  id: string;
  contentType: WorkspaceContentType;
  eventType: RecentActivityEventType;
  title: string;
  occurredAt: string;
  href: string;
};

export type RecentlyPublishedItem = {
  id: string;
  title: string;
  seoScore: number | null;
  publishedAt: string;
  editHref: string;
};

export type DashboardSnapshot = {
  version: typeof DASHBOARD_SNAPSHOT_VERSION;
  generatedAt: string;
  pulse: PlatformPulse;
  activity: {
    published: ActivitySeries;
    created: ActivitySeries;
    updated: ActivitySeries;
  };
  seoOverview: DashboardSeoOverview;
  contentHealth: ContentHealthItem[];
  inventory: ContentInventory;
  recentActivity: RecentActivityEvent[];
  recentlyPublished: {
    posts: RecentlyPublishedItem[];
    events: RecentlyPublishedItem[];
    promotions: RecentlyPublishedItem[];
  };
};
