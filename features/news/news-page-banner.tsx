import Image from "next/image";

import { BannerCarousel } from "@/features/banners/banner-carousel";
import { getBannersForPlacement } from "@/lib/banners";
import { cn } from "@/lib/utils";

type NewsPageBannerProps = {
  bannerDesktop?: string | null;
  bannerMobile?: string | null;
  title?: string;
};

export async function NewsPageBanner({
  bannerDesktop,
  bannerMobile,
  title = "Post banner",
}: NewsPageBannerProps) {
  const desktop = bannerDesktop?.trim() || null;
  const mobile = bannerMobile?.trim() || null;

  if (desktop || mobile) {
    const desktopSrc = desktop || mobile!;
    const mobileSrc = mobile || desktop!;

    return (
      <section
        data-news-banner=""
        className="w-full max-w-[100%] overflow-x-clip bg-[#24211D] text-white md:relative md:h-full md:overflow-hidden"
        aria-label="Post banner"
      >
        {/* Mobile: full screen width, height follows image */}
        <div className="w-full max-w-[100%] md:hidden">
          <Image
            src={mobileSrc}
            alt={title}
            width={1200}
            height={1500}
            priority
            sizes="100vw"
            className="block h-auto w-full max-w-[100%]"
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        {/* Desktop: fill sticky viewport frame */}
        <div className="relative hidden h-full w-full md:block">
          <Image
            src={desktopSrc}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </section>
    );
  }

  const banners = await getBannersForPlacement("home");
  if (!banners.length) return null;

  return (
    <BannerCarousel
      banners={banners}
      size="full"
      className={cn("w-full max-w-[100%] overflow-x-clip md:h-full")}
    />
  );
}
