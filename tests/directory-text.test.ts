import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { truncateDirectoryText } from "../lib/stores/directory-text";

describe("truncateDirectoryText", () => {
  it("returns text unchanged when within limit", () => {
    assert.equal(truncateDirectoryText("Mixue", 100), "Mixue");
  });

  it("appends spaced ellipsis when over limit", () => {
    const longName =
      "ครัวเมืองตรัง อาหารใต้ ( Mobile Slip By นางสาว ฐิติวรดา ศรีนคร ) extra text that makes this longer than one hundred characters total";

    const result = truncateDirectoryText(longName, 100);
    assert.ok(result.endsWith(" ..."));
    assert.ok(result.startsWith("ครัวเมืองตรัง"));
    assert.ok(result.length > 100);
  });
});
