export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

/** No stored value → undecided (show banner). */
export type StoredConsent = ConsentPreferences | null;

export const CONSENT_STORAGE_KEY = "integration-consent-v1";
