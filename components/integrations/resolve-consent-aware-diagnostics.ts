import { resolveIntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";
import type { IntegrationSettings } from "@/lib/integration-settings";

export type SimulatedConsent = {
  analytics: boolean;
  marketing: boolean;
};

export type ConsentAwareReasonCode =
  | "would_fire"
  | "consent_blocked"
  | "suppressed_by_gtm"
  | "not_configured"
  | "outside_consent";

export type ConsentAwareSimulationResult =
  | "would_fire"
  | "blocked"
  | "suppressed"
  | "not_configured";

export type ConsentAwareChannel =
  | "gtm"
  | "ga4"
  | "meta"
  | "lineOa";

export type ConsentAwareChannelResult = {
  channel: ConsentAwareChannel;
  configured: boolean;
  runtimeStatus: "active" | "inactive" | "suppressed";
  requiresConsent: "analytics" | "marketing" | "none";
  simulationResult: ConsentAwareSimulationResult;
  reasonCode: ConsentAwareReasonCode;
  capabilityNotes?: string[];
};

export type ConsentAwareDiagnostics = {
  simulation: SimulatedConsent;
  channels: ConsentAwareChannelResult[];
};

export const DEFAULT_SIMULATED_CONSENT: SimulatedConsent = {
  analytics: true,
  marketing: true,
};

export const REASON_LABELS: Record<ConsentAwareReasonCode, string> = {
  would_fire: "Would fire under simulated consent",
  consent_blocked: "Blocked by simulated consent",
  suppressed_by_gtm: "Suppressed because GTM is active",
  not_configured: "Not configured",
  outside_consent: "Outside consent (LINE OA surfaces)",
};

const ANALYTICS_CONSENT_NOTE = "Public custom events use analytics consent";
const META_CAPABILITY_NOTE = "Supported events: form_submit → Lead";
const LINE_CAPABILITY_NOTE =
  "line_oa_click → Analytics only; no Meta mapping";

type ChannelConfig = {
  channel: ConsentAwareChannel;
  configured: boolean;
  runtimeStatus: "active" | "inactive" | "suppressed";
  requiresConsent: "analytics" | "marketing" | "none";
  capabilityNotes?: string[];
};

function evaluateChannel(
  config: ChannelConfig,
  simulation: SimulatedConsent,
): ConsentAwareChannelResult {
  const {
    channel,
    configured,
    runtimeStatus,
    requiresConsent,
    capabilityNotes,
  } = config;

  if (!configured) {
    return {
      channel,
      configured,
      runtimeStatus,
      requiresConsent,
      simulationResult: "not_configured",
      reasonCode: "not_configured",
      capabilityNotes,
    };
  }

  if (channel === "ga4" && runtimeStatus === "suppressed") {
    return {
      channel,
      configured,
      runtimeStatus,
      requiresConsent,
      simulationResult: "suppressed",
      reasonCode: "suppressed_by_gtm",
      capabilityNotes,
    };
  }

  if (channel === "lineOa") {
    return {
      channel,
      configured,
      runtimeStatus,
      requiresConsent,
      simulationResult: "would_fire",
      reasonCode: "outside_consent",
      capabilityNotes,
    };
  }

  const consentGranted =
    requiresConsent === "analytics"
      ? simulation.analytics
      : requiresConsent === "marketing"
        ? simulation.marketing
        : true;

  if (!consentGranted) {
    return {
      channel,
      configured,
      runtimeStatus,
      requiresConsent,
      simulationResult: "blocked",
      reasonCode: "consent_blocked",
      capabilityNotes,
    };
  }

  return {
    channel,
    configured,
    runtimeStatus,
    requiresConsent,
    simulationResult: "would_fire",
    reasonCode: "would_fire",
    capabilityNotes,
  };
}

export function resolveConsentAwareDiagnostics(
  settings: IntegrationSettings,
  simulation: SimulatedConsent,
): ConsentAwareDiagnostics {
  const diagnostics = resolveIntegrationDiagnostics(settings);

  const channels: ConsentAwareChannelResult[] = [
    evaluateChannel(
      {
        channel: "gtm",
        configured: diagnostics.configured.gtmContainerId !== null,
        runtimeStatus: diagnostics.runtime.gtm,
        requiresConsent: "analytics",
        capabilityNotes: [ANALYTICS_CONSENT_NOTE],
      },
      simulation,
    ),
    evaluateChannel(
      {
        channel: "ga4",
        configured: diagnostics.configured.gaMeasurementId !== null,
        runtimeStatus: diagnostics.runtime.ga4,
        requiresConsent: "analytics",
        capabilityNotes: [ANALYTICS_CONSENT_NOTE],
      },
      simulation,
    ),
    evaluateChannel(
      {
        channel: "meta",
        configured: diagnostics.configured.metaPixelId !== null,
        runtimeStatus: diagnostics.runtime.meta,
        requiresConsent: "marketing",
        capabilityNotes: [META_CAPABILITY_NOTE],
      },
      simulation,
    ),
    evaluateChannel(
      {
        channel: "lineOa",
        configured: diagnostics.configured.lineOaId !== null,
        runtimeStatus: diagnostics.runtime.lineOa,
        requiresConsent: "none",
        capabilityNotes: [LINE_CAPABILITY_NOTE],
      },
      simulation,
    ),
  ];

  return { simulation, channels };
}
