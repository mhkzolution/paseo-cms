import { AuditAction, type ContentStatus, type Role } from "@prisma/client";

import type { AuditActor } from "@/lib/audit-log";

type SeoLike = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  focusKeyword?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean | null;
  nofollow?: boolean | null;
  [key: string]: unknown;
} | null | undefined;

type ContentLike = {
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  subtitle?: string | null;
  status?: ContentStatus | string | null;
  publishedAt?: Date | string | null;
  featuredImage?: string | null;
  seo?: SeoLike;
  [key: string]: unknown;
};

export function toAuditActor(user: {
  id: string;
  name?: string | null;
  role?: Role | string | null;
} | null | undefined): AuditActor | null {
  if (!user?.id) return null;

  return {
    id: user.id,
    name: user.name ?? "",
    role: (user.role as Role | null | undefined) ?? null,
  };
}

export function resolveContentAction(
  beforeStatus: string | null | undefined,
  afterStatus: string | null | undefined,
): AuditAction {
  if (beforeStatus !== "PUBLISHED" && afterStatus === "PUBLISHED") {
    return AuditAction.PUBLISH;
  }
  if (beforeStatus === "PUBLISHED" && afterStatus === "DRAFT") {
    return AuditAction.UNPUBLISH;
  }
  return AuditAction.UPDATE;
}

export function pickContentAuditSnapshot(entity: ContentLike): Record<string, unknown> {
  const publishedAt =
    entity.publishedAt instanceof Date
      ? entity.publishedAt.toISOString()
      : (entity.publishedAt ?? null);

  return {
    title: entity.title ?? null,
    slug: entity.slug ?? null,
    excerpt: entity.excerpt ?? null,
    subtitle: entity.subtitle ?? null,
    status: entity.status ?? null,
    publishedAt,
    featuredImage: entity.featuredImage ?? null,
    seoTitle: entity.seo?.seoTitle ?? null,
    seoDescription: entity.seo?.seoDescription ?? null,
    focusKeyword: entity.seo?.focusKeyword ?? null,
    canonicalUrl: entity.seo?.canonicalUrl ?? null,
    noindex: entity.seo?.noindex ?? null,
    nofollow: entity.seo?.nofollow ?? null,
  };
}

export const buildPostAuditSnapshot = pickContentAuditSnapshot;
export const buildEventAuditSnapshot = pickContentAuditSnapshot;
export const buildPromotionAuditSnapshot = pickContentAuditSnapshot;
