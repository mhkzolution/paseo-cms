import { ContentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { countAuditSuggestions, parseAuditChecks } from "@/lib/seo-workspace/parse-audit-checks";
import type { WorkspaceCorpusItem } from "@/lib/seo-workspace/types";

const PUBLISHED_WHERE = {
  deletedAt: null,
  status: ContentStatus.PUBLISHED,
} as const;

const LATEST_AUDIT_SELECT = {
  orderBy: { analyzedAt: "desc" as const },
  take: 1,
  select: {
    score: true,
    checks: true,
    suggestions: true,
    analyzedAt: true,
  },
};

export async function loadWorkspaceCorpus(): Promise<WorkspaceCorpusItem[]> {
  const [posts, events, promotions] = await Promise.all([
    prisma.post.findMany({
      where: PUBLISHED_WHERE,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        categoryId: true,
        tags: { select: { tagId: true } },
        branches: { select: { branchId: true } },
        seoAudits: LATEST_AUDIT_SELECT,
      },
    }),
    prisma.event.findMany({
      where: PUBLISHED_WHERE,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        tags: { select: { tagId: true } },
        branches: { select: { branchId: true } },
        seoAudits: LATEST_AUDIT_SELECT,
      },
    }),
    prisma.promotion.findMany({
      where: PUBLISHED_WHERE,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        category: true,
        tags: { select: { tagId: true } },
        branches: { select: { branchId: true } },
        seoAudits: LATEST_AUDIT_SELECT,
      },
    }),
  ]);

  const postItems: WorkspaceCorpusItem[] = posts.map((post) => {
    const audit = post.seoAudits[0];

    return {
      id: post.id,
      title: post.title,
      contentType: "post",
      updatedAt: post.updatedAt,
      categoryKey: post.categoryId,
      branchIds: post.branches.map((branch) => branch.branchId),
      tagIds: post.tags.map((tag) => tag.tagId),
      latestAudit:
        audit?.score != null
          ? {
              score: audit.score,
              checks: parseAuditChecks(audit.checks),
              analyzedAt: audit.analyzedAt,
              suggestionCount: countAuditSuggestions(audit.suggestions),
            }
          : null,
    };
  });

  const eventItems: WorkspaceCorpusItem[] = events.map((event) => {
    const audit = event.seoAudits[0];

    return {
      id: event.id,
      title: event.title,
      contentType: "event",
      updatedAt: event.updatedAt,
      categoryKey: null,
      branchIds: event.branches.map((branch) => branch.branchId),
      tagIds: event.tags.map((tag) => tag.tagId),
      latestAudit:
        audit?.score != null
          ? {
              score: audit.score,
              checks: parseAuditChecks(audit.checks),
              analyzedAt: audit.analyzedAt,
              suggestionCount: countAuditSuggestions(audit.suggestions),
            }
          : null,
    };
  });

  const promotionItems: WorkspaceCorpusItem[] = promotions.map((promotion) => {
    const audit = promotion.seoAudits[0];

    return {
      id: promotion.id,
      title: promotion.title,
      contentType: "promotion",
      updatedAt: promotion.updatedAt,
      categoryKey: promotion.category,
      branchIds: promotion.branches.map((branch) => branch.branchId),
      tagIds: promotion.tags.map((tag) => tag.tagId),
      latestAudit:
        audit?.score != null
          ? {
              score: audit.score,
              checks: parseAuditChecks(audit.checks),
              analyzedAt: audit.analyzedAt,
              suggestionCount: countAuditSuggestions(audit.suggestions),
            }
          : null,
    };
  });

  return [...postItems, ...eventItems, ...promotionItems];
}
