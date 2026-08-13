import { ADAPTERS } from "./adapters";
import { resolveAdapters } from "./adapters/resolve-adapters";
import { isCatalogEvent } from "./catalog";
import { isEventsDebugEnabled, pushDebugEvent } from "./debug-ring";
import { getEventRuntime } from "./event-runtime-context";
import type { StoredConsent } from "@/components/integrations/consent-types";

import type { EventName, TrackEventArgs } from "./types";

function consentSnapshot(consent: StoredConsent) {
  if (!consent) {
    return undefined;
  }

  return {
    analytics: consent.analytics,
    marketing: consent.marketing,
  };
}

export function trackEvent<E extends EventName>(
  name: E,
  ...args: TrackEventArgs<E>
): void;
export function trackEvent(name: string, payload?: unknown): void;
export function trackEvent(name: string, payload?: unknown): void {
  try {
    if (!isCatalogEvent(name)) {
      if (isEventsDebugEnabled()) {
        pushDebugEvent({
          name,
          timestamp: Date.now(),
          payload,
          status: "unknown_event",
        });
      }
      return;
    }

    const runtime = getEventRuntime();
    const config = runtime?.config ?? {
      gtmContainerId: null,
      gaMeasurementId: null,
      metaPixelId: null,
    };
    const consent = runtime?.consent ?? null;

    const adapterIds = resolveAdapters(config);
    const adapterResults = adapterIds.map((adapterId) =>
      ADAPTERS[adapterId].dispatch({
        name,
        payload,
        consent,
        config,
      }),
    );

    if (isEventsDebugEnabled()) {
      pushDebugEvent({
        name,
        timestamp: Date.now(),
        payload,
        consent: consentSnapshot(consent),
        adapters: adapterResults,
      });
    }
  } catch {
    // Fail-soft: never throw into UI
  }
}
