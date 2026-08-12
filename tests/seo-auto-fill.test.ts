import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyAutoSeoFields,
  extractContentExcerpt,
  extractTitleKeywords,
  inferFocusKeyword,
  truncateNear,
} from "@/lib/seo-auto-fill";

const longExcerpt =
  "Join us for the grand opening celebration at The Paseo Park with food, music, and family activities all weekend long at the mall.";

describe("seo-auto-fill", () => {
  it("fills empty seo fields from content sources", () => {
    const result = applyAutoSeoFields({
      title: "Grand Opening at The Paseo Park Mall Event",
      excerpt: longExcerpt,
      content: "<p>Grand opening weekend starts now at The Paseo.</p>",
      featuredImage: "/uploads/cover.jpg",
      slug: "grand-opening",
      seo: {},
      contentType: "post",
      postKind: "NEWS",
      isCreate: true,
      primaryTagName: "grand opening",
      categoryName: null,
    });

    assert.ok(result.seo.seoTitle);
    assert.ok(result.seo.seoDescription);
    assert.equal(result.seo.focusKeyword, "grand opening");
    assert.equal(result.seo.ogTitle, result.seo.seoTitle);
    assert.equal(result.seo.ogDescription, result.seo.seoDescription);
    assert.equal(result.seo.ogImage, "/uploads/cover.jpg");
    assert.equal(result.seo.twitterTitle, result.seo.ogTitle);
    assert.equal(result.seo.twitterDescription, result.seo.ogDescription);
    assert.equal(result.seo.twitterImage, "/uploads/cover.jpg");
    assert.equal(result.seo.schemaType, "NEWS_ARTICLE");
    assert.ok(result.filledFields.length >= 8);
  });

  it("preserves manual seo title and description", () => {
    const result = applyAutoSeoFields({
      title: "Original Title",
      excerpt: longExcerpt,
      content: "<p>Content body here.</p>",
      featuredImage: "/uploads/cover.jpg",
      slug: "original-title",
      seo: {
        seoTitle: "Manual SEO Title",
        seoDescription: "Manual SEO description that is long enough for search engines to display properly in results.",
        focusKeyword: "manual keyword",
      },
      contentType: "post",
      postKind: "ARTICLE",
      isCreate: true,
      primaryTagName: "ignored tag",
      categoryName: null,
    });

    assert.equal(result.seo.seoTitle, "Manual SEO Title");
    assert.match(result.seo.seoDescription ?? "", /Manual SEO description/);
    assert.equal(result.seo.focusKeyword, "manual keyword");
    assert.equal(result.seo.schemaType, "ARTICLE");
    assert.ok(!result.filledFields.includes("seoTitle"));
    assert.ok(!result.filledFields.includes("seoDescription"));
    assert.ok(!result.filledFields.includes("focusKeyword"));
  });

  it("assigns schema type by content type on create", () => {
    const eventResult = applyAutoSeoFields({
      title: "Weekend Market",
      excerpt: "",
      content: "<p>Event content.</p>",
      featuredImage: "",
      slug: "weekend-market",
      seo: {},
      contentType: "event",
      isCreate: true,
    });

    const promotionResult = applyAutoSeoFields({
      title: "Summer Sale",
      excerpt: "",
      content: "<p>Promotion content.</p>",
      featuredImage: "",
      slug: "summer-sale",
      seo: {},
      contentType: "promotion",
      isCreate: true,
    });

    assert.equal(eventResult.seo.schemaType, "EVENT");
    assert.equal(promotionResult.seo.schemaType, "ARTICLE");
  });

  it("does not change schema type on update", () => {
    const result = applyAutoSeoFields({
      title: "Updated Post",
      excerpt: longExcerpt,
      content: "<p>Updated content.</p>",
      featuredImage: "",
      slug: "updated-post",
      seo: { schemaType: "BLOG_POSTING" },
      contentType: "post",
      postKind: "NEWS",
      isCreate: false,
      primaryTagName: null,
      categoryName: null,
    });

    assert.equal(result.seo.schemaType, "BLOG_POSTING");
    assert.ok(!result.filledFields.includes("schemaType"));
  });

  it("generates description from content when excerpt is short", () => {
    const content =
      "<p>Grand opening weekend starts now at The Paseo with food, music, and family activities for everyone visiting the mall this weekend.</p>";
    const result = applyAutoSeoFields({
      title: "Grand Opening",
      excerpt: "Short excerpt",
      content,
      featuredImage: "",
      slug: "grand-opening",
      seo: {},
      contentType: "post",
      postKind: "NEWS",
      isCreate: true,
    });

    assert.ok((result.seo.seoDescription?.length ?? 0) >= 70);
    assert.ok(result.filledFields.includes("seoDescription"));
  });

  it("cascades og and twitter fields from seo values", () => {
    const result = applyAutoSeoFields({
      title: "Cascade Title Example",
      excerpt: longExcerpt,
      content: "<p>Cascade content.</p>",
      featuredImage: "/uploads/share.jpg",
      slug: "cascade-title",
      seo: {},
      contentType: "post",
      postKind: "ARTICLE",
      isCreate: false,
    });

    assert.equal(result.seo.ogTitle, result.seo.seoTitle);
    assert.equal(result.seo.twitterTitle, result.seo.ogTitle);
    assert.equal(result.seo.twitterImage, "/uploads/share.jpg");
  });

  it("truncates seo title near 60 characters", () => {
    const longTitle =
      "Grand Opening Celebration Weekend at The Paseo Park Mall with Food Music and Family Activities";
    const truncated = truncateNear(longTitle, 60);

    assert.ok(truncated.length <= 60);
    assert.ok(truncated.startsWith("Grand Opening"));
  });

  it("extracts title keywords while skipping stop words", () => {
    assert.equal(extractTitleKeywords("Grand Opening at The Paseo"), "grand opening paseo");
    assert.ok(extractTitleKeywords("เฉลิมฉลองเปิดตัวที่เดอะพาซิโอ").length > 0);
  });

  it("infers focus keyword from tag then title then category", () => {
    assert.equal(
      inferFocusKeyword({
        primaryTagName: "community",
        title: "Grand Opening at The Paseo",
        categoryName: "News",
      }),
      "community",
    );

    assert.equal(
      inferFocusKeyword({
        primaryTagName: null,
        title: "Grand Opening at The Paseo",
        categoryName: "News",
      }),
      "grand opening paseo",
    );

    assert.equal(
      inferFocusKeyword({
        primaryTagName: null,
        title: "at the",
        categoryName: "Events",
      }),
      "Events",
    );
  });

  it("extracts content excerpt within target length", () => {
    const excerpt = extractContentExcerpt(
      "<p>First sentence about the event. Second sentence with more detail for visitors.</p>",
      70,
      160,
    );

    assert.ok(excerpt.length >= 70);
    assert.ok(excerpt.length <= 160);
  });
});
