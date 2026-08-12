import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("consent wiring", () => {
  it("locale layout mounts ConsentProvider and does not mount bare TrackingScripts", () => {
    const layout = read("app/[locale]/layout.tsx");
    assert.match(layout, /ConsentProvider/);
    assert.match(layout, /TrackingConfigLoader/);
    assert.doesNotMatch(layout, /<TrackingScripts\s*\/>/);
  });

  it("ConsentAwareTrackingScripts does not fetch integrations API", () => {
    const source = read("components/integrations/consent-aware-tracking-scripts.tsx");
    assert.doesNotMatch(source, /fetch\(/);
    assert.doesNotMatch(source, /\/api\/settings\/integrations/);
  });

  it("TrackingConfigLoader resolves settings server-side with fail-soft", () => {
    const source = read("components/integrations/tracking-config-loader.tsx");
    assert.match(source, /try\s*\{/);
    assert.match(source, /getIntegrationSettings/);
    assert.match(source, /resolveTrackingConfiguration/);
    assert.match(source, /catch/);
    assert.match(source, /ConsentAwareTrackingScripts/);
  });

  it("keeps consent off admin and root layouts", () => {
    assert.doesNotMatch(read("app/layout.tsx"), /ConsentProvider/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /ConsentProvider/);
  });

  it("footer exposes Cookie Settings reopen control", () => {
    const footer = read("features/layout/site-footer.tsx");
    assert.match(footer, /CookieSettingsButton|cookieSettings/);
  });

  it("CookieSettingsButton uses openPreferences without localStorage", () => {
    const source = read("components/integrations/cookie-settings-button.tsx");
    assert.match(source, /openPreferences/);
    assert.doesNotMatch(source, /localStorage/);
    assert.doesNotMatch(source, /writeStoredConsent|readStoredConsent/);
  });

  it("admin layout has no Cookie Settings UI", () => {
    assert.doesNotMatch(read("app/admin/layout.tsx"), /CookieSettingsButton|ConsentBanner|ConsentProvider/);
  });
});
