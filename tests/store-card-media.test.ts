import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getStoreInitials, resolveStoreCardMedia, STREET_MARKET_FALLBACK_LOGO } from "../lib/stores/store-card-media";

describe("resolveStoreCardMedia", () => {
  it("prefers logo mode when logo exists", () => {
    const result = resolveStoreCardMedia({
      name: "Dunkin Donuts",
      logo: "/logo.png",
      cover: "/cover.jpg",
      category: { name: "อาหาร", slug: "food", color: "#f97316" },
    });

    assert.equal(result.mode, "logo");
    assert.equal(result.src, "/logo.png");
  });

  it("uses cover mode when only cover exists", () => {
    const result = resolveStoreCardMedia({
      name: "Promo Store",
      logo: null,
      cover: "/hero.jpg",
    });

    assert.equal(result.mode, "cover");
    assert.equal(result.src, "/hero.jpg");
  });

  it("uses fallback mode when no media exists", () => {
    const result = resolveStoreCardMedia({
      name: "Cher Clinic",
      logo: null,
      cover: null,
      category: { name: "คลินิก", slug: "clinic", color: "#f59e0b" },
    });

    assert.equal(result.mode, "fallback");
    assert.equal(result.initials, "CC");
    assert.equal(result.accentColor, "#f59e0b");
  });

  it("uses street-market logo when category is street-market", () => {
    const result = resolveStoreCardMedia({
      name: "ร้านตลาด",
      logo: null,
      cover: null,
      category: { name: "ตลาด", slug: "street-market", color: "#14b8a6" },
      branch: { slug: "mall", image: "/branch.jpg" },
    });

    assert.equal(result.mode, "logo");
    assert.equal(result.src, STREET_MARKET_FALLBACK_LOGO);
  });

  it("uses branch image when no store media exists", () => {
    const result = resolveStoreCardMedia({
      name: "General Store",
      logo: null,
      cover: null,
      category: { name: "อาหาร", slug: "food", color: "#f97316" },
      branch: { slug: "mall", image: "/uploads/branch-mall.jpg" },
    });

    assert.equal(result.mode, "logo");
    assert.equal(result.src, "/uploads/branch-mall.jpg");
  });
});

describe("getStoreInitials", () => {
  it("uses first letters of first two words", () => {
    assert.equal(getStoreInitials("Blackyard Rost&Brew"), "BR");
  });

  it("uses first two characters for single-word names", () => {
    assert.equal(getStoreInitials("Mixue"), "MI");
  });
});
