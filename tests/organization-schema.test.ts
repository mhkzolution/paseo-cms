import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_SEO } from "@/lib/settings";
import { resolveOrganizationJsonLd } from "@/lib/seo/organization-schema";

describe("resolveOrganizationJsonLd", () => {
  it("returns null when no organization data", () => {
    assert.equal(resolveOrganizationJsonLd({ ...DEFAULT_SEO }), null);
  });

  it("generates schema when name and url are set", () => {
    const result = resolveOrganizationJsonLd({
      ...DEFAULT_SEO,
      organizationName: "The Paseo",
      organizationUrl: "https://thepaseo.co.th",
      organizationPhone: "02-123-4567",
    });

    assert.deepEqual(result, {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Paseo",
      url: "https://thepaseo.co.th",
      telephone: "02-123-4567",
    });
  });

  it("prefers customOrganizationSchema over generated", () => {
    const custom = { "@context": "https://schema.org", "@type": "Organization", name: "Custom" };
    const result = resolveOrganizationJsonLd({
      ...DEFAULT_SEO,
      organizationName: "The Paseo",
      organizationUrl: "https://thepaseo.co.th",
      customOrganizationSchema: JSON.stringify(custom),
    });

    assert.deepEqual(result, custom);
  });

  it("omits empty optional generated fields", () => {
    const result = resolveOrganizationJsonLd({
      ...DEFAULT_SEO,
      organizationName: "The Paseo",
      organizationUrl: "https://thepaseo.co.th",
      organizationLogo: "",
    });

    assert.equal("logo" in (result ?? {}), false);
  });
});
