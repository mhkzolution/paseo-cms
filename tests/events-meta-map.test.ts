import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { ga4Adapter } from "@/components/integrations/events/adapters/ga4";
import { gtmAdapter } from "@/components/integrations/events/adapters/gtm";
import {
  META_EVENT_MAP,
  metaAdapter,
} from "@/components/integrations/events/adapters/meta";

const fullConsent = {
  analytics: true,
  marketing: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const analyticsOnlyConsent = {
  analytics: true,
  marketing: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const marketingOnlyConsent = {
  analytics: false,
  marketing: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const baseConfig = {
  gtmContainerId: "GTM-TEST",
  gaMeasurementId: "G-TEST",
  metaPixelId: "META-TEST",
};

describe("metaAdapter", () => {
  afterEach(() => {
    delete (globalThis as { fbq?: unknown }).fbq;
    delete (globalThis as { window?: unknown }).window;
  });

  function stubBrowserWindow() {
    (globalThis as { window: typeof globalThis }).window = globalThis;
  }

  it("maps only form_submit to Lead", () => {
    assert.equal(META_EVENT_MAP.form_submit, "Lead");
    assert.equal(Object.keys(META_EVENT_MAP).length, 1);
  });

  it("returns not_mapped for phone_click before consent checks", () => {
    const result = metaAdapter.dispatch({
      name: "phone_click",
      payload: { location: "footer" },
      consent: null,
      config: baseConfig,
    });

    assert.equal(result.status, "not_mapped");
    assert.equal(result.adapter, "meta");
  });

  it("returns not_mapped for line_oa_click", () => {
    const result = metaAdapter.dispatch({
      name: "line_oa_click",
      payload: { surface: "floating" },
      consent: fullConsent,
      config: baseConfig,
    });

    assert.equal(result.status, "not_mapped");
  });

  it("returns consent_blocked when marketing consent is off", () => {
    const result = metaAdapter.dispatch({
      name: "form_submit",
      payload: { formId: "leasing" },
      consent: analyticsOnlyConsent,
      config: baseConfig,
    });

    assert.equal(result.status, "consent_blocked");
  });

  it("fires Lead when marketing consent is on and fbq is available", () => {
    stubBrowserWindow();
    let trackedEvent: string | undefined;

    (globalThis as { fbq?: (command: string, eventName: string) => void }).fbq = (
      command,
      eventName,
    ) => {
      assert.equal(command, "track");
      trackedEvent = eventName;
    };

    const result = metaAdapter.dispatch({
      name: "form_submit",
      payload: { formId: "leasing" },
      consent: fullConsent,
      config: baseConfig,
    });

    assert.equal(result.status, "fired");
    assert.equal(trackedEvent, "Lead");
  });

  it("returns provider_missing when fbq is unavailable", () => {
    const result = metaAdapter.dispatch({
      name: "form_submit",
      payload: { formId: "leasing" },
      consent: marketingOnlyConsent,
      config: baseConfig,
    });

    assert.equal(result.status, "provider_missing");
  });
});

describe("analytics adapters consent", () => {
  afterEach(() => {
    delete (globalThis as { dataLayer?: unknown[] }).dataLayer;
    delete (globalThis as { gtag?: unknown }).gtag;
    delete (globalThis as { window?: unknown }).window;
  });

  function stubBrowserWindow() {
    (globalThis as { window: typeof globalThis }).window = globalThis;
  }

  it("gtm returns consent_blocked when analytics consent is off", () => {
    const result = gtmAdapter.dispatch({
      name: "phone_click",
      payload: { location: "footer" },
      consent: marketingOnlyConsent,
      config: { ...baseConfig, gaMeasurementId: null },
    });

    assert.equal(result.status, "consent_blocked");
    assert.equal(result.adapter, "gtm");
  });

  it("ga4 returns consent_blocked when analytics consent is off", () => {
    const result = ga4Adapter.dispatch({
      name: "phone_click",
      payload: { location: "footer" },
      consent: null,
      config: { ...baseConfig, gtmContainerId: null },
    });

    assert.equal(result.status, "consent_blocked");
    assert.equal(result.adapter, "ga4");
  });

  it("gtm fires via dataLayer when analytics consent is on", () => {
    stubBrowserWindow();
    const pushes: unknown[] = [];
    (globalThis as { dataLayer?: unknown[] }).dataLayer = [];
    (globalThis as { dataLayer?: unknown[] }).dataLayer!.push = ((
      entry: unknown,
    ) => {
      pushes.push(entry);
      return pushes.length;
    }) as typeof Array.prototype.push;

    const result = gtmAdapter.dispatch({
      name: "line_oa_click",
      payload: { surface: "footer" },
      consent: fullConsent,
      config: { ...baseConfig, gaMeasurementId: null },
    });

    assert.equal(result.status, "fired");
    assert.deepEqual(pushes[0], {
      event: "line_oa_click",
      surface: "footer",
    });
  });

  it("ga4 fires via gtag when analytics consent is on", () => {
    stubBrowserWindow();
    let captured: { name?: string; params?: Record<string, unknown> } = {};

    (globalThis as {
      gtag?: (
        command: string,
        eventName: string,
        params?: Record<string, unknown>,
      ) => void;
    }).gtag = (command, eventName, params) => {
      assert.equal(command, "event");
      captured = { name: eventName, params };
    };

    const result = ga4Adapter.dispatch({
      name: "phone_click",
      payload: { location: "branch_card" },
      consent: analyticsOnlyConsent,
      config: { ...baseConfig, gtmContainerId: null },
    });

    assert.equal(result.status, "fired");
    assert.equal(captured.name, "phone_click");
    assert.deepEqual(captured.params, { location: "branch_card" });
  });
});
