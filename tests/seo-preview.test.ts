import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@prisma/client";

import type { AutoFillSeoShape } from "@/lib/seo-auto-fill";
import { enrichSeoForSave } from "@/lib/seo-content-save";
import { toSeoScoreInput } from "@/lib/seo-audit";
import { buildPreviewSeoPayload, resolvePreviewPrimaryTagName } from "@/lib/seo-preview";
import { analyzeSeoScore } from "@/lib/seo-score";

const workflowExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

const workflowContent = `
  <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music at the mall.</p>
  <h2>What to expect</h2>
  <p>Enjoy local vendors, live shows, and mall rewards during the grand opening celebration this weekend.</p>
  <p>Visit our stores and enjoy the grand opening offers available throughout the weekend for every guest.</p>
`;

const workflowSlug = "grand-opening-paseo";

const mockPrisma = {
  tag: {
    findFirst: async () => ({ name: "grand opening" }),
  },
  category: {
    findFirst: async () => ({ name: "Events" }),
  },
} as Pick<PrismaClient, "tag" | "category">;

const editorTags = [{ label: "grand opening", value: "tag-1" }];
const editorCategories = [{ label: "Events", value: "cat-1" }];

function buildWorkflowPostData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Grand Opening at The Paseo Park",
    excerpt: workflowExcerpt,
    content: workflowContent,
    featuredImage: "/uploads/cover.jpg",
    coverImageAlt: "Grand opening crowd at The Paseo",
    tagIds: ["tag-1"],
    newTags: "",
    categoryId: "cat-1",
    kind: "NEWS" as const,
    seo: {} as AutoFillSeoShape,
    slug: workflowSlug,
    ...overrides,
  };
}

async function scoreOnServer(
  data: ReturnType<typeof buildWorkflowPostData>,
  contentType: "post" | "event" | "promotion",
) {
  const enriched = await enrichSeoForSave(mockPrisma, data, {
    contentType,
    slug: workflowSlug,
    isCreate: true,
  });

  return {
    enriched,
    score: analyzeSeoScore(toSeoScoreInput(enriched, { contentType })),
  };
}

function scoreInPreview(
  data: ReturnType<typeof buildWorkflowPostData>,
  contentType: "post" | "event" | "promotion",
  options: {
    postKind?: "NEWS" | "PUBLIC_RELATIONS" | "CENTER_UPDATE" | "ARTICLE";
    promotionCategory?: string;
  } = {},
) {
  const payload = buildPreviewSeoPayload({
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    featuredImage: data.featuredImage,
    coverImageAlt: data.coverImageAlt,
    slug: data.slug,
    seo: data.seo,
    contentType,
    postKind: options.postKind,
    promotionCategory: options.promotionCategory,
    categoryId: data.categoryId,
    tagIds: data.tagIds,
    newTags: data.newTags,
    categories: editorCategories,
    tags: editorTags,
  });

  return {
    payload,
    score: analyzeSeoScore(payload.scoreInput),
  };
}

describe("seo-preview", () => {
  it("preview score equals server score for workflow post", async () => {
    const data = buildWorkflowPostData();
    const server = await scoreOnServer(data, "post");
    const preview = scoreInPreview(data, "post", { postKind: "NEWS" });

    assert.equal(preview.score.seoScore, server.score.seoScore);
    assert.equal(preview.score.readabilityScore, server.score.readabilityScore);
  });

  it("auto-filled seoTitle matches server", async () => {
    const data = buildWorkflowPostData();
    const server = await scoreOnServer(data, "post");
    const preview = scoreInPreview(data, "post", { postKind: "NEWS" });

    assert.equal(preview.payload.previewSeo.seoTitle, server.enriched.seo.seoTitle);
  });

  it("auto-filled description matches server", async () => {
    const data = buildWorkflowPostData();
    const server = await scoreOnServer(data, "post");
    const preview = scoreInPreview(data, "post", { postKind: "NEWS" });

    assert.equal(preview.payload.previewSeo.seoDescription, server.enriched.seo.seoDescription);
  });

  it("focus keyword inference matches server via tagIds lookup", async () => {
    const data = buildWorkflowPostData();
    const server = await scoreOnServer(data, "post");
    const preview = scoreInPreview(data, "post", { postKind: "NEWS" });

    assert.equal(preview.payload.previewSeo.focusKeyword, server.enriched.seo.focusKeyword);
    assert.equal(
      resolvePreviewPrimaryTagName({
        tagIds: data.tagIds,
        tags: editorTags,
      }),
      "grand opening",
    );
  });

  it("event preview score matches server score", async () => {
    const data = buildWorkflowPostData({
      categoryId: "",
      kind: undefined,
      content: `
        <p>Grand opening weekend starts now at The Paseo with food, music, and family fun for visitors.</p>
        <h2>Highlights</h2>
        <p>Enjoy the grand opening celebration with rewards and activities all weekend at the mall.</p>
      `,
    });
    const server = await scoreOnServer(data, "event");
    const preview = scoreInPreview(data, "event");

    assert.equal(preview.score.seoScore, server.score.seoScore);
    assert.equal(preview.score.readabilityScore, server.score.readabilityScore);
    assert.ok(preview.score.seoScore >= 80);
  });

  it("promotion preview score matches server score", async () => {
    const data = buildWorkflowPostData({
      categoryId: "",
      kind: undefined,
      category: "FOOD",
      content: `
        <p>Grand opening weekend starts now at The Paseo with food, music, and family fun for visitors.</p>
        <h2>Highlights</h2>
        <p>Enjoy the grand opening celebration with rewards and activities all weekend at the mall.</p>
      `,
    });
    const server = await scoreOnServer(data, "promotion");
    const preview = scoreInPreview(data, "promotion", { promotionCategory: "FOOD" });

    assert.equal(preview.score.seoScore, server.score.seoScore);
    assert.equal(preview.score.readabilityScore, server.score.readabilityScore);
    assert.ok(preview.score.seoScore >= 80);
  });
});
