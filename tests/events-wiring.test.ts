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

  it("LINE surfaces call trackEvent line_oa_click", () => {
    assert.match(read("components/integrations/line-floating-button.tsx"), /line_oa_click/);
    assert.match(read("components/integrations/line-floating-button.tsx"), /surface:\s*["']floating["']/);
    assert.match(read("components/integrations/line-footer-link.tsx"), /line_oa_click/);
    assert.match(read("components/integrations/line-footer-link.tsx"), /surface:\s*["']footer["']/);
  });

  it("footer and branch-contact use TrackedPhoneLink", () => {
    assert.match(read("features/layout/site-footer.tsx"), /TrackedPhoneLink/);
    assert.match(read("features/branches/shared/branch-contact.tsx"), /TrackedPhoneLink/);
  });

  it("leasing form tracks form_submit only on success path", () => {
    const source = read("features/leasing/leasing-form.tsx");
    assert.match(source, /trackEvent\(\s*["']form_submit["']/);
    assert.match(source, /formId:\s*["']leasing["']/);

    const errorReturnIdx = source.indexOf("if (!response.ok)");
    const errorBlockEnd = source.indexOf("return;", errorReturnIdx) + "return;".length;
    const errorBlock = source.slice(errorReturnIdx, errorBlockEnd);
    assert.doesNotMatch(errorBlock, /trackEvent/);

    const successIdx = source.indexOf('setSubmitState("success")');
    const trackIdx = source.indexOf('trackEvent("form_submit"');
    assert.ok(trackIdx !== -1 && successIdx !== -1);
    assert.ok(trackIdx < successIdx);
  });

  it("phone and LINE wiring use explicit onClick, not document listeners", () => {
    for (const file of [
      "components/integrations/events/tracked-phone-link.tsx",
      "components/integrations/line-floating-button.tsx",
      "components/integrations/line-footer-link.tsx",
    ]) {
      const source = read(file);
      assert.match(source, /onClick/);
      assert.doesNotMatch(source, /document\.addEventListener/);
    }
  });
});
