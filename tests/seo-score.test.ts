import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyAutoSeoFields } from "@/lib/seo-auto-fill";
import { analyzeSeoScore, getSeoScoreBand, shouldWarnOnPublish, stripHtml } from "@/lib/seo-score";

const workflowExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

function buildWorkflowPayload(
  overrides: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    coverImageAlt?: string;
    contentType?: "post" | "event" | "promotion";
    postKind?: "NEWS" | "PUBLIC_RELATIONS" | "CENTER_UPDATE" | "ARTICLE";
    primaryTagName?: string | null;
  } = {},
) {
  const base = {
    title: "Grand Opening at The Paseo Park",
    slug: "grand-opening-paseo",
    excerpt: workflowExcerpt,
    featuredImage: "/uploads/cover.jpg",
    coverImageAlt: "Grand opening crowd at The Paseo",
    content: `
      <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music at the mall.</p>
      <h2>What to expect</h2>
      <p>Enjoy local vendors, live shows, and mall rewards during the grand opening celebration this weekend.</p>
      <p>Visit our stores and enjoy the grand opening offers available throughout the weekend for every guest.</p>
    `,
    contentType: "post" as const,
    postKind: "NEWS" as const,
    primaryTagName: "grand opening" as string | null,
  };

  const merged = { ...base, ...overrides };
  const { seo } = applyAutoSeoFields({
    title: merged.title,
    excerpt: merged.excerpt,
    content: merged.content,
    featuredImage: merged.featuredImage,
    slug: merged.slug,
    seo: {},
    contentType: merged.contentType,
    postKind: merged.postKind,
    isCreate: true,
    primaryTagName: merged.primaryTagName,
    categoryName: null,
  });

  return {
    title: merged.title,
    slug: merged.slug,
    excerpt: merged.excerpt,
    content: merged.content,
    featuredImage: merged.featuredImage,
    coverImageAlt: merged.coverImageAlt,
    contentType: merged.contentType,
    seo,
  };
}

describe("seo-score", () => {
  it("strips html tags from content", () => {
    assert.equal(stripHtml("<p>Hello <strong>world</strong></p>"), "Hello world");
  });

  it("scores minimal post poorly", () => {
    const result = analyzeSeoScore({ title: "Hello", content: "<p>Short</p>", seo: {}, contentType: "post" });
    assert.ok(result.seoScore < 60);
    assert.equal(getSeoScoreBand(result.seoScore), "red");
    assert.equal(shouldWarnOnPublish(result.seoScore), true);
  });

  it("scores good workflow post at least 80 with readability at least 70", () => {
    const payload = buildWorkflowPayload();
    const result = analyzeSeoScore(payload);

    assert.ok(result.seoScore >= 80, `expected seoScore >= 80, got ${result.seoScore}`);
    assert.ok(result.readabilityScore >= 70, `expected readability >= 70, got ${result.readabilityScore}`);
    assert.equal(result.checks.find((check) => check.id === "topic-clarity")?.status, "good");
  });

  it("scores excellent workflow post higher when internal links exist", () => {
    const payload = buildWorkflowPayload({
      content: `
        <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music at the mall.</p>
        <h2>What to expect</h2>
        <p>Enjoy local vendors, live shows, and mall rewards. Visit our <a href="/news">news</a> page for more.</p>
        <p>Grand opening offers are available throughout the weekend for every guest visiting the mall.</p>
      `,
    });
    const result = analyzeSeoScore(payload);

    assert.ok(result.seoScore >= 90, `expected seoScore >= 90, got ${result.seoScore}`);
    assert.equal(result.checks.find((check) => check.id === "internal-links")?.status, "good");
  });

  it("scores event workflow at least 80", () => {
    const payload = buildWorkflowPayload({
      contentType: "event",
      postKind: undefined,
      content: `
        <p>Grand opening weekend starts now at The Paseo with food, music, and family fun for visitors.</p>
        <h2>Highlights</h2>
        <p>Enjoy the grand opening celebration with rewards and activities all weekend at the mall.</p>
      `,
    });
    const result = analyzeSeoScore(payload);

    assert.ok(result.seoScore >= 80, `expected event seoScore >= 80, got ${result.seoScore}`);
  });

  it("scores promotion workflow at least 80", () => {
    const payload = buildWorkflowPayload({
      contentType: "promotion",
      postKind: undefined,
      content: `
        <p>Grand opening weekend starts now at The Paseo with food, music, and family fun for visitors.</p>
        <h2>Highlights</h2>
        <p>Enjoy the grand opening celebration with rewards and activities all weekend at the mall.</p>
      `,
    });
    const result = analyzeSeoScore(payload);

    assert.ok(result.seoScore >= 80, `expected promotion seoScore >= 80, got ${result.seoScore}`);
  });

  it("flags missing topic when auto-fill is not applied", () => {
    const result = analyzeSeoScore({
      title: "Hello",
      slug: "hello",
      content: "<p>Hello world content that is long enough for a basic check here with more words added.</p>",
      seo: {
        seoTitle: "Hello world title here for search engines",
        seoDescription: "x".repeat(130),
      },
      contentType: "post",
    });
    const topic = result.checks.find((check) => check.id === "topic-clarity");
    assert.equal(topic?.status, "bad");
  });
});
