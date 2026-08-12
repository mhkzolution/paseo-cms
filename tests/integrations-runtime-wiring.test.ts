import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("integrations provider script ids", () => {
  it("declares gtm-bootstrap in GoogleTagManager", () => {
    assert.match(read("components/integrations/google-tag-manager.tsx"), /id=["']gtm-bootstrap["']/);
  });

  it("declares ga4-loader and ga4-config in GoogleAnalytics", () => {
    const source = read("components/integrations/google-analytics.tsx");
    assert.match(source, /id=["']ga4-loader["']/);
    assert.match(source, /id=["']ga4-config["']/);
  });

  it("declares meta-pixel in MetaPixel", () => {
    assert.match(read("components/integrations/meta-pixel.tsx"), /id=["']meta-pixel["']/);
  });
});

describe("TrackingConfigLoader orchestrator", () => {
  it("fails soft when settings cannot be loaded", () => {
    const source = read("components/integrations/tracking-config-loader.tsx");
    assert.match(source, /try\s*\{/);
    assert.match(source, /getIntegrationSettings/);
    assert.match(source, /catch/);
  });
});

describe("integrations layout wiring", () => {
  it("mounts consent-aware tracking on the locale layout only", () => {
    const localeLayout = read("app/[locale]/layout.tsx");
    assert.match(localeLayout, /ConsentProvider/);
    assert.match(localeLayout, /TrackingConfigLoader/);
    assert.doesNotMatch(localeLayout, /<TrackingScripts\s*\/>/);
    assert.doesNotMatch(read("app/[locale]/(site)/layout.tsx"), /TrackingConfigLoader/);
    assert.doesNotMatch(read("app/layout.tsx"), /ConsentProvider/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /ConsentProvider/);
  });

  it("ConsentAwareTrackingScripts gates providers by consent category", () => {
    const source = read("components/integrations/consent-aware-tracking-scripts.tsx");
    assert.match(source, /canLoadAnalytics/);
    assert.match(source, /canLoadMarketing/);
    assert.match(source, /useConsent/);
    assert.doesNotMatch(source, /fetch\(/);
  });
});
