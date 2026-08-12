import { getTranslations } from "next-intl/server";

import { LineFloatingButton } from "@/components/integrations/line-floating-button";
import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";
import { getIntegrationSettings } from "@/lib/integration-settings";

export async function LineOaSurfaces() {
  let settings;
  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }

  const href = resolveLineOaUrl(settings.lineOaId);
  if (!href) return null;

  const t = await getTranslations("footer");
  return <LineFloatingButton href={href} label={t("lineOaContact")} />;
}
