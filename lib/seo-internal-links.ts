/**
 * A4 internal link suggestions — server-side DB query + rule-based ranking.
 *
 * Called from page server components only — not from client hooks or API routes (v1).
 */

import type { PostKind, PromotionCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const SUGGESTION_TARGET = 5;
export const SUGGESTION_MIN = 3;
export const SUGGESTION_MAX = 8;

export const AUDIT_BONUS = 20;
export const HIGH_QUALITY_BONUS = 10;
export const AUDIT_QUALITY_THRESHOLD = 70;
export const HIGH_QUALITY_THRESHOLD = 80;

export const CONTENT_TYPE_COMPATIBILITY: Record<
  "post" | "event" | "promotion",
  Record<"post" | "event" | "promotion", number>
> = {
  post: { post: 0, event: -10, promotion: -20 },
  event: { post: -10, event: 0, promotion: -20 },
  promotion: { post: -10, event: -40, promotion: 0 },
};

export type InternalLinkContentType = "post" | "event" | "promotion";

export type InternalLinkQueryContext = {
  contentType: InternalLinkContentType;
  contentId: string;
  categoryId?: string | null;
  postKind?: PostKind;
  promotionCategory?: PromotionCategory;
  tagIds?: string[];
  branchIds?: string[];
  limit?: number;
};

export type InternalLinkSuggestion = {
  title: string;
  href: string;
  contentType: InternalLinkContentType | "hub";
  reason: string;
  source: "db" | "hub";
  rankScore?: number;
  tier?: "A" | "B";
};

export type InternalLinkCandidate = {
  contentType: InternalLinkContentType;
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  categoryId?: string | null;
  promotionCategory?: PromotionCategory | null;
  tagIds: string[];
  branchIds: string[];
  latestAuditScore: number | null;
};

export type RankedInternalLinkCandidate = InternalLinkCandidate & {
  rankScore: number;
  tier: "A" | "B";
  sameCategory: boolean;
  sharedTagCount: number;
  sameBranch: boolean;
  publishedWithin90Days: boolean;
};

const POOL_LIMIT = 30;
const RECENCY_DAYS = 90;
const EVENT_RECENCY_DAYS = 30;

const HUB_PAGES: Record<
  InternalLinkContentType,
  { href: string; title: string; reason: string }
> = {
  post: {
    href: "/news",
    title: "ดูข่าวสารทั้งหมด",
    reason: "Explore all news",
  },
  event: {
    href: "/events",
    title: "ดูกิจกรรมทั้งหมด",
    reason: "Explore all events",
  },
  promotion: {
    href: "/promotions",
    title: "ดูโปรโมชั่นทั้งหมด",
    reason: "Explore all promotions",
  },
};

const candidateSelect = {
  id: true,
  title: true,
  slug: true,
  publishedAt: true,
  tags: { select: { tagId: true } },
  branches: { select: { branchId: true } },
  seo: { select: { noindex: true } },
  seoAudits: {
    orderBy: { analyzedAt: "desc" },
    take: 1,
    select: { score: true },
  },
} as const;

function now() {
  return new Date();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function publishedSeoFilter() {
  return [{ seo: null }, { seo: { is: { noindex: false } } }] as const;
}

function getLatestAuditScore(
  audits: ReadonlyArray<{ score: number | null }>,
): number | null {
  const latest = audits[0];
  return latest?.score ?? null;
}

function mapPostCandidate(post: {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  categoryId: string | null;
  tags: ReadonlyArray<{ tagId: string }>;
  branches: ReadonlyArray<{ branchId: string }>;
  seo: { noindex: boolean } | null;
  seoAudits: ReadonlyArray<{ score: number | null }>;
}): InternalLinkCandidate {
  return {
    contentType: "post",
    id: post.id,
    title: post.title,
    slug: post.slug,
    publishedAt: post.publishedAt,
    categoryId: post.categoryId,
    tagIds: post.tags.map((tag) => tag.tagId),
    branchIds: post.branches.map((branch) => branch.branchId),
    latestAuditScore: getLatestAuditScore(post.seoAudits),
  };
}

function mapEventCandidate(event: {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  tags: ReadonlyArray<{ tagId: string }>;
  branches: ReadonlyArray<{ branchId: string }>;
  seo: { noindex: boolean } | null;
  seoAudits: ReadonlyArray<{ score: number | null }>;
}): InternalLinkCandidate {
  return {
    contentType: "event",
    id: event.id,
    title: event.title,
    slug: event.slug,
    publishedAt: event.publishedAt,
    tagIds: event.tags.map((tag) => tag.tagId),
    branchIds: event.branches.map((branch) => branch.branchId),
    latestAuditScore: getLatestAuditScore(event.seoAudits),
  };
}

function mapPromotionCandidate(promotion: {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  category: PromotionCategory;
  tags: ReadonlyArray<{ tagId: string }>;
  branches: ReadonlyArray<{ branchId: string }>;
  seo: { noindex: boolean } | null;
  seoAudits: ReadonlyArray<{ score: number | null }>;
}): InternalLinkCandidate {
  return {
    contentType: "promotion",
    id: promotion.id,
    title: promotion.title,
    slug: promotion.slug,
    publishedAt: promotion.publishedAt,
    promotionCategory: promotion.category,
    tagIds: promotion.tags.map((tag) => tag.tagId),
    branchIds: promotion.branches.map((branch) => branch.branchId),
    latestAuditScore: getLatestAuditScore(promotion.seoAudits),
  };
}

export function passesTierFilter(candidate: InternalLinkCandidate): boolean {
  if (candidate.latestAuditScore == null) return true;
  return candidate.latestAuditScore >= AUDIT_QUALITY_THRESHOLD;
}

function mergeCandidates(
  existing: InternalLinkCandidate,
  incoming: InternalLinkCandidate,
): InternalLinkCandidate {
  const latestAuditScore =
    existing.latestAuditScore == null
      ? incoming.latestAuditScore
      : incoming.latestAuditScore == null
        ? existing.latestAuditScore
        : Math.max(existing.latestAuditScore, incoming.latestAuditScore);

  const publishedAt =
    existing.publishedAt && incoming.publishedAt
      ? existing.publishedAt > incoming.publishedAt
        ? existing.publishedAt
        : incoming.publishedAt
      : existing.publishedAt ?? incoming.publishedAt;

  return {
    ...existing,
    title: existing.title || incoming.title,
    slug: existing.slug || incoming.slug,
    publishedAt,
    categoryId: existing.categoryId ?? incoming.categoryId,
    promotionCategory: existing.promotionCategory ?? incoming.promotionCategory,
    tagIds: [...new Set([...existing.tagIds, ...incoming.tagIds])],
    branchIds: [...new Set([...existing.branchIds, ...incoming.branchIds])],
    latestAuditScore,
  };
}

export function dedupeCandidates(candidates: InternalLinkCandidate[]): InternalLinkCandidate[] {
  const byKey = new Map<string, InternalLinkCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.contentType}:${candidate.id}`;
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeCandidates(existing, candidate) : candidate);
  }

  return [...byKey.values()];
}

export function countSharedTags(candidate: InternalLinkCandidate, tagIds: string[]): number {
  if (tagIds.length === 0 || candidate.tagIds.length === 0) return 0;
  const tagSet = new Set(tagIds);
  return candidate.tagIds.filter((tagId) => tagSet.has(tagId)).length;
}

export function hasSharedBranch(candidate: InternalLinkCandidate, branchIds: string[]): boolean {
  if (branchIds.length === 0 || candidate.branchIds.length === 0) return false;
  const branchSet = new Set(branchIds);
  return candidate.branchIds.some((branchId) => branchSet.has(branchId));
}

export function isSameCategoryOrPromotionCategory(
  candidate: InternalLinkCandidate,
  ctx: InternalLinkQueryContext,
): boolean {
  if (ctx.contentType === "post" && candidate.contentType === "post") {
    return Boolean(ctx.categoryId) && candidate.categoryId === ctx.categoryId;
  }

  if (ctx.contentType === "promotion" && candidate.contentType === "promotion") {
    return Boolean(ctx.promotionCategory) && candidate.promotionCategory === ctx.promotionCategory;
  }

  return false;
}

export function isPublishedWithinDays(publishedAt: Date | null, days: number): boolean {
  if (!publishedAt) return false;
  return publishedAt >= daysAgo(days);
}

export function computeRankScore(
  candidate: InternalLinkCandidate,
  ctx: InternalLinkQueryContext,
): number {
  const tier: "A" | "B" = candidate.latestAuditScore != null ? "A" : "B";

  if (tier === "A" && candidate.latestAuditScore! < AUDIT_QUALITY_THRESHOLD) {
    return Number.NEGATIVE_INFINITY;
  }

  const tagIds = ctx.tagIds ?? [];
  const branchIds = ctx.branchIds ?? [];
  const sharedTagCount = countSharedTags(candidate, tagIds);
  const sameCategory = isSameCategoryOrPromotionCategory(candidate, ctx);
  const sameBranch = hasSharedBranch(candidate, branchIds);
  const publishedWithin90Days = isPublishedWithinDays(candidate.publishedAt, RECENCY_DAYS);
  const compatibilityPenalty =
    CONTENT_TYPE_COMPATIBILITY[ctx.contentType][candidate.contentType];

  return (
    (sameCategory ? 40 : 0) +
    Math.min(sharedTagCount * 15, 45) +
    (sameBranch ? 10 : 0) +
    (tier === "A" ? AUDIT_BONUS : 0) +
    (tier === "A" && candidate.latestAuditScore! >= HIGH_QUALITY_THRESHOLD
      ? HIGH_QUALITY_BONUS
      : 0) +
    (publishedWithin90Days ? 10 : 0) +
    compatibilityPenalty
  );
}

export function rankCandidates(
  candidates: InternalLinkCandidate[],
  ctx: InternalLinkQueryContext,
): RankedInternalLinkCandidate[] {
  const tagIds = ctx.tagIds ?? [];
  const branchIds = ctx.branchIds ?? [];

  return candidates
    .filter(passesTierFilter)
    .map((candidate) => {
      const tier: "A" | "B" = candidate.latestAuditScore != null ? "A" : "B";
      const sharedTagCount = countSharedTags(candidate, tagIds);

      return {
        ...candidate,
        rankScore: computeRankScore(candidate, ctx),
        tier,
        sameCategory: isSameCategoryOrPromotionCategory(candidate, ctx),
        sharedTagCount,
        sameBranch: hasSharedBranch(candidate, branchIds),
        publishedWithin90Days: isPublishedWithinDays(candidate.publishedAt, RECENCY_DAYS),
      };
    })
    .filter((candidate) => candidate.rankScore > Number.NEGATIVE_INFINITY)
    .sort((a, b) => {
      const scoreDiff = b.rankScore - a.rankScore;
      if (scoreDiff !== 0) return scoreDiff;

      const aPublished = a.publishedAt?.getTime() ?? 0;
      const bPublished = b.publishedAt?.getTime() ?? 0;
      if (bPublished !== aPublished) return bPublished - aPublished;

      return a.id.localeCompare(b.id);
    });
}

export function selectTopRankedSuggestions(
  ranked: RankedInternalLinkCandidate[],
  limit = SUGGESTION_TARGET,
): RankedInternalLinkCandidate[] {
  return ranked.slice(0, Math.min(limit, SUGGESTION_MAX));
}

export function buildSuggestionReason(candidate: RankedInternalLinkCandidate): string {
  const parts: string[] = [];

  if (candidate.sameCategory) {
    parts.push("Same category");
  }

  if (candidate.sharedTagCount > 0) {
    parts.push(`Shares ${candidate.sharedTagCount} tags`);
  }

  if (candidate.sameBranch) {
    parts.push("Popular in this branch");
  }

  if (candidate.tier === "A" && candidate.latestAuditScore != null) {
    parts.push(`SEO Score ${candidate.latestAuditScore}`);
  } else if (candidate.tier === "B") {
    parts.push("Recently published");
  }

  if (candidate.publishedWithin90Days && parts.length === 0) {
    parts.push("Recent high-performing content");
  }

  return parts.length > 0 ? parts.join(" · ") : "Recently published";
}

export function toInternalLinkHref(candidate: InternalLinkCandidate): string {
  switch (candidate.contentType) {
    case "post":
      return `/news/${candidate.slug}`;
    case "event":
      return `/events/${candidate.slug}`;
    case "promotion":
      return `/promotions/${candidate.slug}`;
  }
}

export function toInternalLinkSuggestion(candidate: RankedInternalLinkCandidate): InternalLinkSuggestion {
  return {
    title: candidate.title,
    href: toInternalLinkHref(candidate),
    contentType: candidate.contentType,
    reason: buildSuggestionReason(candidate),
    source: "db",
    rankScore: candidate.rankScore,
    tier: candidate.tier,
  };
}

export function buildHubSafetyNet(
  ctx: InternalLinkQueryContext,
  max = 2,
): InternalLinkSuggestion[] {
  const hub = HUB_PAGES[ctx.contentType];

  return [
    {
      title: hub.title,
      href: hub.href,
      contentType: "hub",
      reason: hub.reason,
      source: "hub",
    },
  ].slice(0, max);
}

async function fetchPostCandidates(ctx: InternalLinkQueryContext): Promise<InternalLinkCandidate[]> {
  const baseWhere = {
    deletedAt: null,
    status: "PUBLISHED" as const,
    id: { not: ctx.contentId },
    OR: [...publishedSeoFilter()],
  };

  const [categoryPool, tagPool, recentPool] = await Promise.all([
    ctx.categoryId
      ? prisma.post.findMany({
          where: { ...baseWhere, categoryId: ctx.categoryId },
          select: { ...candidateSelect, categoryId: true },
          orderBy: { publishedAt: "desc" },
          take: POOL_LIMIT,
        })
      : Promise.resolve([]),
    ctx.tagIds?.length
      ? prisma.post.findMany({
          where: {
            ...baseWhere,
            tags: { some: { tagId: { in: ctx.tagIds } } },
          },
          select: { ...candidateSelect, categoryId: true },
          orderBy: { publishedAt: "desc" },
          take: POOL_LIMIT,
        })
      : Promise.resolve([]),
    prisma.post.findMany({
      where: {
        ...baseWhere,
        publishedAt: { gte: daysAgo(RECENCY_DAYS) },
      },
      select: { ...candidateSelect, categoryId: true },
      orderBy: { publishedAt: "desc" },
      take: POOL_LIMIT,
    }),
  ]);

  return dedupeCandidates([
    ...categoryPool.map(mapPostCandidate),
    ...tagPool.map(mapPostCandidate),
    ...recentPool.map(mapPostCandidate),
  ]);
}

async function fetchEventCandidates(ctx: InternalLinkQueryContext): Promise<InternalLinkCandidate[]> {
  const current = now();
  const eventRecencyStart = daysAgo(EVENT_RECENCY_DAYS);
  const baseWhere = {
    deletedAt: null,
    status: "PUBLISHED" as const,
    id: { not: ctx.contentId },
    OR: [...publishedSeoFilter()],
  };

  const [tagPool, branchPool, upcomingPool] = await Promise.all([
    ctx.tagIds?.length
      ? prisma.event.findMany({
          where: {
            ...baseWhere,
            tags: { some: { tagId: { in: ctx.tagIds } } },
            OR: [
              { eventDate: { gte: eventRecencyStart } },
              { eventEndDate: { gte: current } },
            ],
          },
          select: candidateSelect,
          orderBy: { publishedAt: "desc" },
          take: POOL_LIMIT,
        })
      : Promise.resolve([]),
    ctx.branchIds?.length
      ? prisma.event.findMany({
          where: {
            ...baseWhere,
            branches: { some: { branchId: { in: ctx.branchIds } } },
          },
          select: candidateSelect,
          orderBy: { publishedAt: "desc" },
          take: POOL_LIMIT,
        })
      : Promise.resolve([]),
    prisma.event.findMany({
      where: {
        ...baseWhere,
        showOnHome: true,
        eventDate: { gte: current },
      },
      select: candidateSelect,
      orderBy: { eventDate: "asc" },
      take: POOL_LIMIT,
    }),
  ]);

  return dedupeCandidates([
    ...tagPool.map(mapEventCandidate),
    ...branchPool.map(mapEventCandidate),
    ...upcomingPool.map(mapEventCandidate),
  ]);
}

async function fetchPromotionCandidates(
  ctx: InternalLinkQueryContext,
): Promise<InternalLinkCandidate[]> {
  const current = now();
  const activeWhere = {
    deletedAt: null,
    status: "PUBLISHED" as const,
    id: { not: ctx.contentId },
    startDate: { lte: current },
    endDate: { gte: current },
    OR: [...publishedSeoFilter()],
  };

  const [categoryPool, tagPool, recentPool] = await Promise.all([
    ctx.promotionCategory
      ? prisma.promotion.findMany({
          where: { ...activeWhere, category: ctx.promotionCategory },
          select: { ...candidateSelect, category: true },
          orderBy: { publishedAt: "desc" },
          take: POOL_LIMIT,
        })
      : Promise.resolve([]),
    ctx.tagIds?.length
      ? prisma.promotion.findMany({
          where: {
            ...activeWhere,
            tags: { some: { tagId: { in: ctx.tagIds } } },
          },
          select: { ...candidateSelect, category: true },
          orderBy: { publishedAt: "desc" },
          take: POOL_LIMIT,
        })
      : Promise.resolve([]),
    prisma.promotion.findMany({
      where: {
        ...activeWhere,
        publishedAt: { gte: daysAgo(RECENCY_DAYS) },
      },
      select: { ...candidateSelect, category: true },
      orderBy: { publishedAt: "desc" },
      take: POOL_LIMIT,
    }),
  ]);

  return dedupeCandidates([
    ...categoryPool.map(mapPromotionCandidate),
    ...tagPool.map(mapPromotionCandidate),
    ...recentPool.map(mapPromotionCandidate),
  ]);
}

async function fetchSameTypeCandidates(ctx: InternalLinkQueryContext): Promise<InternalLinkCandidate[]> {
  switch (ctx.contentType) {
    case "post":
      return fetchPostCandidates(ctx);
    case "event":
      return fetchEventCandidates(ctx);
    case "promotion":
      return fetchPromotionCandidates(ctx);
  }
}

async function fetchCrossTypeCandidates(ctx: InternalLinkQueryContext): Promise<InternalLinkCandidate[]> {
  const types: InternalLinkContentType[] = ["post", "event", "promotion"].filter(
    (type) => type !== ctx.contentType,
  );

  const pools = await Promise.all(
    types.map(async (type) => {
      const crossCtx: InternalLinkQueryContext = { ...ctx, contentType: type };

      switch (type) {
        case "post":
          return fetchPostCandidates(crossCtx);
        case "event":
          return fetchEventCandidates(crossCtx);
        case "promotion":
          return fetchPromotionCandidates(crossCtx);
      }
    }),
  );

  return dedupeCandidates(pools.flat());
}

export async function resolveInternalLinkSuggestions(
  ctx: InternalLinkQueryContext,
): Promise<InternalLinkSuggestion[]> {
  const target = ctx.limit ?? SUGGESTION_TARGET;

  const sameTypeCandidates = await fetchSameTypeCandidates(ctx);
  let ranked = rankCandidates(sameTypeCandidates, ctx);

  if (ranked.length < SUGGESTION_MIN) {
    const crossTypeCandidates = await fetchCrossTypeCandidates(ctx);
    ranked = rankCandidates(dedupeCandidates([...sameTypeCandidates, ...crossTypeCandidates]), ctx);
  }

  const dbTop = selectTopRankedSuggestions(ranked, target).map(toInternalLinkSuggestion);

  if (dbTop.length < SUGGESTION_MIN) {
    const hubs = buildHubSafetyNet(ctx, 2);
    return [...dbTop, ...hubs].slice(0, SUGGESTION_MAX);
  }

  return dbTop;
}
