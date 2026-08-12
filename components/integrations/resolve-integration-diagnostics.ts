import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import type { IntegrationSettings } from "@/lib/integration-settings";

export type RuntimeChannelStatus = "active" | "inactive" | "suppressed";

export type DiagnosticsWarningCode =
  | "GA4_FORMAT"
  | "GTM_FORMAT"
  | "META_FORMAT"
  | "LINE_OA_EXPECTED_ID";

export type DiagnosticsWarning = {
  code: DiagnosticsWarningCode;
  message: string;
};

export type IntegrationDiagnostics = {
  runtime: {
    gtm: RuntimeChannelStatus;
    ga4: RuntimeChannelStatus;
    meta: RuntimeChannelStatus;
    lineOa: RuntimeChannelStatus;
  };
  configured: {
    gtmContainerId: string | null;
    gaMeasurementId: string | null;
    metaPixelId: string | null;
    lineOaId: string | null;
  };
  resolved: {
    lineOaUrl: string | null;
  };
  warnings: DiagnosticsWarning[];
};

function configuredId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function looksLikeLineUrl(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return /^https?:\/\//.test(v) || v.includes("line.me");
}

export function resolveIntegrationDiagnostics(
  settings: IntegrationSettings,
): IntegrationDiagnostics {
  const tracking = resolveTrackingConfiguration(settings);
  const configuredGa = configuredId(settings.gaMeasurementId);
  const configuredGtm = configuredId(settings.gtmContainerId);
  const configuredMeta = configuredId(settings.metaPixelId);
  const lineOaUrl = resolveLineOaUrl(settings.lineOaId);

  const lineCompact = (settings.lineOaId ?? "").trim().replace(/\s+/g, "");
  const configuredLine =
    lineCompact.length === 0
      ? null
      : lineCompact.startsWith("@")
        ? lineCompact
        : `@${lineCompact}`;

  const gtmActive = tracking.gtmContainerId !== null;
  const ga4Status = gtmActive
    ? configuredGa
      ? "suppressed"
      : "inactive"
    : tracking.gaMeasurementId
      ? "active"
      : "inactive";

  const warnings: DiagnosticsWarning[] = [];
  if (configuredGa && !/^G-[A-Z0-9]+$/i.test(configuredGa)) {
    warnings.push({
      code: "GA4_FORMAT",
      message: 'Expected a Measurement ID like "G-XXXXXXXX".',
    });
  }
  if (configuredGtm && !/^GTM-[A-Z0-9]+$/i.test(configuredGtm)) {
    warnings.push({
      code: "GTM_FORMAT",
      message: 'Expected a Container ID like "GTM-XXXXXXX".',
    });
  }
  if (configuredMeta && !/^\d+$/.test(configuredMeta)) {
    warnings.push({
      code: "META_FORMAT",
      message: "Meta Pixel IDs are usually numeric.",
    });
  }
  if (configuredId(settings.lineOaId) && looksLikeLineUrl(settings.lineOaId)) {
    warnings.push({
      code: "LINE_OA_EXPECTED_ID",
      message:
        "Expected an OA identifier such as @thepaseo. The current value looks like a URL. Runtime will generate a URL from the value as entered.",
    });
  }

  return {
    runtime: {
      gtm: gtmActive ? "active" : "inactive",
      ga4: ga4Status,
      meta: tracking.metaPixelId ? "active" : "inactive",
      lineOa: lineOaUrl ? "active" : "inactive",
    },
    configured: {
      gtmContainerId: configuredGtm,
      gaMeasurementId: configuredGa,
      metaPixelId: configuredMeta,
      lineOaId: configuredLine,
    },
    resolved: { lineOaUrl },
    warnings,
  };
}

export function runtimeStatusLabel(
  channel: "gtm" | "ga4" | "meta" | "lineOa",
  status: RuntimeChannelStatus,
): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (channel === "ga4") return "Suppressed by GTM";
  return "Suppressed";
}
