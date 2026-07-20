import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getLocalizedName } from "../lib/i18n/localized-name";

describe("getLocalizedName", () => {
  it("prefers nameEn for English locale", () => {
    assert.equal(
      getLocalizedName({ name: "Fallback", nameTh: "ไทย", nameEn: "English" }, "en"),
      "English",
    );
  });

  it("falls back to nameTh then name when English is missing", () => {
    assert.equal(getLocalizedName({ name: "Fallback", nameTh: "ไทย", nameEn: "" }, "en"), "ไทย");
    assert.equal(getLocalizedName({ name: "Fallback", nameTh: "", nameEn: null }, "en"), "Fallback");
  });

  it("prefers nameTh for Thai locale", () => {
    assert.equal(
      getLocalizedName({ name: "Fallback", nameTh: "ไทย", nameEn: "English" }, "th"),
      "ไทย",
    );
  });

  it("falls back to name then nameEn when Thai is missing", () => {
    assert.equal(getLocalizedName({ name: "Fallback", nameTh: "", nameEn: "English" }, "th"), "Fallback");
    assert.equal(getLocalizedName({ name: "", nameTh: null, nameEn: "English" }, "th"), "English");
  });
});
