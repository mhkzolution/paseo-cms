import {
  CONSENT_STORAGE_KEY,
  type ConsentPreferences,
  type StoredConsent,
} from "@/components/integrations/consent-types";

function isConsentPreferences(value: unknown): value is ConsentPreferences {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.analytics === "boolean" &&
    typeof record.marketing === "boolean" &&
    typeof record.updatedAt === "string"
  );
}

/** Pure parser — safe in Node tests; corrupt/invalid → null, never throws. */
export function parseStoredConsent(raw: string | null): StoredConsent {
  if (raw === null || raw === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isConsentPreferences(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readStoredConsent(): StoredConsent {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredConsent(prefs: ConsentPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Fail-soft: storage quota / privacy mode — caller already has in-memory state.
  }
}
