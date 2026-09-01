import { setRequestLocale } from "next-intl/server";

import { BannerCarousel } from "@/features/banners/banner-carousel";
import { HomeDirectorySection } from "@/features/home/home-directory-section";
import { HomeEventsSection } from "@/features/home/home-events-section";
import { HomeIntroductionSection } from "@/features/home/home-introduction-section";
import { HomeThePaseoLifeSection } from "@/features/home/home-thepaseolife-section";
import { HomeNewsSection } from "@/features/home/home-news-section";
import { HomeHeaderLoader } from "@/features/layout/home-header-loader";
import { SiteFooter } from "@/features/layout/site-footer";
import { PromotionHomeSection } from "@/features/promotions/promotion-tabbed-section";
import { getBannersForPlacement } from "@/lib/banners";
import { getHomeEvents } from "@/lib/events";
import { getHomeDirectoryData } from "@/lib/home-page";
import { getPublishedThePaseoLifePosts } from "@/lib/thepaseolife";
import { getLatestPostsForHome } from "@/lib/post-archives";
import { getActivePromotionsForHome } from "@/lib/promotions";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [banners, events, promotions, posts, settings, directory, paseoLifePosts] = await Promise.all([
    getBannersForPlacement("home"),
    getHomeEvents(4),
    getActivePromotionsForHome(6),
    getLatestPostsForHome(3),
    getSettings(["aboutDetail1"] as const, DEFAULT_SETTINGS),
    getHomeDirectoryData(),
    getPublishedThePaseoLifePosts(),
  ]);

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <HomeHeaderLoader />

      {banners.length ? <BannerCarousel banners={banners} /> : null}

      {events.length > 0 ? (
        <HomeEventsSection events={events} />
      ) : promotions.length > 0 ? (
        <PromotionHomeSection promotions={promotions} />
      ) : null}
      {posts.length > 0 ? <HomeNewsSection posts={posts} /> : null}
      <HomeIntroductionSection detailHtml={settings.aboutDetail1} />
      <HomeDirectorySection data={directory} />
      <HomeThePaseoLifeSection posts={paseoLifePosts} />

      <SiteFooter />
    </main>
  );
}
