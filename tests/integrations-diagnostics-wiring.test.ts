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
});
