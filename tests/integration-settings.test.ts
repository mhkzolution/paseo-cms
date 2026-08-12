import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_INTEGRATION_SETTINGS,
  normalizeIntegrationSettingsValues,
} from "@/lib/integration-settings";

describe("integration settings helpers", () => {
  it("exposes empty string defaults for all integration keys", () => {
    assert.deepEqual(DEFAULT_INTEGRATION_SETTINGS, {
      gaMeasurementId: "",
      gtmContainerId: "",
      metaPixelId: "",
      lineOaId: "",
    });
  });

  it("trims values and coerces missing fields to empty strings", () => {
    assert.deepEqual(
      normalizeIntegrationSettingsValues({
        gaMeasurementId: "  G-XXXXXXXXXX  ",
        gtmContainerId: null,
        metaPixelId: undefined,
        lineOaId: " @thepaseo ",
      }),
      {
        gaMeasurementId: "G-XXXXXXXXXX",
        gtmContainerId: "",
        metaPixelId: "",
        lineOaId: "@thepaseo",
      },
    );
  });
});
