import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { isCatalogEvent } from "@/components/integrations/events/catalog";
import {
  clearDebugEvents,
  getDebugEvents,
  pushDebugEvent,
} from "@/components/integrations/events/debug-ring";
import { trackEvent } from "@/components/integrations/events/track-event";

describe("catalog", () => {
  it("accepts snake_case catalog names", () => {
    assert.equal(isCatalogEvent("phone_click"), true);
    assert.equal(isCatalogEvent("form_submit"), true);
    assert.equal(isCatalogEvent("page_view"), true);
  });

  it("rejects unknown names", () => {
    assert.equal(isCatalogEvent("phone_clik"), false);
    assert.equal(isCatalogEvent("PhoneClick"), false);
  });
});

describe("trackEvent unknown", () => {
  beforeEach(() => {
    clearDebugEvents();
    // Force debug on for tests
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (k: string) => (k === "integration-events-debug" ? "1" : null),
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  });

  it("unknown event is no-op with event-level unknown_event and no adapters", () => {
    trackEvent("phone_clik" as "phone_click");
    const events = getDebugEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0]?.status, "unknown_event");
    assert.equal(events[0]?.adapters, undefined);
  });
});

describe("debug ring", () => {
  beforeEach(() => clearDebugEvents());

  it("keeps at most 30 events", () => {
    for (let i = 0; i < 35; i++) {
      pushDebugEvent({ name: `e_${i}`, timestamp: i });
    }
    assert.equal(getDebugEvents().length, 30);
    assert.equal(getDebugEvents()[0]?.name, "e_5");
  });
});
