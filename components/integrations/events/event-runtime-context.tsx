"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

import { useConsent } from "@/components/integrations/consent-provider";
import type { StoredConsent } from "@/components/integrations/consent-types";

import type { EventRuntimeConfig } from "./types";

type EventRuntimeSnapshot = {
  config: EventRuntimeConfig;
  consent: StoredConsent;
};

let runtimeRef: EventRuntimeSnapshot | null = null;

const EventRuntimeContext = createContext<EventRuntimeSnapshot | null>(null);

export function EventRuntimeProvider({
  config,
  children,
}: {
  config: EventRuntimeConfig;
  children: ReactNode;
}) {
  const { consent } = useConsent();

  // Same-tick clicks before effect runs still see current consent/config.
  runtimeRef = { config, consent };

  useEffect(() => {
    runtimeRef = { config, consent };
    return () => {
      runtimeRef = null;
    };
  }, [config, consent]);

  return (
    <EventRuntimeContext.Provider value={{ config, consent }}>
      {children}
    </EventRuntimeContext.Provider>
  );
}

export function useEventRuntime(): {
  config: EventRuntimeConfig;
  getConsent: () => StoredConsent;
} {
  const runtime = useContext(EventRuntimeContext);

  if (!runtime) {
    throw new Error("useEventRuntime must be used within EventRuntimeProvider");
  }

  return {
    config: runtime.config,
    getConsent: () => runtime.consent,
  };
}

export function getEventRuntime(): EventRuntimeSnapshot | null {
  return runtimeRef;
}

/** Test-only helper to simulate mounted runtime without React. */
export function setEventRuntimeForTests(runtime: EventRuntimeSnapshot | null): void {
  runtimeRef = runtime;
}
