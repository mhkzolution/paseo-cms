"use client";

import { GoogleAnalytics } from "@/components/integrations/google-analytics";
import { GoogleTagManager } from "@/components/integrations/google-tag-manager";
import { MetaPixel } from "@/components/integrations/meta-pixel";
import {
  canLoadAnalytics,
  canLoadMarketing,
} from "@/components/integrations/consent-gates";
import { useConsent } from "@/components/integrations/consent-provider";

type ConsentAwareTrackingScriptsProps = {
  gtmContainerId: string | null;
  gaMeasurementId: string | null;
  metaPixelId: string | null;
};

export function ConsentAwareTrackingScripts({
  gtmContainerId,
  gaMeasurementId,
  metaPixelId,
}: ConsentAwareTrackingScriptsProps) {
  const { consent } = useConsent();
  const showAnalytics = canLoadAnalytics(consent);
  const showMarketing = canLoadMarketing(consent);

  return (
    <>
      {showAnalytics && gtmContainerId ? (
        <GoogleTagManager containerId={gtmContainerId} />
      ) : null}
      {showAnalytics && gaMeasurementId ? (
        <GoogleAnalytics measurementId={gaMeasurementId} />
      ) : null}
      {showMarketing && metaPixelId ? <MetaPixel pixelId={metaPixelId} /> : null}
    </>
  );
}
