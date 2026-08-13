import type { EventRuntimeConfig } from "../types";

export function resolveAdapters(
  config: EventRuntimeConfig,
): Array<"gtm" | "ga4" | "meta"> {
  const out: Array<"gtm" | "ga4" | "meta"> = [];

  if (config.gtmContainerId) {
    out.push("gtm");
  } else if (config.gaMeasurementId) {
    out.push("ga4");
  }

  if (config.metaPixelId) {
    out.push("meta");
  }

  return out;
}
