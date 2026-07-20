import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeSeoScore, getSeoScoreBand, shouldWarnOnPublish, stripHtml } from "@/lib/seo-score";

describe("seo-score", () => {
  it("strips html tags from content", () => {
    assert.equal(stripHtml("<p>Hello <strong>world</strong></p>"), "Hello world");
  });

  it("scores empty content poorly", () => {
    const result = analyzeSeoScore({ title: "", content: "", seo: {} });
    assert.ok(result.seoScore < 50);
    assert.equal(getSeoScoreBand(result.seoScore), "red");
    assert.equal(shouldWarnOnPublish(result.seoScore), true);
  });

  it("rewards well-formed seo fields and content", () => {
    const result = analyzeSeoScore({
      title: "Grand Opening at The Paseo Park",
      slug: "grand-opening-paseo",
      excerpt:
        "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend.",
      featuredImage: "/uploads/cover.jpg",
      coverImageAlt: "Grand opening crowd",
      content: `
        <p>Grand opening weekend starts now at The Paseo. Families are welcome for food and music.</p>
        <h2>What to expect</h2>
        <p>Enjoy local vendors, live shows, and mall rewards. Visit our <a href="/news">news</a> page and <a href="https://example.com">partners</a>.</p>
        <h2>Getting here</h2>
        <p>Parking is free for guests during the grand opening weekend celebration.</p>
      `,
      seo: {
        seoTitle: "Grand Opening at The Paseo Park Mall",
        seoDescription:
          "Join the grand opening at The Paseo Park with food, music, family activities, and exclusive mall rewards this weekend.",
        focusKeyword: "grand opening",
        ogImage: "/uploads/og.jpg",
      },
    });

    assert.ok(result.seoScore >= 70, `expected seoScore >= 70, got ${result.seoScore}`);
    assert.ok(result.readabilityScore >= 50, `expected readability >= 50, got ${result.readabilityScore}`);
    assert.ok(["yellow", "green"].includes(result.band));
    assert.ok(result.checks.some((check) => check.id === "focus-keyword" && check.status === "good"));
  });

  it("flags missing focus keyword", () => {
    const result = analyzeSeoScore({
      title: "Hello",
      content: "<p>Hello world content that is long enough for a basic check here.</p>",
      seo: { seoTitle: "Hello world title here for length", seoDescription: "x".repeat(130) },
    });
    const focus = result.checks.find((check) => check.id === "focus-keyword");
    assert.equal(focus?.status, "bad");
  });
});
