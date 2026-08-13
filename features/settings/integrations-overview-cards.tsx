import type {
  IntegrationDiagnostics,
  RuntimeChannelStatus,
} from "@/components/integrations/resolve-integration-diagnostics";
import { runtimeStatusLabel } from "@/components/integrations/resolve-integration-diagnostics";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/features/settings/integration-status-badge";

type ChannelKey = "gtm" | "ga4" | "meta" | "lineOa";

const OVERVIEW_SHORT_NAMES: Record<ChannelKey, string> = {
  gtm: "GTM",
  ga4: "GA4",
  meta: "Meta",
  lineOa: "LINE",
};

const OVERVIEW_CHANNELS: ChannelKey[] = ["gtm", "ga4", "meta", "lineOa"];

function runtimeTone(status: RuntimeChannelStatus): StatusBadgeTone {
  if (status === "active") return "success";
  if (status === "suppressed") return "warning";
  return "muted";
}

function overviewSecondary(
  channel: ChannelKey,
  diagnostics: IntegrationDiagnostics,
): string {
  const { configured, resolved } = diagnostics;

  if (channel === "gtm") {
    return configured.gtmContainerId ?? "Container missing";
  }
  if (channel === "ga4") {
    return configured.gaMeasurementId ?? "Measurement ID missing";
  }
  if (channel === "meta") {
    return configured.metaPixelId ?? "Pixel ID missing";
  }

  return resolved.lineOaUrl ?? configured.lineOaId ?? "LINE OA missing";
}

type Props = {
  diagnostics: IntegrationDiagnostics;
};

/** Runtime-only provider summary cards (Decision A — not simulation-aware). */
export function IntegrationsOverviewCards({ diagnostics }: Props) {
  const { runtime } = diagnostics;

  return (
    <section
      aria-label="Integration overview"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
    >
      {OVERVIEW_CHANNELS.map((channel) => {
        const status = runtime[channel];
        const secondary = overviewSecondary(channel, diagnostics);

        return (
          <div
            key={channel}
            className="rounded-lg border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-foreground">
              {OVERVIEW_SHORT_NAMES[channel]}
            </p>
            <div className="mt-2">
              <StatusBadge
                label={runtimeStatusLabel(channel, status)}
                tone={runtimeTone(status)}
              />
            </div>
            <p className="mt-2 truncate text-xs text-muted" title={secondary}>
              {secondary}
            </p>
          </div>
        );
      })}
    </section>
  );
}
