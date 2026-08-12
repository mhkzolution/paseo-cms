import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseStoredConsent } from "@/components/integrations/consent-storage";

describe("parseStoredConsent", () => {
  it("returns null for missing / empty", () => {
    assert.equal(parseStoredConsent(null), null);
    assert.equal(parseStoredConsent(""), null);
  });

  it("returns null for corrupt JSON without throwing", () => {
    assert.equal(parseStoredConsent("{broken json"), null);
    assert.equal(parseStoredConsent("not-json"), null);
    assert.equal(parseStoredConsent("[]"), null);
  });

  it("returns null for invalid shape", () => {
    assert.equal(parseStoredConsent(JSON.stringify({ analytics: "yes" })), null);
    assert.equal(parseStoredConsent(JSON.stringify({ marketing: true })), null);
  });

  it("parses decided Necessary-only", () => {
    const raw = JSON.stringify({
      analytics: false,
      marketing: false,
      updatedAt: "2026-08-12T10:00:00.000Z",
    });
    const parsed = parseStoredConsent(raw);
    assert.ok(parsed);
    assert.equal(parsed!.analytics, false);
    assert.equal(parsed!.marketing, false);
  });

  it("parses accept-all", () => {
    const raw = JSON.stringify({
      analytics: true,
      marketing: true,
      updatedAt: "2026-08-12T10:00:00.000Z",
    });
    const parsed = parseStoredConsent(raw);
    assert.deepEqual(
      { analytics: parsed!.analytics, marketing: parsed!.marketing },
      { analytics: true, marketing: true },
    );
  });
});
