import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveAdapters } from "@/components/integrations/events/adapters/resolve-adapters";
import { META_EVENT_MAP } from "@/components/integrations/events/adapters/meta";

describe("resolveAdapters", () => {
  it("prefers GTM and excludes GA4 when both configured", () => {
    assert.deepEqual(
      resolveAdapters({
        gtmContainerId: "GTM-X",
        gaMeasurementId: "G-X",
        metaPixelId: null,
      }),
      ["gtm"],
    );
  });

  it("uses GA4 when GTM absent", () => {
    assert.deepEqual(
      resolveAdapters({
        gtmContainerId: null,
        gaMeasurementId: "G-X",
        metaPixelId: null,
      }),
      ["ga4"],
    );
  });

  it("includes meta independently", () => {
    assert.deepEqual(
      resolveAdapters({
        gtmContainerId: "GTM-X",
        gaMeasurementId: null,
        metaPixelId: "123",
      }),
      ["gtm", "meta"],
    );
  });
});

describe("META_EVENT_MAP", () => {
  it("maps only form_submit to Lead", () => {
    assert.equal(META_EVENT_MAP.form_submit, "Lead");
    assert.equal(Object.keys(META_EVENT_MAP).length, 1);
  });
});
