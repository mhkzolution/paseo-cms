"use client";

import { useTranslations } from "next-intl";

import { useConsent } from "@/components/integrations/consent-provider";

export function CookieSettingsButton() {
  const t = useTranslations("consent");
  const { openPreferences } = useConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="transition-colors hover:text-foreground"
    >
      {t("cookieSettings")}
    </button>
  );
}
