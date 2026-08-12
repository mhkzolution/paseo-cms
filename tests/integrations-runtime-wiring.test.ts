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

describe("TrackingScripts orchestrator", () => {
  it("fails soft when settings cannot be loaded", () => {
    const source = read("components/integrations/tracking-scripts.tsx");
    assert.match(source, /try\s*\{/);
    assert.match(source, /getIntegrationSettings/);
    assert.match(source, /catch/);
  });
});

describe("integrations layout wiring", () => {
  it("mounts TrackingScripts on the locale layout only", () => {
    assert.match(read("app/[locale]/layout.tsx"), /TrackingScripts/);
    assert.doesNotMatch(read("app/[locale]/(site)/layout.tsx"), /TrackingScripts/);
    assert.doesNotMatch(read("app/layout.tsx"), /TrackingScripts/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /TrackingScripts/);
  });
});
