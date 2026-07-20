import { setRequestLocale } from "next-intl/server";

import { BannerCarousel } from "@/features/banners/banner-carousel";
import { HomeDirectorySection } from "@/features/home/home-directory-section";
import { HomeEventsSection } from "@/features/home/home-events-section";
import { HomeIntroductionSection } from "@/features/home/home-introduction-section";
import { HomeMembershipSection } from "@/features/home/home-membership-section";
import { HomeNewsSection } from "@/features/home/home-news-section";
import { HomeHeaderLoader } from "@/features/layout/home-header-loader";
import { SiteFooter } from "@/features/layout/site-footer";
import { getBannersForPlacement } from "@/lib/banners";
import { getHomeEvents } from "@/lib/events";
import { getHomeDirectoryData } from "@/lib/home-page";
import { getLatestPostsForHome } from "@/lib/post-archives";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [banners, events, posts, settings, directory] = await Promise.all([
    getBannersForPlacement("home"),
    getHomeEvents(4),
    getLatestPostsForHome(3),
    getSettings(["aboutDetail1"] as const, DEFAULT_SETTINGS),
    getHomeDirectoryData(),
  ]);

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <HomeHeaderLoader />

      {banners.length ? <BannerCarousel banners={banners} /> : null}

      <HomeEventsSection events={events} />
      <HomeNewsSection posts={posts} />
      <HomeIntroductionSection detailHtml={settings.aboutDetail1} />
      <HomeDirectorySection data={directory} />
      <HomeMembershipSection />

      <SiteFooter />
    </main>
  );
}
