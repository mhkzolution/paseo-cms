import { isCatalogEvent } from "./catalog";
import { isEventsDebugEnabled, pushDebugEvent } from "./debug-ring";
import type { EventName, TrackEventArgs } from "./types";

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

    // Task 2: dispatch adapters. Task 1: optional debug record with empty adapters when flag on.
    if (isEventsDebugEnabled()) {
      pushDebugEvent({
        name,
        timestamp: Date.now(),
        payload,
        adapters: [],
      });
    }
  } catch {
    // Fail-soft: never throw into UI
  }
}
