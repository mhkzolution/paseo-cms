import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUDIT_BONUS,
  CONTENT_TYPE_COMPATIBILITY,
  HIGH_QUALITY_BONUS,
  SUGGESTION_MAX,
  SUGGESTION_TARGET,
  buildHubSafetyNet,
  buildSuggestionReason,
  computeRankScore,
  countSharedTags,
  dedupeCandidates,
  passesTierFilter,
  rankCandidates,
  selectTopRankedSuggestions,
  type InternalLinkCandidate,
  type InternalLinkQueryContext,
  type RankedInternalLinkCandidate,
} from "@/lib/seo-internal-links";

function candidate(
  overrides: Partial<InternalLinkCandidate> & Pick<InternalLinkCandidate, "id" | "contentType">,
): InternalLinkCandidate {
  return {
    title: "Sample Title",
    slug: "sample-title",
    publishedAt: new Date("2026-01-15T00:00:00.000Z"),
    tagIds: [],
    branchIds: [],
    latestAuditScore: null,
    ...overrides,
  };
}

function ctx(overrides: Partial<InternalLinkQueryContext> = {}): InternalLinkQueryContext {
  return {
    contentType: "post",
    contentId: "current-post",
    categoryId: "cat-1",
    tagIds: ["tag-1", "tag-2"],
    branchIds: ["branch-1"],
    ...overrides,
  };
}

describe("seo-internal-links", () => {
  it("passesTierFilter excludes audited content below 70", () => {
    assert.equal(passesTierFilter(candidate({ id: "a", contentType: "post", latestAuditScore: 69 })), false);
    assert.equal(passesTierFilter(candidate({ id: "b", contentType: "post", latestAuditScore: 70 })), true);
    assert.equal(passesTierFilter(candidate({ id: "c", contentType: "post", latestAuditScore: null })), true);
  });

  it("computeRankScore applies promotion to event penalty of -40", () => {
    const promotionCtx = ctx({ contentType: "promotion", promotionCategory: "FOOD" });
    const auditedBase = {
      latestAuditScore: 85,
      publishedAt: new Date("2026-01-15T00:00:00.000Z"),
    } as const;

    const eventScore = computeRankScore(
      candidate({ id: "event-1", contentType: "event", ...auditedBase }),
      promotionCtx,
    );
    const postScore = computeRankScore(
      candidate({ id: "post-1", contentType: "post", ...auditedBase }),
      promotionCtx,
    );
    const promotionScore = computeRankScore(
      candidate({
        id: "promo-1",
        contentType: "promotion",
        promotionCategory: "FOOD",
        ...auditedBase,
      }),
      promotionCtx,
    );

    assert.equal(CONTENT_TYPE_COMPATIBILITY.promotion.event, -40);
    assert.equal(eventScore - postScore, -30);
    assert.ok(eventScore < postScore);
    assert.ok(eventScore < promotionScore);
  });

  it("computeRankScore applies CONTENT_TYPE_COMPATIBILITY matrix", () => {
    const base = candidate({
      id: "promo-1",
      contentType: "promotion",
      latestAuditScore: 80,
      categoryId: null,
      promotionCategory: "FOOD",
    });

    const promotionCtx = ctx({ contentType: "promotion", promotionCategory: "FOOD" });
    const toPost = computeRankScore({ ...base, contentType: "post" }, promotionCtx);
    const toEvent = computeRankScore({ ...base, contentType: "event" }, promotionCtx);

    assert.ok(toPost > toEvent);
    assert.equal(
      toEvent - toPost,
      CONTENT_TYPE_COMPATIBILITY.promotion.event - CONTENT_TYPE_COMPATIBILITY.promotion.post,
    );
  });

  it("rankCandidates sorts Tier A above Tier B when signals equal", () => {
    const audited = candidate({
      id: "audited",
      contentType: "post",
      categoryId: "cat-1",
      latestAuditScore: 75,
    });
    const unaudited = candidate({
      id: "unaudited",
      contentType: "post",
      categoryId: "cat-1",
      latestAuditScore: null,
    });

    const ranked = rankCandidates([unaudited, audited], ctx());
    assert.equal(ranked[0]?.id, "audited");
    assert.equal(ranked[0]?.tier, "A");
    assert.equal(ranked[1]?.tier, "B");
  });

  it("rankCandidates excludes audited content with score below 70", () => {
    const ranked = rankCandidates(
      [
        candidate({ id: "low", contentType: "post", latestAuditScore: 65 }),
        candidate({ id: "good", contentType: "post", latestAuditScore: 72 }),
      ],
      ctx(),
    );

    assert.equal(ranked.length, 1);
    assert.equal(ranked[0]?.id, "good");
  });

  it("rankCandidates prefers same category over cross-type", () => {
    const sameCategory = candidate({
      id: "same",
      contentType: "post",
      categoryId: "cat-1",
      latestAuditScore: 75,
    });
    const crossType = candidate({
      id: "event",
      contentType: "event",
      latestAuditScore: 75,
    });

    const ranked = rankCandidates([crossType, sameCategory], ctx());
    assert.equal(ranked[0]?.id, "same");
  });

  it("buildSuggestionReason combines explainability fragments", () => {
    const ranked: RankedInternalLinkCandidate = {
      ...candidate({
        id: "rich",
        contentType: "post",
        categoryId: "cat-1",
        latestAuditScore: 88,
        tagIds: ["tag-1", "tag-2"],
        branchIds: ["branch-1"],
      }),
      rankScore: 100,
      tier: "A",
      sameCategory: true,
      sharedTagCount: 2,
      sameBranch: true,
      publishedWithin90Days: true,
    };

    const reason = buildSuggestionReason(ranked);
    assert.ok(reason.includes("Same category"));
    assert.ok(reason.includes("Shares 2 tags"));
    assert.ok(reason.includes("SEO Score 88"));
  });

  it("buildHubSafetyNet returns hub entries not ranked with db pool", () => {
    const hubs = buildHubSafetyNet(ctx({ contentType: "post" }), 2);
    assert.equal(hubs.length, 1);
    assert.equal(hubs[0]?.source, "hub");
    assert.equal(hubs[0]?.contentType, "hub");
    assert.equal(hubs[0]?.href, "/news");
    assert.ok(hubs[0]?.reason.length > 0);
  });

  it("dedupeCandidates merges pool duplicates and preserves full ranking signals", () => {
    const fromCategoryPool = candidate({
      id: "post-a",
      contentType: "post",
      title: "From category pool",
      categoryId: "cat-1",
      tagIds: [],
      latestAuditScore: 75,
    });
    const fromTagPool = candidate({
      id: "post-a",
      contentType: "post",
      title: "From tag pool",
      categoryId: "cat-1",
      tagIds: ["tag-1", "tag-2"],
      latestAuditScore: 75,
    });

    const deduped = dedupeCandidates([fromCategoryPool, fromTagPool]);
    assert.equal(deduped.length, 1);

    const [ranked] = rankCandidates(deduped, ctx());
    assert.equal(ranked?.sharedTagCount, 2);
    assert.equal(ranked?.sameCategory, true);
    assert.ok((ranked?.rankScore ?? 0) >= 40 + 30 + AUDIT_BONUS);
  });

  it("selectTopRankedSuggestions ranks first then caps at SUGGESTION_MAX", () => {
    const ranked: RankedInternalLinkCandidate[] = Array.from({ length: 15 }, (_, index) => ({
      ...candidate({
        id: `post-${index}`,
        contentType: "post",
        publishedAt: new Date(`2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
      }),
      rankScore: 100 - index,
      tier: "B",
      sameCategory: false,
      sharedTagCount: 0,
      sameBranch: false,
      publishedWithin90Days: true,
    }));

    const top = selectTopRankedSuggestions(ranked, SUGGESTION_TARGET);
    assert.equal(top.length, SUGGESTION_TARGET);
    assert.equal(top[0]?.id, "post-0");
    assert.ok(top.length <= SUGGESTION_MAX);

    const capped = selectTopRankedSuggestions(ranked, 20);
    assert.equal(capped.length, SUGGESTION_MAX);
  });

  it("dedupeCandidates keeps first occurrence metadata when pools overlap", () => {
    const first = candidate({ id: "dup", contentType: "post", title: "First" });
    const second = candidate({ id: "dup", contentType: "post", title: "Second" });
    const deduped = dedupeCandidates([first, second]);
    assert.equal(deduped.length, 1);
    assert.equal(deduped[0]?.title, "First");
  });

  it("countSharedTags counts overlapping tag ids", () => {
    const shared = countSharedTags(
      candidate({ id: "x", contentType: "post", tagIds: ["tag-1", "tag-3"] }),
      ["tag-1", "tag-2"],
    );
    assert.equal(shared, 1);
  });

  it("resolveInternalLinkSuggestions excludes the current content item", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { resolveInternalLinkSuggestions, toInternalLinkHref } = await import("@/lib/seo-internal-links");

    const post = await prisma.post.findFirst({
      where: { deletedAt: null, status: "PUBLISHED" },
      include: { tags: true, branches: true },
    });

    if (!post) {
      assert.fail("expected at least one published post for self-exclusion test");
    }

    const suggestions = await resolveInternalLinkSuggestions({
      contentType: "post",
      contentId: post.id,
      categoryId: post.categoryId,
      postKind: post.kind,
      tagIds: post.tags.map((tag) => tag.tagId),
      branchIds: post.branches.map((branch) => branch.branchId),
    });

    const selfHref = toInternalLinkHref({
      id: post.id,
      contentType: "post",
      title: post.title,
      slug: post.slug,
      publishedAt: post.publishedAt,
      tagIds: [],
      branchIds: [],
      latestAuditScore: null,
    });

    assert.equal(
      suggestions.some((suggestion) => suggestion.href === selfHref),
      false,
      "current post must not be suggested as an internal link",
    );

    await prisma.$disconnect();
  });
});
