"use client";

import { useEffect, useState } from "react";

import {
  getDebugEvents,
  isEventsDebugEnabled,
} from "@/components/integrations/events/debug-ring";
import type { DebugEvent } from "@/components/integrations/events/types";

const POLL_MS = 500;

function formatEventSummary(event: DebugEvent): string {
  if (event.status === "unknown_event") {
    return "unknown_event";
  }

  if (!event.adapters?.length) {
    return "—";
  }

  return event.adapters
    .map((adapter) => `${adapter.adapter}:${adapter.status}`)
    .join(", ");
}

export function EventsDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([]);

  useEffect(() => {
    const refresh = () => {
      setEnabled(isEventsDebugEnabled());
      setEvents(getDebugEvents());
    };

    refresh();
    const interval = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(interval);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <aside
      aria-label="Integration events debug"
      className="fixed bottom-4 left-4 z-[60] max-h-64 w-80 overflow-y-auto rounded-md border border-border bg-white/95 p-3 text-xs shadow-lg backdrop-blur-sm"
    >
      <p className="mb-2 font-semibold text-foreground">Events debug</p>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="space-y-2">
          {[...events].reverse().map((event, index) => (
            <li
              key={`${event.timestamp}-${event.name}-${index}`}
              className="rounded border border-border/60 px-2 py-1"
            >
              <div className="font-medium">{event.name}</div>
              <div className="text-muted-foreground">{formatEventSummary(event)}</div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
