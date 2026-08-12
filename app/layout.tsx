import type { Metadata } from "next";
import { Cormorant_Garamond, Prompt } from "next/font/google";
import { getLocale } from "next-intl/server";

import "./globals.css";
import { DEFAULT_SETTINGS, getSeoSettings, getSettings, SETTINGS_KEYS } from "@/lib/settings";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),
    getSeoSettings(),
  ]);
  const siteUrl = settings.siteUrl ? new URL(settings.siteUrl) : undefined;
  const canonical = seo.canonicalUrl || settings.siteUrl;
  const ogImage = seo.ogImage ? [seo.ogImage] : undefined;

  return {
    metadataBase: siteUrl,
    title: {
      default: seo.metaTitle || settings.siteName,
      template: `%s | ${settings.siteName}`,
    },
    description: seo.metaDescription,
    icons: settings.favicon ? { icon: settings.favicon } : undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: canonical,
      siteName: settings.siteName,
      images: ogImage,
      type: "website",
    },
    twitter: {
      card: seo.twitterCard === "summary" ? "summary" : "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: ogImage,
    },
    robots: seo.robots === "noindex,nofollow" ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [seo, locale] = await Promise.all([getSeoSettings(), getLocale().catch(() => "th")]);

  return (
    <html lang={locale} className={`${prompt.variable} ${cormorant.variable} site-scrollbar`}>
      <body className="font-sans">
        {seo.jsonLd ? (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: seo.jsonLd }}
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
