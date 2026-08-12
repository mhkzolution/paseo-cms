import type { Prisma } from "@prisma/client";

import { analyzeSeoScore, type ContentType, type SeoScoreInput } from "@/lib/seo-score";

type AuditClient = {
  seoAudit: {
    create: (args: { data: Prisma.SeoAuditUncheckedCreateInput }) => Promise<unknown>;
  };
};

export async function persistSeoAudit(
  tx: AuditClient,
  target: { postId: string } | { eventId: string } | { promotionId: string },
  input: SeoScoreInput,
) {
  const result = analyzeSeoScore(input);

  await tx.seoAudit.create({
    data: {
      postId: "postId" in target ? target.postId : null,
      eventId: "eventId" in target ? target.eventId : null,
      promotionId: "promotionId" in target ? target.promotionId : null,
      score: result.seoScore,
      readability: result.readabilityScore,
      checks: result.checks as unknown as Prisma.InputJsonValue,
      suggestions: result.checks
        .filter((check) => check.status !== "good")
        .map((check) => ({ id: check.id, tip: check.tip, status: check.status })) as unknown as Prisma.InputJsonValue,
    },
  });

  return result;
}

export const latestSeoAuditInclude = {
  orderBy: { analyzedAt: "desc" as const },
  take: 1,
  select: {
    score: true,
    readability: true,
    analyzedAt: true,
  },
};

export function toSeoScoreInput(
  values: {
    title?: string | null;
    slug?: string | null;
    content?: string | null;
    excerpt?: string | null;
    featuredImage?: string | null;
    coverImageAlt?: string | null;
    seo?: {
      seoTitle?: string | null;
      seoDescription?: string | null;
      focusKeyword?: string | null;
      ogImage?: string | null;
    } | null;
  },
  options?: {
    contentType?: ContentType;
  },
): SeoScoreInput {
  return {
    title: values.title,
    slug: values.slug,
    content: values.content,
    excerpt: values.excerpt,
    featuredImage: values.featuredImage,
    coverImageAlt: values.coverImageAlt,
    contentType: options?.contentType,
    seo: values.seo
      ? {
          seoTitle: values.seo.seoTitle,
          seoDescription: values.seo.seoDescription,
          focusKeyword: values.seo.focusKeyword,
          ogImage: values.seo.ogImage,
        }
      : null,
  };
}
