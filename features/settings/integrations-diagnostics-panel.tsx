"use client";

import { useState } from "react";

import {
  DEFAULT_SIMULATED_CONSENT,
  REASON_LABELS,
  resolveConsentAwareDiagnostics,
  type ConsentAwareChannel,
  type ConsentAwareChannelResult,
  type ConsentAwareSimulationResult,
  type SimulatedConsent,
} from "@/components/integrations/resolve-consent-aware-diagnostics";
import type {
  IntegrationDiagnostics,
  RuntimeChannelStatus,
} from "@/components/integrations/resolve-integration-diagnostics";
import { runtimeStatusLabel } from "@/components/integrations/resolve-integration-diagnostics";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/features/settings/integration-status-badge";
import type { IntegrationSettings } from "@/lib/integration-settings";

type Props = {
  diagnostics: IntegrationDiagnostics;
  settings: IntegrationSettings;
};

type ChannelKey = "gtm" | "ga4" | "meta" | "lineOa";

const CHANNEL_TITLES: Record<ConsentAwareChannel, string> = {
  gtm: "Google Tag Manager",
  ga4: "Google Analytics",
  meta: "Meta Pixel",
  lineOa: "LINE Official Account",
};

const RUNTIME_CHANNELS: ChannelKey[] = ["gtm", "ga4", "meta", "lineOa"];

const SIMULATION_RESULT_LABELS: Record<ConsentAwareSimulationResult, string> = {
  would_fire: "Would Fire",
  blocked: "Blocked",
  suppressed: "Suppressed",
  not_configured: "Not Configured",
};

const REQUIRES_CONSENT_LABELS: Record<
  ConsentAwareChannelResult["requiresConsent"],
  string
> = {
  analytics: "Analytics",
  marketing: "Marketing",
  none: "None",
};

function runtimeTone(status: RuntimeChannelStatus): StatusBadgeTone {
  if (status === "active") return "success";
  if (status === "suppressed") return "warning";
  return "muted";
}

function simulationTone(result: ConsentAwareSimulationResult): StatusBadgeTone {
  if (result === "would_fire") return "success";
  if (result === "blocked") return "danger";
  if (result === "suppressed") return "warning";
  return "muted";
}

function runtimeDetail(
  channel: ChannelKey,
  diagnostics: IntegrationDiagnostics,
): string | null {
  const { runtime, configured, resolved } = diagnostics;

  if (channel === "gtm") {
    return runtime.gtm === "active" && configured.gtmContainerId
      ? configured.gtmContainerId
      : null;
  }

  if (channel === "ga4") {
    if (runtime.ga4 === "suppressed") {
      return "Direct GA4 script will not be injected. Manage GA4 inside GTM.";
    }
    return runtime.ga4 === "active" && configured.gaMeasurementId
      ? configured.gaMeasurementId
      : null;
  }

  if (channel === "meta") {
    return runtime.meta === "active" && configured.metaPixelId
      ? configured.metaPixelId
      : null;
  }

  if (runtime.lineOa === "active") {
    return resolved.lineOaUrl
      ? `Floating button + footer link → ${resolved.lineOaUrl}`
      : "Floating button + footer link will be shown";
  }

  return null;
}

/** Monitoring-only: Runtime Status + Consent & Events (Overview lives above Configuration). */
export function IntegrationsDiagnosticsPanel({ diagnostics, settings }: Props) {
  const { runtime, warnings } = diagnostics;
  const [simulation, setSimulation] = useState<SimulatedConsent>(DEFAULT_SIMULATED_CONSENT);
  const consentAware = resolveConsentAwareDiagnostics(settings, simulation);

  return (
    <div className="grid w-full min-w-0 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
      <section
        className="min-w-0 rounded-lg border border-border bg-surface p-5 shadow-sm"
        aria-labelledby="runtime-status-heading"
      >
        <div className="mb-3">
          <h2
            id="runtime-status-heading"
            className="text-base font-semibold text-foreground"
          >
            Runtime Status
          </h2>
          <p className="mt-1 text-sm text-muted">Current provider configuration</p>
          <p className="mt-1 text-xs text-muted">
            Predicted from saved settings. Does not verify that vendor scripts loaded
            successfully.
          </p>
        </div>

        <ul className="text-sm">
          {RUNTIME_CHANNELS.map((channel) => {
            const status = runtime[channel];
            const detail = runtimeDetail(channel, diagnostics);

            return (
              <li
                key={channel}
                className="border-b border-border/70 py-2.5 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{CHANNEL_TITLES[channel]}</p>
                  <StatusBadge
                    label={runtimeStatusLabel(channel, status)}
                    tone={runtimeTone(status)}
                  />
                </div>
                {detail ? (
                  <p className="mt-1 text-xs text-muted" title={detail}>
                    {detail}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {warnings.length > 0 ? (
          <div className="mt-3 border-t border-border pt-3">
            <h3 className="text-sm font-semibold text-foreground">Warnings</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-amber-800">
              {warnings.map((w) => (
                <li key={w.code}>
                  <span className="font-medium">{w.code}</span>: {w.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section
        className="min-w-0 rounded-lg border border-border bg-surface p-5 shadow-sm"
        aria-labelledby="consent-events-heading"
      >
        <div className="mb-3">
          <h2
            id="consent-events-heading"
            className="text-base font-semibold text-foreground"
          >
            Consent & Events
          </h2>
          <p className="mt-1 text-sm text-muted">
            Simulation only. Does not affect visitor consent or tracking.
          </p>
        </div>

        <fieldset className="mb-4 min-w-0 space-y-2.5">
          <legend className="sr-only">Simulated consent</legend>

          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-paseo"
              checked={simulation.analytics}
              onChange={(event) =>
                setSimulation((prev) => ({ ...prev, analytics: event.target.checked }))
              }
            />
            <span>
              <span className="font-medium">Analytics Consent</span>
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Simulates visitor analytics consent for GTM and GA4.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-paseo"
              checked={simulation.marketing}
              onChange={(event) =>
                setSimulation((prev) => ({ ...prev, marketing: event.target.checked }))
              }
            />
            <span>
              <span className="font-medium">Marketing Consent</span>
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Simulates visitor marketing consent for Meta Pixel.
              </span>
            </span>
          </label>
        </fieldset>

        <ul className="min-w-0 space-y-2">
          {consentAware.channels.map((row) => (
            <li
              key={row.channel}
              className="min-w-0 rounded-md border border-border/80 bg-background px-3 py-2.5"
            >
              <p className="text-sm font-medium text-foreground">
                {CHANNEL_TITLES[row.channel]}
              </p>

              <dl className="mt-2 grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-muted">Requires</dt>
                <dd className="min-w-0">
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 font-medium text-foreground ring-1 ring-border">
                    {REQUIRES_CONSENT_LABELS[row.requiresConsent]}
                  </span>
                </dd>

                <dt className="text-muted">Result</dt>
                <dd className="min-w-0">
                  <StatusBadge
                    label={SIMULATION_RESULT_LABELS[row.simulationResult]}
                    tone={simulationTone(row.simulationResult)}
                  />
                </dd>

                <dt className="text-muted">Reason</dt>
                <dd className="min-w-0 break-words text-foreground">
                  {REASON_LABELS[row.reasonCode]}
                </dd>
              </dl>

              {row.capabilityNotes?.map((note) => (
                <p key={note} className="mt-1.5 text-xs text-muted">
                  {note}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
