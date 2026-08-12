import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeSlugParam, slugMatchesStored } from "@/lib/slug";

describe("decodeSlugParam", () => {
  it("decodes percent-encoded Thai slugs", () => {
    const thai = "ฉลองวันแม่สุดพิเศษ-กับกลิ่นหอมแทนใจ";
    const encoded = encodeURIComponent(thai);
    assert.equal(decodeSlugParam(encoded), thai);
  });

  it("normalizes already-decoded Thai slugs", () => {
    const thai = "ฉลองวันแม่สุดพิเศษ-กับกลิ่นหอมแทนใจ";
    assert.equal(decodeSlugParam(thai), thai);
  });
});

describe("slugMatchesStored", () => {
  it("matches identical Thai slugs", () => {
    const slug = "ฉลองวันแม่สุดพิเศษ-กับกลิ่นหอมแทนใจ";
    assert.equal(slugMatchesStored(slug, slug), true);
  });

  it("matches decoded request against stored slug", () => {
    const stored = "ฉลองวันแม่สุดพิเศษ-กับกลิ่นหอมแทนใจ";
    const requested = decodeSlugParam(encodeURIComponent(stored));
    assert.equal(slugMatchesStored(stored, requested), true);
  });
});
