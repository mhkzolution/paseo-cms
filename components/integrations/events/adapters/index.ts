import { ga4Adapter } from "./ga4";
import { gtmAdapter } from "./gtm";
import { metaAdapter } from "./meta";

export const ADAPTERS = {
  gtm: gtmAdapter,
  ga4: ga4Adapter,
  meta: metaAdapter,
} as const;

export type AdapterId = keyof typeof ADAPTERS;
