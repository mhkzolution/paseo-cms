import { canLoadAnalytics } from "@/components/integrations/consent-gates";

import type { DebugAdapterResult } from "../types";
import type { AdapterDispatchArgs, EventAdapter } from "./types";

function getDataLayer(): unknown[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  return Array.isArray(dataLayer) ? dataLayer : null;
}

function flattenPayload(payload: unknown): Record<string, unknown> {
  if (payload === undefined || payload === null) {
    return {};
  }

  if (typeof payload === "object" && !Array.isArray(payload)) {
    return { ...(payload as Record<string, unknown>) };
  }

  return { payload };
}

function dispatchGtm(args: AdapterDispatchArgs): DebugAdapterResult {
  const result: DebugAdapterResult = { adapter: "gtm", status: "fired" };

  if (!canLoadAnalytics(args.consent)) {
    return { adapter: "gtm", status: "consent_blocked" };
  }

  if (!args.config.gtmContainerId) {
    return { adapter: "gtm", status: "provider_missing", reason: "gtm_id_missing" };
  }

  const dataLayer = getDataLayer();
  if (!dataLayer) {
    return { adapter: "gtm", status: "provider_missing", reason: "dataLayer_missing" };
  }

  try {
    dataLayer.push({
      event: args.name,
      ...flattenPayload(args.payload),
    });
  } catch (error) {
    return {
      adapter: "gtm",
      status: "provider_missing",
      reason: error instanceof Error ? error.message : "dispatch_failed",
    };
  }

  return result;
}

export const gtmAdapter: EventAdapter = {
  id: "gtm",
  dispatch: dispatchGtm,
};
