import type { EventName } from "./types";

export const EVENT_NAMES = [
  "page_view",
  "phone_click",
  "email_click",
  "contact_click",
  "line_oa_click",
  "form_submit",
] as const satisfies readonly EventName[];

const EVENT_NAME_SET = new Set<string>(EVENT_NAMES);

export function isCatalogEvent(name: string): name is EventName {
  return EVENT_NAME_SET.has(name);
}
