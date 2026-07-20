import { BannerCarousel } from "@/features/banners/banner-carousel";
import { BrandLoyaltySection } from "@/features/home/brand-loyalty-section";
import { PostArchiveSections } from "@/features/posts/post-archive-sections";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import type { BranchPageData, BranchSectionKey } from "@/lib/branches/types";

import { BranchContact } from "./branch-contact";
import { BranchEventsList } from "./branch-events-list";
import { BranchPromotionsList } from "./branch-promotions-list";
import { BranchStoreGrid } from "./branch-store-grid";

type SectionRendererProps = {
  section: BranchSectionKey;
  data: BranchPageData;
};

export function BranchSection({ section, data }: SectionRendererProps) {
  switch (section) {
    case "hero":
      return data.banners.length ? <BannerCarousel banners={data.banners} /> : null;
    case "promotions":
      return <BranchPromotionsList promotions={data.promotions} branchSlug={data.branch.slug} />;
    case "stores":
      return (
        <BranchStoreGrid
          stores={data.stores}
          branchName={getBranchThaiName(data.branch)}
          branchSlug={data.branch.slug}
        />
      );
    case "events":
      return <BranchEventsList events={data.events} branchSlug={data.branch.slug} />;
    case "news":
      return data.postArchives.length ? (
        <section className="border-t border-border bg-white py-16">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <p className="text-sm font-semibold uppercase text-[var(--branch-primary)]">ข่าวสารสาขา</p>
            <h2 className="mt-2 text-3xl font-semibold">อัปเดตจาก {data.branch.name}</h2>
            <PostArchiveSections
              archives={data.postArchives}
              viewAllHref={`/news?branch=${data.branch.slug}`}
              className="mt-10 grid gap-12"
            />
          </div>
        </section>
      ) : null;
    case "map":
      return <BranchContact branch={data.branch} />;
    case "loyalty":
      return data.brandPartners.length ? (
        <BrandLoyaltySection
          partners={data.brandPartners}
          title={`แบรนด์พันธมิตรใน ${data.branch.name}`}
          description="ร้านค้าและแบรนด์ชั้นนำที่ร่วมสร้างประสบการณ์พิเศษให้กับผู้มาเยือน"
        />
      ) : null;
    default:
      return null;
  }
}
