import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  INTERNAL_LINKS_EMPTY_MESSAGE,
  SeoInternalLinksCard,
  partitionInternalLinkSuggestions,
} from "@/features/content/seo-optimization/seo-internal-links-card";
import type { InternalLinkSuggestion } from "@/lib/seo-assistant";

function link(
  overrides: Partial<InternalLinkSuggestion> & Pick<InternalLinkSuggestion, "title" | "href" | "source">,
): InternalLinkSuggestion {
  return {
    contentType: overrides.source === "hub" ? "hub" : "post",
    reason: "Same category · SEO Score 88",
    ...overrides,
  };
}

describe("SeoInternalLinksCard", () => {
  it("shows empty state while keeping the card visible", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoInternalLinksCard, { items: [], stale: false }),
    );

    assert.ok(markup.includes('data-testid="seo-internal-links-card"'));
    assert.ok(markup.includes(INTERNAL_LINKS_EMPTY_MESSAGE));
    assert.equal(markup.includes("Suggested Links"), false);
    assert.equal(markup.includes("Explore More"), false);
  });

  it("renders stale notice before suggestions", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoInternalLinksCard, {
        items: [link({ title: "Coffee Guide", href: "/news/coffee", source: "db" })],
        stale: true,
      }),
    );

    const staleIndex = markup.indexOf('data-testid="seo-internal-links-stale-notice"');
    const suggestedIndex = markup.indexOf('data-testid="seo-internal-links-suggested"');
    assert.ok(staleIndex >= 0);
    assert.ok(suggestedIndex >= 0);
    assert.ok(staleIndex < suggestedIndex);
  });

  it("renders db-only suggestions without divider or hub section", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoInternalLinksCard, {
        items: [link({ title: "Coffee Guide", href: "/news/coffee", source: "db" })],
      }),
    );

    assert.ok(markup.includes("Suggested Links"));
    assert.ok(markup.includes("Coffee Guide"));
    assert.equal(markup.includes('data-testid="seo-internal-links-divider"'), false);
    assert.equal(markup.includes("Explore More"), false);
    assert.ok(markup.includes("Copy URL"));
  });

  it("renders divider and explore more when db and hub suggestions exist", () => {
    const markup = renderToStaticMarkup(
      createElement(SeoInternalLinksCard, {
        items: [
          link({ title: "Coffee Guide", href: "/news/coffee", source: "db" }),
          link({
            title: "Explore all news",
            href: "/news",
            source: "hub",
            reason: "Explore all news",
            contentType: "hub",
          }),
        ],
      }),
    );

    assert.ok(markup.includes('data-testid="seo-internal-links-divider"'));
    assert.ok(markup.includes("Explore More"));
    assert.ok(markup.includes("Explore all news"));
  });

  it("renders reason for every suggestion", () => {
    const items = [
      link({
        title: "Coffee Guide",
        href: "/news/coffee",
        source: "db",
        reason: "Same category · SEO Score 88",
      }),
      link({
        title: "Explore all news",
        href: "/news",
        source: "hub",
        reason: "Explore all news",
        contentType: "hub",
      }),
    ];

    const markup = renderToStaticMarkup(createElement(SeoInternalLinksCard, { items }));
    const reasonCount = (markup.match(/data-testid="seo-internal-link-reason"/g) ?? []).length;

    assert.equal(reasonCount, items.length);
    assert.ok(markup.includes("Same category · SEO Score 88"));
    assert.ok(markup.includes("Explore all news"));
  });

  it("partitionInternalLinkSuggestions groups by source field", () => {
    const partitioned = partitionInternalLinkSuggestions([
      link({ title: "A", href: "/a", source: "db" }),
      link({ title: "B", href: "/news", source: "hub", contentType: "hub" }),
    ]);

    assert.equal(partitioned.dbItems.length, 1);
    assert.equal(partitioned.hubItems.length, 1);
    assert.equal(partitioned.dbItems[0]?.source, "db");
    assert.equal(partitioned.hubItems[0]?.source, "hub");
  });
});
