import type {
  IntegrationDiagnostics,
  RuntimeChannelStatus,
} from "@/components/integrations/resolve-integration-diagnostics";
import { runtimeStatusLabel } from "@/components/integrations/resolve-integration-diagnostics";

type Props = {
  diagnostics: IntegrationDiagnostics;
};

type ChannelKey = "gtm" | "ga4" | "meta" | "lineOa";

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

export function IntegrationsDiagnosticsPanel({ diagnostics }: Props) {
  const { runtime, configured, resolved, warnings } = diagnostics;

  return (
    <section
      className="rounded-lg border border-border bg-surface p-5 shadow-sm"
      aria-label="Runtime status"
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
    </section>
  );
}
