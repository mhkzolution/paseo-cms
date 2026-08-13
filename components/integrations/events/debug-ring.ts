import type { DebugEvent } from "./types";

export const DEBUG_FLAG_KEY = "integration-events-debug";

const MAX_DEBUG_EVENTS = 30;

const ring: DebugEvent[] = [];

function hasEventsDebugQueryFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("eventsDebug") === "1";
}

export function isEventsDebugEnabled(): boolean {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(DEBUG_FLAG_KEY) === "1") {
      return true;
    }

    if (typeof window !== "undefined" && hasEventsDebugQueryFlag()) {
      // Persist query flag so debug stays on after navigation without ?eventsDebug=1.
      try {
        localStorage.setItem(DEBUG_FLAG_KEY, "1");
      } catch {
        // Ignore quota / private-mode write failures; query flag still enables this session.
      }
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function pushDebugEvent(entry: DebugEvent): void {
  ring.push(entry);
  if (ring.length > MAX_DEBUG_EVENTS) {
    ring.splice(0, ring.length - MAX_DEBUG_EVENTS);
  }
}

export function getDebugEvents(): DebugEvent[] {
  return [...ring];
}

export function clearDebugEvents(): void {
  ring.length = 0;
}
