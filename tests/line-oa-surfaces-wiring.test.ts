import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("LINE OA surfaces wiring", () => {
  it("mounts LineOaSurfaces on the locale layout only", () => {
    assert.match(read("app/[locale]/layout.tsx"), /LineOaSurfaces/);
    assert.doesNotMatch(read("app/layout.tsx"), /LineOaSurfaces/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /LineOaSurfaces/);
    assert.doesNotMatch(read("app/[locale]/(site)/layout.tsx"), /LineOaSurfaces/);
  });

  it("fails soft when settings cannot be loaded", () => {
    const source = read("components/integrations/line-oa-surfaces.tsx");
    assert.match(source, /try\s*\{/);
    assert.match(source, /getIntegrationSettings/);
    assert.match(source, /catch/);
  });

  it("wires LineFooterLink via SiteFooter without getIntegrationSettings", () => {
    const source = read("features/layout/site-footer.tsx");
    assert.match(source, /LineFooterLink|resolveLineOaUrl/);
    assert.doesNotMatch(source, /getIntegrationSettings/);
  });
});
