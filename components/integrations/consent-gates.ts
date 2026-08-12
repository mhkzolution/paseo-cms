import type { StoredConsent } from "@/components/integrations/consent-types";

export function canLoadAnalytics(consent: StoredConsent): boolean {
  return consent?.analytics === true;
}

export function canLoadMarketing(consent: StoredConsent): boolean {
  return consent?.marketing === true;
}
