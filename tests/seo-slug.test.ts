import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generateSlug } from "@/lib/seo";

describe("generateSlug", () => {
  it("preserves Thai combining marks instead of turning them into hyphens", () => {
    assert.equal(
      generateSlug("เดอะพาซิโอ พาร์ค กาญจนาภิเษก"),
      "เดอะพาซิโอ-พาร์ค-กาญจนาภิเษก",
    );
    assert.notEqual(
      generateSlug("เดอะพาซิโอ พาร์ค กาญจนาภิเษก"),
      "เดอะพาซ-โอ-พาร-ค-กาญจนาภ-เษก",
    );
  });

  it("still strips Latin diacritics", () => {
    assert.equal(generateSlug("Café Latte"), "cafe-latte");
  });

  it("collapses whitespace and punctuation to single hyphens", () => {
    assert.equal(generateSlug("  Hello,  World!! "), "hello-world");
  });
});
