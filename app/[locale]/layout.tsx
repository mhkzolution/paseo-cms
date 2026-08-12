import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ConsentBanner } from "@/components/integrations/consent-banner";
import { ConsentProvider } from "@/components/integrations/consent-provider";
import { LineOaSurfaces } from "@/components/integrations/line-oa-surfaces";
import { TrackingConfigLoader } from "@/components/integrations/tracking-config-loader";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ConsentProvider>
        <ConsentBanner />
        <TrackingConfigLoader />
        <LineOaSurfaces />
        {children}
      </ConsentProvider>
    </NextIntlClientProvider>
  );
}
