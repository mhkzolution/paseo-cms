import type {
  IntegrationDiagnostics,
  RuntimeChannelStatus,
} from "@/components/integrations/resolve-integration-diagnostics";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/features/settings/integration-status-badge";

type ChannelKey = "gtm" | "ga4" | "meta" | "lineOa";

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "gtm", label: "GTM" },
  { key: "ga4", label: "GA4" },
  { key: "meta", label: "Meta" },
  { key: "lineOa", label: "LINE" },
];

function runtimeTone(status: RuntimeChannelStatus): StatusBadgeTone {
  if (status === "active") return "success";
  if (status === "suppressed") return "warning";
  return "muted";
}

function connectionLabel(channel: ChannelKey, status: RuntimeChannelStatus): string {
  if (status === "active") return "Connected";
  if (status === "inactive") return "Missing";
  if (channel === "ga4") return "Suppressed by GTM";
  return "Suppressed";
}

type Props = {
  diagnostics: IntegrationDiagnostics;
};

/** Compact runtime-only connection summary (not simulation-aware). */
export function IntegrationsConnectionStatus({ diagnostics }: Props) {
  const { runtime } = diagnostics;

  return (
    <section
      aria-labelledby="connection-status-heading"
      className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm"
    >
      <header className="mb-3">
        <h2
          id="connection-status-heading"
          className="text-base font-semibold text-foreground"
        >
          Connection Status
        </h2>
        <p className="mt-1 text-sm text-muted">Current provider configuration</p>
      </header>

      <ul className="text-sm">
        {CHANNELS.map(({ key, label }) => {
          const status = runtime[key];

          return (
            <li
              key={key}
              className="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={
                    status === "active"
                      ? "h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                      : status === "suppressed"
                        ? "h-2 w-2 shrink-0 rounded-full bg-amber-500"
                        : "h-2 w-2 shrink-0 rounded-full bg-neutral-300"
                  }
                />
                <span className="font-medium text-foreground">{label}</span>
              </div>
              <StatusBadge
                label={connectionLabel(key, status)}
                tone={runtimeTone(status)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** @deprecated Use IntegrationsConnectionStatus */
export const IntegrationsOverviewCards = IntegrationsConnectionStatus;
