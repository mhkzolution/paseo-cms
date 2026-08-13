export type EventName =
  | "page_view"
  | "phone_click"
  | "email_click"
  | "contact_click"
  | "line_oa_click"
  | "form_submit";

export type PhoneClickPayload = {
  location?: "footer" | "branch_card" | "directory";
};

export type LineOaClickPayload = {
  surface: "floating" | "footer";
};

export type FormSubmitPayload = {
  formId: string;
};

export type EventPayloadMap = {
  phone_click: PhoneClickPayload;
  line_oa_click: LineOaClickPayload;
  form_submit: FormSubmitPayload;
  email_click: undefined;
  contact_click: undefined;
  page_view: undefined;
};

export type DebugAdapterStatus =
  | "fired"
  | "not_mapped"
  | "consent_blocked"
  | "provider_missing"
  | "runtime_disabled";

export type DebugAdapterResult = {
  adapter: "gtm" | "ga4" | "meta";
  status: DebugAdapterStatus;
  reason?: string;
};

export type DebugEvent = {
  name: string;
  timestamp: number;
  payload?: unknown;
  status?: "unknown_event";
  consent?: { analytics: boolean; marketing: boolean };
  adapters?: DebugAdapterResult[];
};

export type EventRuntimeConfig = {
  gtmContainerId: string | null;
  gaMeasurementId: string | null;
  metaPixelId: string | null;
};

export type TrackEventArgs<E extends EventName> =
  EventPayloadMap[E] extends undefined ? [] | [undefined] : [EventPayloadMap[E]];
