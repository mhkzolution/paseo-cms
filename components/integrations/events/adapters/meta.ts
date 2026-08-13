import { canLoadMarketing } from "@/components/integrations/consent-gates";

import type { EventName } from "../types";
import type { DebugAdapterResult } from "../types";
import type { AdapterDispatchArgs, EventAdapter } from "./types";

export const META_EVENT_MAP = {
  form_submit: "Lead",
} as const;

type MetaEventName = keyof typeof META_EVENT_MAP;

function isMetaMappedEvent(name: EventName): name is MetaEventName {
  return name in META_EVENT_MAP;
}

type FbqFn = (command: "track", eventName: string) => void;

function getFbq(): FbqFn | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fbq = (window as Window & { fbq?: FbqFn }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

function dispatchMeta(args: AdapterDispatchArgs): DebugAdapterResult {
  if (!isMetaMappedEvent(args.name)) {
    return { adapter: "meta", status: "not_mapped" };
  }

  if (!canLoadMarketing(args.consent)) {
    return { adapter: "meta", status: "consent_blocked" };
  }

  if (!args.config.metaPixelId) {
    return { adapter: "meta", status: "provider_missing", reason: "meta_id_missing" };
  }

  const fbq = getFbq();
  if (!fbq) {
    return { adapter: "meta", status: "provider_missing", reason: "fbq_missing" };
  }

  const metaEvent = META_EVENT_MAP[args.name];

  try {
    fbq("track", metaEvent);
  } catch (error) {
    return {
      adapter: "meta",
      status: "provider_missing",
      reason: error instanceof Error ? error.message : "dispatch_failed",
    };
  }

  return { adapter: "meta", status: "fired" };
}

export const metaAdapter: EventAdapter = {
  id: "meta",
  dispatch: dispatchMeta,
};
