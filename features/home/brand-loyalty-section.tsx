import { LogoMarquee } from "@/features/brand-partners/logo-marquee";
import type { BrandPartnerLogo } from "@/lib/brand-partners";
import { cn } from "@/lib/utils";

interface BrandLoyaltySectionProps {
  partners: BrandPartnerLogo[];
  className?: string;
  title?: string;
  description?: string;
}

export function BrandLoyaltySection({
  partners,
  className,
  title = "BRAND LOYALTY",
  description = "",
}: BrandLoyaltySectionProps) {
  if (!partners.length) return null;

  return (
    <section className={cn("bg-[#24211D] py-16 text-white", className)} aria-labelledby="brand-loyalty-heading">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-paseo">Brand Loyalty</p>
          <h2 id="brand-loyalty-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/72">{description}</p>
        </div>

        <div className="mt-10">
          <LogoMarquee partners={partners} />
        </div>
      </div>
    </section>
  );
}
