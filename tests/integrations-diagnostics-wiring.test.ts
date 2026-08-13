import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("integrations diagnostics wiring", () => {
  it("mounts IntegrationsDiagnosticsPanel from the form", () => {
    assert.match(
      read("features/settings/integrations-form.tsx"),
      /IntegrationsDiagnosticsPanel/,
    );
  });

  it("recomputes diagnostics from saved settings after save", () => {
    const source = read("features/settings/integrations-form.tsx");
    assert.match(source, /resolveIntegrationDiagnostics/);
    assert.match(source, /setDiagnostics\(resolveIntegrationDiagnostics\(saved\)\)/);
  });

  it("page passes initialDiagnostics from resolveIntegrationDiagnostics", () => {
    const page = read("app/admin/settings/integrations/page.tsx");
    assert.match(page, /resolveIntegrationDiagnostics/);
    assert.match(page, /initialDiagnostics=/);
  });

  it("does not use draft watch for diagnostics", () => {
    const source = read("features/settings/integrations-form.tsx");
    assert.doesNotMatch(source, /\buseWatch\b/);
    assert.doesNotMatch(source, /\.watch\(/);
  });

  it("does not introduce a diagnostics API endpoint", () => {
    const form = read("features/settings/integrations-form.tsx");
    assert.doesNotMatch(form, /integrations\/diagnostics/);
  });

  it("diagnostics panel includes Consent & Events simulation UI", () => {
    const source = read("features/settings/integrations-diagnostics-panel.tsx");
    assert.match(source, /Consent & Events/);
    assert.match(source, /Simulation only/);
    assert.match(source, /resolveConsentAwareDiagnostics/);
    assert.match(source, /DEFAULT_SIMULATED_CONSENT/);
    assert.doesNotMatch(source, /trackEvent\(/);
    assert.doesNotMatch(source, /fbq\(|gtag\(/);
    assert.doesNotMatch(source, /Run Test Event/);
  });

  it("form passes settings into diagnostics panel", () => {
    const form = read("features/settings/integrations-form.tsx");
    assert.match(form, /IntegrationsDiagnosticsPanel/);
    assert.match(form, /settings=\{/);
  });

  it("does not introduce consent storage writes in diagnostics panel", () => {
    const source = read("features/settings/integrations-diagnostics-panel.tsx");
    assert.doesNotMatch(source, /integration-consent-v1/);
    assert.doesNotMatch(source, /writeStoredConsent|localStorage\.setItem/);
  });

  it("integrations page remains soft (no save blocking from consent diagnostics)", () => {
    const form = read("features/settings/integrations-form.tsx");
    assert.match(form, /handleSubmit/);
    assert.doesNotMatch(form, /resolveConsentAwareDiagnostics\([\s\S]*throw/);
  });

  it("admin layout still has no public EventsDebugPanel", () => {
    assert.doesNotMatch(read("app/admin/layout.tsx"), /EventsDebugPanel/);
  });

  it("consent-aware resolver stays pure (no network / tracking globals)", () => {
    const source = read("components/integrations/resolve-consent-aware-diagnostics.ts");
    assert.doesNotMatch(source, /fetch\(/);
    assert.doesNotMatch(source, /gtag\(|fbq\(|dataLayer/);
    assert.doesNotMatch(source, /trackEvent/);
    assert.doesNotMatch(source, /localStorage/);
  });

  it("diagnostics panel does not call tracking providers or fetch", () => {
    const source = read("features/settings/integrations-diagnostics-panel.tsx");
    assert.doesNotMatch(source, /fetch\(/);
    assert.doesNotMatch(source, /XMLHttpRequest|navigator\.sendBeacon/);
    assert.doesNotMatch(source, /dataLayer/);
  });
});
