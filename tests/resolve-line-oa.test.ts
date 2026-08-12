import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";

describe("resolveLineOaUrl", () => {
  it("returns null for empty / whitespace / nullish", () => {
    assert.equal(resolveLineOaUrl(""), null);
    assert.equal(resolveLineOaUrl("   "), null);
    assert.equal(resolveLineOaUrl(null), null);
    assert.equal(resolveLineOaUrl(undefined), null);
  });

  it("builds line.me deep link from @id", () => {
    assert.equal(
      resolveLineOaUrl("@thepaseo"),
      "https://line.me/R/ti/p/@thepaseo",
    );
  });

  it("prepends @ when missing", () => {
    assert.equal(
      resolveLineOaUrl("thepaseo"),
      "https://line.me/R/ti/p/@thepaseo",
    );
  });

  it("trims and strips internal whitespace", () => {
    assert.equal(
      resolveLineOaUrl(" @thepaseo "),
      "https://line.me/R/ti/p/@thepaseo",
    );
  });

  it("does not parse pasted LINE URLs (identifier-only contract)", () => {
    const pasted = "https://line.me/R/ti/p/@thepaseo";
    assert.equal(
      resolveLineOaUrl(pasted),
      `https://line.me/R/ti/p/@${pasted}`,
    );
  });
});
