import Image from "next/image";

import { cn } from "@/lib/utils";

export type LoginBrandStats = {
  branches: number;
  stores: number;
  campaigns: number;
};

type LoginLayoutProps = {
  children: React.ReactNode;
  siteName?: string;
  siteLogo?: string;
  stats?: LoginBrandStats;
};

const BRAND_IMAGE = "/images/paseo-frontviewmail.jpg";

function BrandMark({
  siteName = "The Paseo",
  siteLogo,
  className,
  inverted = false,
}: {
  siteName?: string;
  siteLogo?: string;
  className?: string;
  inverted?: boolean;
}) {
  if (siteLogo) {
    return (
      <span className={cn("relative block h-10 w-44 sm:h-11 sm:w-52", className)}>
        <Image
          src={siteLogo}
          alt={siteName}
          fill
          className={cn("object-contain", inverted ? "object-center xl:object-left" : "object-center")}
          sizes="208px"
          priority
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-serif text-3xl font-medium tracking-[0.22em]",
        inverted ? "text-white" : "text-foreground",
        className,
      )}
    >
      THE PASEO
    </span>
  );
}

function formatStat(value: number) {
  if (value >= 100) return `${value}+`;
  return String(value);
}

function BrandingPanel({
  siteName,
  siteLogo,
  stats,
}: {
  siteName?: string;
  siteLogo?: string;
  stats?: LoginBrandStats;
}) {
  const statItems = [
    { value: stats?.branches || 9, label: "Branches" },
    { value: stats?.stores || 500, label: "Stores" },
    { value: stats?.campaigns || 100, label: "Campaigns" },
  ];

  return (
    <aside className="relative hidden h-[360px] w-full shrink-0 overflow-hidden md:flex xl:h-auto xl:min-h-screen xl:w-3/5">
      <Image
        src={BRAND_IMAGE}
        alt=""
        fill
        className="object-cover object-[center_20%]"
        sizes="(min-width: 1280px) 60vw, 100vw"
        priority
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/82 via-[#1C1B19]/72 to-[#1C1B19]/55"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-8 py-7 text-center xl:items-start xl:justify-between xl:p-12 xl:text-left 2xl:p-16">
        <BrandMark siteName={siteName} siteLogo={siteLogo} inverted className="mx-auto xl:mx-0" />

        <div className="mt-5 w-full max-w-xl xl:mt-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-paseo xl:text-xl">
            THE PASEO CMS
          </p>
          <h1 className="mt-3 font-serif text-[1.75rem] font-medium leading-tight text-white md:text-3xl xl:mt-5 xl:text-5xl 2xl:text-[3.5rem] 2xl:leading-[1.12]">
            Manage every branch from one platform.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white xl:mx-0 xl:mt-5 xl:text-base 2xl:text-lg">
            Stores, Events, Promotions, Directory and Content Management.
          </p>

          <dl className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2 xl:mx-0 xl:mt-10 xl:max-w-lg xl:gap-3">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md xl:rounded-2xl xl:px-3 xl:py-4"
              >
                <dt className="sr-only">{item.label}</dt>
                <dd className="text-base font-semibold tracking-tight text-white xl:text-2xl">
                  {formatStat(item.value)}
                </dd>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/65 xl:mt-1 xl:text-[11px] xl:tracking-[0.14em]">
                  {item.label}
                </p>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-4 hidden text-xs text-white/45 xl:mt-0 xl:block">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </aside>
  );
}

export function LoginLayout({
  children,
  siteName = "The Paseo",
  siteLogo,
  stats,
}: LoginLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F3EC] xl:flex-row">
      <BrandingPanel siteName={siteName} siteLogo={siteLogo} stats={stats} />

      <section className="flex w-full flex-1 flex-col items-center justify-center px-5 py-12 sm:px-8 md:justify-start md:px-10 md:py-14 xl:w-2/5 xl:min-h-screen xl:justify-center xl:px-12 xl:py-12 2xl:px-16">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 flex justify-center md:hidden">
            <BrandMark siteName={siteName} siteLogo={siteLogo} className="h-12 w-48" />
          </div>

          <div className="w-full rounded-2xl bg-white px-6 py-8 shadow-[0_24px_64px_-28px_rgba(38,36,33,0.28)] ring-1 ring-black/[0.04] sm:px-8 sm:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-paseo-dark">
              Admin Portal
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2.125rem]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sign in to access the CMS dashboard.
            </p>

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
