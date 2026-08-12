import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { canLoadTracking } from "@/components/integrations/consent";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import type { IntegrationSettings } from "@/lib/integration-settings";

const empty: IntegrationSettings = {
  gaMeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  lineOaId: "",
};

describe("canLoadTracking", () => {
  it("is deprecated and not used for runtime gating", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/integrations/consent.ts"),
      "utf8",
    );
    assert.match(source, /@deprecated/);
    assert.equal(canLoadTracking(), true);
  });
});

describe("resolveTrackingConfiguration", () => {
  it("returns all null when empty", () => {
    assert.deepEqual(resolveTrackingConfiguration(empty), {
      gtmContainerId: null,
      gaMeasurementId: null,
      metaPixelId: null,
    });
  });

  it("injects GA4 when only gaMeasurementId is set", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({ ...empty, gaMeasurementId: "G-TEST123" }),
      { gtmContainerId: null, gaMeasurementId: "G-TEST123", metaPixelId: null },
    );
  });

  it("injects GTM when only gtmContainerId is set", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({ ...empty, gtmContainerId: "GTM-TEST" }),
      { gtmContainerId: "GTM-TEST", gaMeasurementId: null, metaPixelId: null },
    );
  });

  it("prefers GTM over direct GA4 when both are set", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gtmContainerId: "GTM-TEST",
        gaMeasurementId: "G-TEST123",
      }),
      { gtmContainerId: "GTM-TEST", gaMeasurementId: null, metaPixelId: null },
    );
  });

  it("injects Meta independently", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({ ...empty, metaPixelId: "123456789" }),
      { gtmContainerId: null, gaMeasurementId: null, metaPixelId: "123456789" },
    );
  });

  it("injects GTM and Meta together", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gtmContainerId: "GTM-TEST",
        gaMeasurementId: "G-TEST123",
        metaPixelId: "123456789",
      }),
      { gtmContainerId: "GTM-TEST", gaMeasurementId: null, metaPixelId: "123456789" },
    );
  });

  it("treats whitespace-only IDs as empty", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gtmContainerId: "  ",
        gaMeasurementId: "\t",
        metaPixelId: "   ",
      }),
      { gtmContainerId: null, gaMeasurementId: null, metaPixelId: null },
    );
  });

  it("trims IDs before evaluation", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gaMeasurementId: "  G-TRIM  ",
        metaPixelId: " 999 ",
      }),
      { gtmContainerId: null, gaMeasurementId: "G-TRIM", metaPixelId: "999" },
    );
  });
});
