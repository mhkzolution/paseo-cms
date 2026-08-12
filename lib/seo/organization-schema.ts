import type { SeoSettings } from "@/lib/settings";

function parseCustomOrganizationSchema(raw: string): Record<string, unknown> | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[seo] invalid customOrganizationSchema in settings — falling back to generated");
    }
  }
  return null;
}

function generateOrganizationSchema(seo: SeoSettings): Record<string, unknown> | null {
  if (!seo.organizationName.trim() || !seo.organizationUrl.trim()) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.organizationName.trim(),
    url: seo.organizationUrl.trim(),
  };

  if (seo.organizationLogo.trim()) schema.logo = seo.organizationLogo.trim();
  if (seo.organizationPhone.trim()) schema.telephone = seo.organizationPhone.trim();
  if (seo.organizationEmail.trim()) schema.email = seo.organizationEmail.trim();

  return schema;
}

export function resolveOrganizationJsonLd(seo: SeoSettings): Record<string, unknown> | null {
  return parseCustomOrganizationSchema(seo.customOrganizationSchema) ?? generateOrganizationSchema(seo);
}
