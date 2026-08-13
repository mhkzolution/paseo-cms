import type { StoredConsent } from "@/components/integrations/consent-types";

import type {
  DebugAdapterResult,
  EventName,
  EventRuntimeConfig,
} from "../types";

export type AdapterDispatchArgs = {
  name: EventName;
  payload: unknown;
  consent: StoredConsent;
  config: EventRuntimeConfig;
};

export type EventAdapter = {
  id: "gtm" | "ga4" | "meta";
  dispatch: (args: AdapterDispatchArgs) => DebugAdapterResult;
};
