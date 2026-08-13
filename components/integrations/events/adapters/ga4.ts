import { canLoadAnalytics } from "@/components/integrations/consent-gates";

import type { DebugAdapterResult } from "../types";
import type { AdapterDispatchArgs, EventAdapter } from "./types";

type GtagFn = (
  command: "event",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") {
    return null;
  }

  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

function toPayloadObject(payload: unknown): Record<string, unknown> | undefined {
  if (payload === undefined || payload === null) {
    return undefined;
  }

  if (typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return { payload };
}

function dispatchGa4(args: AdapterDispatchArgs): DebugAdapterResult {
  const result: DebugAdapterResult = { adapter: "ga4", status: "fired" };

  if (!canLoadAnalytics(args.consent)) {
    return { adapter: "ga4", status: "consent_blocked" };
  }

  if (!args.config.gaMeasurementId) {
    return { adapter: "ga4", status: "provider_missing", reason: "ga4_id_missing" };
  }

  const gtag = getGtag();
  if (!gtag) {
    return { adapter: "ga4", status: "provider_missing", reason: "gtag_missing" };
  }

  try {
    const params = toPayloadObject(args.payload);
    if (params) {
      gtag("event", args.name, params);
    } else {
      gtag("event", args.name);
    }
  } catch (error) {
    return {
      adapter: "ga4",
      status: "provider_missing",
      reason: error instanceof Error ? error.message : "dispatch_failed",
    };
  }

  return result;
}

export const ga4Adapter: EventAdapter = {
  id: "ga4",
  dispatch: dispatchGa4,
};
