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

const OVERVIEW_SHORT_NAMES: Record<ChannelKey, string> = {
  gtm: "GTM",
  ga4: "GA4",
  meta: "Meta",
  lineOa: "LINE",
};

const CHANNEL_TITLES: Record<ConsentAwareChannel, string> = {
  gtm: "Google Tag Manager",
  ga4: "Google Analytics",
  meta: "Meta Pixel",
  lineOa: "LINE Official Account",
};

const OVERVIEW_CHANNELS: ChannelKey[] = ["gtm", "ga4", "meta", "lineOa"];

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

function overviewSecondary(
  channel: ChannelKey,
  diagnostics: IntegrationDiagnostics,
): string {
  const { configured, resolved } = diagnostics;

  if (channel === "gtm") {
    return configured.gtmContainerId ?? "No ID configured";
  }
  if (channel === "ga4") {
    return configured.gaMeasurementId ?? "No ID configured";
  }
  if (channel === "meta") {
    return configured.metaPixelId ?? "No ID configured";
  }

  return resolved.lineOaUrl ?? configured.lineOaId ?? "No ID configured";
}

export function IntegrationsDiagnosticsPanel({ diagnostics, settings }: Props) {
  const { runtime, configured, resolved, warnings } = diagnostics;
  const [simulation, setSimulation] = useState<SimulatedConsent>(DEFAULT_SIMULATED_CONSENT);
  const consentAware = resolveConsentAwareDiagnostics(settings, simulation);

  return (
    <div className="grid gap-6">
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

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <section
          className="rounded-lg border border-border bg-surface p-5 shadow-sm"
          aria-labelledby="runtime-status-heading"
        >
          <div className="mb-4">
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

          <ul className="space-y-4 text-sm">
            <li>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">Google Tag Manager</p>
                <StatusBadge
                  label={runtimeStatusLabel("gtm", runtime.gtm)}
                  tone={runtimeTone(runtime.gtm)}
                />
              </div>
              {configured.gtmContainerId ? (
                <p className="mt-1 text-xs text-muted">
                  Container: {configured.gtmContainerId}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">Not configured</p>
              )}
            </li>

            <li>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">Google Analytics</p>
                <StatusBadge
                  label={runtimeStatusLabel("ga4", runtime.ga4)}
                  tone={runtimeTone(runtime.ga4)}
                />
              </div>
              {runtime.ga4 === "suppressed" ? (
                <p className="mt-1 text-xs text-muted">
                  Configured Measurement ID: {configured.gaMeasurementId}. Direct GA4
                  script will not be injected. Manage GA4 inside GTM.
                </p>
              ) : configured.gaMeasurementId ? (
                <p className="mt-1 text-xs text-muted">
                  Measurement ID: {configured.gaMeasurementId}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">Not configured</p>
              )}
            </li>

            <li>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">Meta Pixel</p>
                <StatusBadge
                  label={runtimeStatusLabel("meta", runtime.meta)}
                  tone={runtimeTone(runtime.meta)}
                />
              </div>
              {configured.metaPixelId ? (
                <p className="mt-1 text-xs text-muted">Pixel ID: {configured.metaPixelId}</p>
              ) : (
                <p className="mt-1 text-xs text-muted">Not configured</p>
              )}
            </li>

            <li>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">LINE Official Account</p>
                <StatusBadge
                  label={runtimeStatusLabel("lineOa", runtime.lineOa)}
                  tone={runtimeTone(runtime.lineOa)}
                />
              </div>
              {runtime.lineOa === "active" ? (
                <p className="mt-1 text-xs text-muted">
                  Floating button + footer link will be shown
                  {resolved.lineOaUrl ? ` → ${resolved.lineOaUrl}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">Not configured</p>
              )}
            </li>
          </ul>

          {warnings.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4">
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
          className="rounded-lg border border-border bg-surface p-5 shadow-sm"
          aria-labelledby="consent-events-heading"
        >
          <div className="mb-4">
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

          <fieldset className="mb-5 space-y-3">
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

          <ul className="space-y-3">
            {consentAware.channels.map((row) => (
              <li
                key={row.channel}
                className="rounded-md border border-border/80 bg-background p-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {CHANNEL_TITLES[row.channel]}
                </p>

                <div className="mt-3 grid gap-2 text-xs">
                  <div>
                    <p className="text-muted">Requires</p>
                    <span className="mt-1 inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 font-medium text-foreground ring-1 ring-border">
                      {REQUIRES_CONSENT_LABELS[row.requiresConsent]}
                    </span>
                  </div>

                  <div>
                    <p className="text-muted">Result</p>
                    <div className="mt-1">
                      <StatusBadge
                        label={SIMULATION_RESULT_LABELS[row.simulationResult]}
                        tone={simulationTone(row.simulationResult)}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-muted">Reason</p>
                    <p className="mt-0.5 text-foreground">{REASON_LABELS[row.reasonCode]}</p>
                  </div>

                  {row.capabilityNotes?.map((note) => (
                    <p key={note} className="text-muted">
                      {note}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
