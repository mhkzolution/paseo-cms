import Image from "next/image";

import { cn } from "@/lib/utils";

type LoginLayoutProps = {
  children: React.ReactNode;
  siteName?: string;
  siteLogo?: string;
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
      <span className={cn("relative block h-10 w-40 sm:h-11 sm:w-44", className)}>
        <Image
          src={siteLogo}
          alt={siteName}
          fill
          className="object-contain object-left"
          sizes="176px"
          priority
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-serif text-3xl font-medium tracking-[0.22em] sm:text-4xl",
        inverted ? "text-white" : "text-foreground",
        className,
      )}
    >
      THE PASEO
    </span>
  );
}

function BrandingOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1C1B19]/92 via-[#24211D]/78 to-[#688e22]/35"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />
    </>
  );
}

function BrandingContent({
  siteName,
  siteLogo,
  compact = false,
}: {
  siteName?: string;
  siteLogo?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative z-10", compact ? "px-5 py-6" : "flex h-full flex-col justify-between p-10 lg:p-14")}>
      <BrandMark siteName={siteName} siteLogo={siteLogo} inverted />

      {!compact ? (
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-paseo">
            Content Management
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-white lg:text-5xl">
            Manage your mall experience
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/72">
            Sign in to update stores, events, promotions, and everything visitors see across The Paseo branches.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-white/65">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-paseo" aria-hidden="true" />
              Multi-branch content in one place
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-paseo" aria-hidden="true" />
              Publish news, events &amp; promotions
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-paseo" aria-hidden="true" />
              Role-based access for your team
            </li>
          </ul>
        </div>
      ) : null}

      {!compact ? (
        <p className="text-xs text-white/45">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      ) : null}
    </div>
  );
}

export function LoginLayout({
  children,
  siteName = "The Paseo",
  siteLogo,
}: LoginLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile — compact branding header */}
      <header className="relative h-36 overflow-hidden md:hidden">
        <Image
          src={BRAND_IMAGE}
          alt=""
          fill
          className="object-cover object-top"
          sizes="100vw"
          priority
        />
        <BrandingOverlay />
        <div className="relative flex h-full items-end">
          <BrandingContent siteName={siteName} siteLogo={siteLogo} compact />
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-9rem)] md:min-h-screen md:grid-cols-[40%_60%] lg:grid-cols-[55%_45%]">
        {/* Desktop / Tablet — visual panel */}
        <aside className="relative hidden overflow-hidden md:block">
          <Image
            src={BRAND_IMAGE}
            alt=""
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 55vw, 40vw"
            priority
          />
          <BrandingOverlay />
          <BrandingContent siteName={siteName} siteLogo={siteLogo} />
        </aside>

        {/* Authentication panel */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8 md:mb-10">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-paseo-dark">
                Admin Portal
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Sign in with your team credentials to access the CMS dashboard.
              </p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
