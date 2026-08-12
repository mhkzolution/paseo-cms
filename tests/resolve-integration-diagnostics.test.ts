import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveIntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";
import type { IntegrationSettings } from "@/lib/integration-settings";

const empty: IntegrationSettings = {
  gaMeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  lineOaId: "",
};

describe("resolveIntegrationDiagnostics", () => {
  it("marks all channels inactive when empty", () => {
    const d = resolveIntegrationDiagnostics(empty);
    assert.deepEqual(d.runtime, {
      gtm: "inactive",
      ga4: "inactive",
      meta: "inactive",
      lineOa: "inactive",
    });
    assert.equal(d.warnings.length, 0);
  });

  it("marks GTM active and suppresses configured GA4", () => {
    const d = resolveIntegrationDiagnostics({
      ...empty,
      gtmContainerId: "GTM-TEST",
      gaMeasurementId: "G-TEST123",
    });
    assert.equal(d.runtime.gtm, "active");
    assert.equal(d.runtime.ga4, "suppressed");
    assert.equal(d.configured.gaMeasurementId, "G-TEST123");
    assert.equal(d.configured.gtmContainerId, "GTM-TEST");
  });

  it("marks GA4 active when only measurement id is set", () => {
    const d = resolveIntegrationDiagnostics({
      ...empty,
      gaMeasurementId: "G-ONLY",
    });
    assert.equal(d.runtime.ga4, "active");
    assert.equal(d.runtime.gtm, "inactive");
  });

  it("marks Meta and LINE independently active", () => {
    const d = resolveIntegrationDiagnostics({
      ...empty,
      metaPixelId: "123456789",
      lineOaId: "@thepaseo",
    });
    assert.equal(d.runtime.meta, "active");
    assert.equal(d.runtime.lineOa, "active");
    assert.equal(d.configured.lineOaId, "@thepaseo");
    assert.equal(d.resolved.lineOaUrl, "https://line.me/R/ti/p/@thepaseo");
  });

  it("emits format warnings with stable codes", () => {
    const d = resolveIntegrationDiagnostics({
      gaMeasurementId: "TEST123",
      gtmContainerId: "ABC123",
      metaPixelId: "abcde",
      lineOaId: "https://line.me/R/ti/p/@thepaseo",
    });
    const codes = d.warnings.map((w) => w.code).sort();
    assert.deepEqual(codes, [
      "GA4_FORMAT",
      "GTM_FORMAT",
      "LINE_OA_EXPECTED_ID",
      "META_FORMAT",
    ]);
    // LINE still active as prediction (identifier-only runtime)
    assert.equal(d.runtime.lineOa, "active");
  });

  it("does not warn on empty fields", () => {
    assert.equal(resolveIntegrationDiagnostics(empty).warnings.length, 0);
  });
});
