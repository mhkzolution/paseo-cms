"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";

import { useConsent } from "@/components/integrations/consent-provider";
import { Button } from "@/components/ui/button";

export function ConsentBanner() {
  const t = useTranslations("consent");
  const titleId = useId();
  const descriptionId = useId();
  const {
    consent,
    isPreferencesOpen,
    acceptAll,
    necessaryOnly,
    saveCustom,
    closePreferences,
  } = useConsent();

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  const isVisible = consent === null || isPreferencesOpen;

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (isPreferencesOpen && consent !== null) {
      setIsCustomizing(true);
      setDraftAnalytics(consent.analytics);
      setDraftMarketing(consent.marketing);
      return;
    }

    if (consent === null) {
      setIsCustomizing(false);
      setDraftAnalytics(false);
      setDraftMarketing(false);
    }
  }, [consent, isPreferencesOpen, isVisible]);

  useEffect(() => {
    if (!isVisible || consent === null || !isPreferencesOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePreferences();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePreferences, consent, isPreferencesOpen, isVisible]);

  if (!isVisible) {
    return null;
  }

  function handleCustomize() {
    setIsCustomizing(true);
    setDraftAnalytics(consent?.analytics ?? false);
    setDraftMarketing(consent?.marketing ?? false);
  }

  function handleSaveCustom() {
    saveCustom({ analytics: draftAnalytics, marketing: draftMarketing });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
        <div className="space-y-2">
          <h2 id={titleId} className="text-base font-semibold text-foreground sm:text-lg">
            {t("title")}
          </h2>
          <p id={descriptionId} className="text-sm text-muted">
            {t("description")}
          </p>
        </div>

        {isCustomizing ? (
          <div className="flex flex-col gap-4">
            <fieldset className="space-y-3">
              <legend className="sr-only">{t("customize")}</legend>

              <label className="flex items-start gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-paseo"
                  checked={draftAnalytics}
                  onChange={(event) => setDraftAnalytics(event.target.checked)}
                />
                <span>
                  <span className="font-medium">{t("analytics")}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">
                    {t("analyticsHelp")}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-paseo"
                  checked={draftMarketing}
                  onChange={(event) => setDraftMarketing(event.target.checked)}
                />
                <span>
                  <span className="font-medium">{t("marketing")}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">
                    {t("marketingHelp")}
                  </span>
                </span>
              </label>
            </fieldset>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSaveCustom}>
                {t("save")}
              </Button>
              {consent !== null ? (
                <Button type="button" variant="ghost" onClick={closePreferences}>
                  {t("cancel")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={acceptAll}>
              {t("acceptAll")}
            </Button>
            <Button type="button" variant="secondary" onClick={necessaryOnly}>
              {t("necessaryOnly")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCustomize}>
              {t("customize")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
