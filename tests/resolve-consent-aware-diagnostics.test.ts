import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SIMULATED_CONSENT,
  REASON_LABELS,
  resolveConsentAwareDiagnostics,
} from "@/components/integrations/resolve-consent-aware-diagnostics";
import type { IntegrationSettings } from "@/lib/integration-settings";

const empty: IntegrationSettings = {
  gaMeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  lineOaId: "",
};

function byChannel(
  d: ReturnType<typeof resolveConsentAwareDiagnostics>,
  channel: string,
) {
  const row = d.channels.find((c) => c.channel === channel);
  assert.ok(row, `missing ${channel}`);
  return row!;
}

describe("resolveConsentAwareDiagnostics", () => {
  it("defaults helper is both ON", () => {
    assert.deepEqual(DEFAULT_SIMULATED_CONSENT, {
      analytics: true,
      marketing: true,
    });
  });

  it("empty settings → all not_configured", () => {
    const d = resolveConsentAwareDiagnostics(empty, DEFAULT_SIMULATED_CONSENT);
    for (const ch of d.channels) {
      assert.equal(ch.simulationResult, "not_configured");
      assert.equal(ch.reasonCode, "not_configured");
    }
  });

  it("both ON: GTM+Meta+LINE would_fire; GA4 suppressed when GTM set", () => {
    const d = resolveConsentAwareDiagnostics(
      {
        ...empty,
        gtmContainerId: "GTM-TEST",
        gaMeasurementId: "G-TEST",
        metaPixelId: "123",
        lineOaId: "@paseo",
      },
      { analytics: true, marketing: true },
    );
    assert.equal(byChannel(d, "gtm").reasonCode, "would_fire");
    assert.equal(byChannel(d, "ga4").reasonCode, "suppressed_by_gtm");
    assert.equal(byChannel(d, "ga4").simulationResult, "suppressed");
    assert.equal(byChannel(d, "meta").reasonCode, "would_fire");
    assert.equal(byChannel(d, "lineOa").reasonCode, "outside_consent");
  });

  it("analytics OFF blocks GTM/GA4; Meta can still would_fire", () => {
    const d = resolveConsentAwareDiagnostics(
      {
        ...empty,
        gtmContainerId: "GTM-TEST",
        metaPixelId: "123",
      },
      { analytics: false, marketing: true },
    );
    assert.equal(byChannel(d, "gtm").reasonCode, "consent_blocked");
    assert.equal(byChannel(d, "meta").reasonCode, "would_fire");
  });

  it("marketing OFF blocks Meta; GTM can still would_fire", () => {
    const d = resolveConsentAwareDiagnostics(
      {
        ...empty,
        gtmContainerId: "GTM-TEST",
        metaPixelId: "123",
      },
      { analytics: true, marketing: false },
    );
    assert.equal(byChannel(d, "gtm").reasonCode, "would_fire");
    assert.equal(byChannel(d, "meta").reasonCode, "consent_blocked");
  });

  it("GA4 alone would_fire when analytics ON and no GTM", () => {
    const d = resolveConsentAwareDiagnostics(
      { ...empty, gaMeasurementId: "G-ONLY" },
      { analytics: true, marketing: true },
    );
    assert.equal(byChannel(d, "ga4").reasonCode, "would_fire");
  });

  it("Meta includes form_submit Lead capability note", () => {
    const d = resolveConsentAwareDiagnostics(
      { ...empty, metaPixelId: "123" },
      DEFAULT_SIMULATED_CONSENT,
    );
    const meta = byChannel(d, "meta");
    assert.ok(meta.capabilityNotes?.some((n) => /form_submit.*Lead/i.test(n)));
  });

  it("REASON_LABELS covers every reason code", () => {
    for (const code of [
      "would_fire",
      "consent_blocked",
      "suppressed_by_gtm",
      "not_configured",
      "outside_consent",
    ] as const) {
      assert.equal(typeof REASON_LABELS[code], "string");
      assert.ok(REASON_LABELS[code].length > 0);
    }
  });
});
