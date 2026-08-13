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

function RuntimeStatusMarker({
  channel,
  status,
}: {
  channel: ChannelKey;
  status: RuntimeChannelStatus;
}) {
  const label = runtimeStatusLabel(channel, status);

  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
        <span aria-hidden="true">✓</span>
        <span>{label}</span>
      </span>
    );
  }

  if (status === "suppressed") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-amber-800">
        <span aria-hidden="true">⚠</span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-muted">
      <span aria-hidden="true">○</span>
      <span>{label}</span>
    </span>
  );
}

function SimulationResultMarker({
  result,
  reasonCode,
}: {
  result: ConsentAwareSimulationResult;
  reasonCode: ConsentAwareChannelResult["reasonCode"];
}) {
  const label = SIMULATION_RESULT_LABELS[result];
  const reason = REASON_LABELS[reasonCode];

  if (result === "would_fire") {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className="font-medium text-emerald-700">{label}</span>
        <span className="text-xs text-muted">{reason}</span>
      </span>
    );
  }

  if (result === "blocked" || result === "suppressed") {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className="font-medium text-amber-800">{label}</span>
        <span className="text-xs text-muted">{reason}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="font-medium text-muted">{label}</span>
      <span className="text-xs text-muted">{reason}</span>
    </span>
  );
}

export function IntegrationsDiagnosticsPanel({ diagnostics, settings }: Props) {
  const { runtime, configured, resolved, warnings } = diagnostics;
  const [simulation, setSimulation] = useState<SimulatedConsent>(DEFAULT_SIMULATED_CONSENT);
  const consentAware = resolveConsentAwareDiagnostics(settings, simulation);

  return (
    <section
      className="rounded-lg border border-border bg-surface p-5 shadow-sm"
      aria-label="Integrations diagnostics"
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Runtime Status</h2>
        <p className="mt-1 text-sm text-muted">
          Predicted from saved settings. Does not verify that vendor scripts loaded successfully.
        </p>
      </div>

      <ul className="space-y-4 text-sm">
        <li>
          <p className="font-medium text-foreground">
            Google Tag Manager —{" "}
            <RuntimeStatusMarker channel="gtm" status={runtime.gtm} />
          </p>
          {configured.gtmContainerId ? (
            <p className="mt-0.5 text-xs text-muted">Container: {configured.gtmContainerId}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Not configured</p>
          )}
        </li>

        <li>
          <p className="font-medium text-foreground">
            Google Analytics —{" "}
            <RuntimeStatusMarker channel="ga4" status={runtime.ga4} />
          </p>
          {runtime.ga4 === "suppressed" ? (
            <p className="mt-0.5 text-xs text-muted">
              Configured Measurement ID: {configured.gaMeasurementId}. Direct GA4 script will not be
              injected. Manage GA4 inside GTM.
            </p>
          ) : configured.gaMeasurementId ? (
            <p className="mt-0.5 text-xs text-muted">
              Measurement ID: {configured.gaMeasurementId}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Not configured</p>
          )}
        </li>

        <li>
          <p className="font-medium text-foreground">
            Meta Pixel — <RuntimeStatusMarker channel="meta" status={runtime.meta} />
          </p>
          {configured.metaPixelId ? (
            <p className="mt-0.5 text-xs text-muted">Pixel ID: {configured.metaPixelId}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Not configured</p>
          )}
        </li>

        <li>
          <p className="font-medium text-foreground">
            LINE Official Account —{" "}
            <RuntimeStatusMarker channel="lineOa" status={runtime.lineOa} />
          </p>
          {runtime.lineOa === "active" ? (
            <p className="mt-0.5 text-xs text-muted">
              Floating button + footer link will be shown
              {resolved.lineOaUrl ? ` → ${resolved.lineOaUrl}` : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Not configured</p>
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

      <div className="mt-6 border-t border-border pt-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Consent & Events</h2>
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

        <ul className="space-y-4 text-sm">
          {consentAware.channels.map((row) => (
            <li key={row.channel}>
              <p className="font-medium text-foreground">
                {CHANNEL_TITLES[row.channel]} —{" "}
                <RuntimeStatusMarker channel={row.channel} status={row.runtimeStatus} />
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-muted">
                <p>
                  Requires consent:{" "}
                  <span className="font-medium text-foreground">
                    {REQUIRES_CONSENT_LABELS[row.requiresConsent]}
                  </span>
                </p>
                <p>
                  Simulated result:{" "}
                  <SimulationResultMarker
                    result={row.simulationResult}
                    reasonCode={row.reasonCode}
                  />
                </p>
                {row.capabilityNotes?.map((note) => (
                  <p key={note} className="text-muted">
                    {note}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
