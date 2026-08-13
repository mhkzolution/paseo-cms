import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("events wiring", () => {
  it("TrackingConfigLoader mounts EventRuntimeProvider and EventsDebugPanel", () => {
    const source = read("components/integrations/tracking-config-loader.tsx");
    assert.match(source, /EventRuntimeProvider/);
    assert.match(source, /EventsDebugPanel/);
    assert.match(source, /ConsentAwareTrackingScripts/);
  });

  it("does not auto-fire page_view in locale layout", () => {
    const layout = read("app/[locale]/layout.tsx");
    assert.doesNotMatch(layout, /trackEvent\(\s*["']page_view["']/);
  });

  it("keeps consent/events off admin layout", () => {
    assert.doesNotMatch(
      read("app/admin/layout.tsx"),
      /EventsDebugPanel|EventRuntimeProvider/,
    );
  });

  it("debug-ring documents max 30", () => {
    assert.match(read("components/integrations/events/debug-ring.ts"), /30/);
  });

  it("isEventsDebugEnabled supports query or localStorage flag", () => {
    const source = read("components/integrations/events/debug-ring.ts");
    assert.match(source, /eventsDebug|integration-events-debug/);
  });
});
