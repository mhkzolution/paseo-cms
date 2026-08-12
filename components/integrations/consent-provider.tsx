"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  readStoredConsent,
  writeStoredConsent,
} from "@/components/integrations/consent-storage";
import type {
  ConsentPreferences,
  StoredConsent,
} from "@/components/integrations/consent-types";

type ConsentContextValue = {
  consent: StoredConsent;
  isPreferencesOpen: boolean;
  acceptAll: () => void;
  necessaryOnly: () => void;
  saveCustom: (prefs: Pick<ConsentPreferences, "analytics" | "marketing">) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function buildPreferences(
  analytics: boolean,
  marketing: boolean,
): ConsentPreferences {
  return {
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<StoredConsent>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    // V1: start null on SSR/first paint, then hydrate from localStorage (avoids mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client hydration
    setConsent(readStoredConsent());
  }, []);

  const persist = useCallback((prefs: ConsentPreferences) => {
    writeStoredConsent(prefs);
    setConsent(prefs);
    setIsPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist(buildPreferences(true, true));
  }, [persist]);

  const necessaryOnly = useCallback(() => {
    persist(buildPreferences(false, false));
  }, [persist]);

  const saveCustom = useCallback(
    (prefs: Pick<ConsentPreferences, "analytics" | "marketing">) => {
      persist(buildPreferences(prefs.analytics, prefs.marketing));
    },
    [persist],
  );

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      isPreferencesOpen,
      acceptAll,
      necessaryOnly,
      saveCustom,
      openPreferences,
      closePreferences,
    }),
    [
      consent,
      isPreferencesOpen,
      acceptAll,
      necessaryOnly,
      saveCustom,
      openPreferences,
      closePreferences,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }

  return context;
}
