import type { DebugEvent } from "./types";

export const DEBUG_FLAG_KEY = "integration-events-debug";

const MAX_DEBUG_EVENTS = 30;

const ring: DebugEvent[] = [];

export function isEventsDebugEnabled(): boolean {
  try {
    if (typeof localStorage === "undefined") {
      return false;
    }
    return localStorage.getItem(DEBUG_FLAG_KEY) === "1";
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
