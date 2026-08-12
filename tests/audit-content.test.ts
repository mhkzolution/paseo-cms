import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction } from "@prisma/client";

import {
  pickContentAuditSnapshot,
  resolveContentAction,
  toAuditActor,
} from "@/lib/audit-content";

describe("resolveContentAction", () => {
  const cases = [
    ["DRAFT", "PUBLISHED", AuditAction.PUBLISH],
    ["ARCHIVED", "PUBLISHED", AuditAction.PUBLISH],
    ["PUBLISHED", "DRAFT", AuditAction.UNPUBLISH],
    ["PUBLISHED", "ARCHIVED", AuditAction.UPDATE],
    ["DRAFT", "DRAFT", AuditAction.UPDATE],
    ["PUBLISHED", "PUBLISHED", AuditAction.UPDATE],
  ] as const;

  for (const [before, after, expected] of cases) {
    it(`${before} → ${after} = ${expected}`, () => {
      assert.equal(resolveContentAction(before, after), expected);
    });
  }
});

describe("pickContentAuditSnapshot", () => {
  it("includes only allowlisted fields and flattens seo", () => {
    const publishedAt = new Date("2026-08-12T03:00:00.000Z");
    const snapshot = pickContentAuditSnapshot({
      title: "Title",
      slug: "title",
      excerpt: "Excerpt",
      subtitle: "Subtitle",
      status: "DRAFT",
      publishedAt,
      featuredImage: "/image.jpg",
      content: "SHOULD_NOT_APPEAR",
      tags: ["SHOULD_NOT_APPEAR"],
      categoryId: "SHOULD_NOT_APPEAR",
      seo: {
        seoTitle: "SEO Title",
        seoDescription: "SEO Description",
        focusKeyword: "keyword",
        canonicalUrl: "https://example.com/title",
        noindex: false,
        nofollow: true,
        customJsonLd: { hidden: true },
      },
    });

    assert.deepEqual(snapshot, {
      title: "Title",
      slug: "title",
      excerpt: "Excerpt",
      subtitle: "Subtitle",
      status: "DRAFT",
      publishedAt: "2026-08-12T03:00:00.000Z",
      featuredImage: "/image.jpg",
      seoTitle: "SEO Title",
      seoDescription: "SEO Description",
      focusKeyword: "keyword",
      canonicalUrl: "https://example.com/title",
      noindex: false,
      nofollow: true,
    });
  });

  it("normalizes missing allowlisted values to null", () => {
    assert.deepEqual(pickContentAuditSnapshot({}), {
      title: null,
      slug: null,
      excerpt: null,
      subtitle: null,
      status: null,
      publishedAt: null,
      featuredImage: null,
      seoTitle: null,
      seoDescription: null,
      focusKeyword: null,
      canonicalUrl: null,
      noindex: null,
      nofollow: null,
    });
  });
});

describe("toAuditActor", () => {
  it("maps a session user to an audit actor", () => {
    assert.deepEqual(
      toAuditActor({ id: "user-1", name: null, role: "EDITOR" }),
      { id: "user-1", name: "", role: "EDITOR" },
    );
  });

  it("returns null without a usable user id", () => {
    assert.equal(toAuditActor(null), null);
  });
});
