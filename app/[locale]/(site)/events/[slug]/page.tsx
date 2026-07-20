import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { notFound } from "next/navigation";

import { EventList } from "@/features/events/event-list";
import { EventAlbumGallery } from "@/features/events/event-album-gallery";
import { ShareMenu } from "@/features/events/share-menu";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import {
  formatEventDate,
  formatEventDateRange,
  formatEventTime,
  getHomeStyleEvents,
  toHomeArchiveEvent,
} from "@/lib/events";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SETTINGS,
  getSettings,
  SETTINGS_KEYS,
} from "@/lib/settings";
import {
  buildRobots,
  toAbsoluteUrl,
} from "@/lib/seo";

export const revalidate = 300;

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

type EventDetail = Prisma.EventGetPayload<{
  include: {
    author: true;
    seo: true;
    tags: { include: { tag: true } };
    branches: { include: { branch: true } };
    relatedFrom: { include: { relatedEvent: true } };
    alternateLinks: true;
    faqs: true;
    images: true;
  };
}>;

export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: "PUBLISHED",
    },
    select: {
      slug: true,
    },
    take: 1000,
  });

  return events.map((event) => ({
    slug: event.slug,
  }));
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;

  const [settings, event] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),

    prisma.event.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: "PUBLISHED",
      },
      include: {
        seo: true,
        alternateLinks: true,
      },
    }),
  ]);

  if (!event) return {};

  const baseUrl = settings.siteUrl.replace(/\/$/, "");
  const seo = event.seo;

  const canonical =
    seo?.canonicalUrl ||
    `${baseUrl}/events/${event.slug}`;

  const title =
    seo?.seoTitle ||
    event.title;

  const description =
    seo?.seoDescription ||
    event.subtitle ||
    event.excerpt ||
    undefined;

  const image =
    seo?.ogImage ||
    event.featuredImage ||
    undefined;

  return {
    metadataBase: new URL(baseUrl),

    title,
    description,

    keywords:
      seo?.keywords ||
      undefined,

    alternates: {
      canonical,

      languages: Object.fromEntries(
        event.alternateLinks.map((alternate) => [
          alternate.locale,
          alternate.url,
        ]),
      ),
    },

    openGraph: {
      type: "website",

      title:
        seo?.ogTitle ||
        title,

      description:
        seo?.ogDescription ||
        description,

      url: canonical,
      siteName: settings.siteName,

      images: image
        ? [
            {
              url: toAbsoluteUrl(
                baseUrl,
                image,
              ),
              alt:
                event.coverImageAlt ||
                title,
            },
          ]
        : undefined,
    },

    twitter: {
      card:
        seo?.twitterCard === "SUMMARY"
          ? "summary"
          : "summary_large_image",

      title:
        seo?.twitterTitle ||
        seo?.ogTitle ||
        title,

      description:
        seo?.twitterDescription ||
        seo?.ogDescription ||
        description,

      images:
        seo?.twitterImage || image
          ? [
              toAbsoluteUrl(
                baseUrl,
                seo?.twitterImage ||
                  image ||
                  "",
              ),
            ]
          : undefined,
    },

    robots: buildRobots({
      noindex: seo?.noindex,
      nofollow: seo?.nofollow,
      noarchive: seo?.noarchive,
      nosnippet: seo?.nosnippet,
      maxSnippet: seo?.maxSnippet,
      maxImagePreview:
        seo?.maxImagePreview,
      maxVideoPreview:
        seo?.maxVideoPreview,
    }),
  };
}

export default async function EventPage({
  params,
}: EventPageProps) {
  const { slug } = await params;

  const [settings, event] = await Promise.all([
    getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS),

    prisma.event.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: "PUBLISHED",
      },

      include: {
        author: true,
        seo: true,

        tags: {
          include: {
            tag: true,
          },
        },

        branches: {
          include: {
            branch: true,
          },
        },

        relatedFrom: {
          include: {
            relatedEvent: {
              include: {
                branches: {
                  select: {
                    branch: {
                      select: {
                        name: true,
                        nameTh: true,
                        nameEn: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        alternateLinks: true,

        faqs: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        images: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
  ]);

  if (!event) notFound();

  const baseUrl = settings.siteUrl.replace(/\/$/, "");

  const canonical =
    event.seo?.canonicalUrl ||
    `${baseUrl}/events/${event.slug}`;

  const shareUrl = canonical;

  const relatedEvents = event.relatedFrom
    .map((item) => item.relatedEvent)
    .filter(
      (item) =>
        item.status === "PUBLISHED" &&
        !item.deletedAt,
    );

  const moreEvents = await getHomeStyleEvents({
    excludeId: event.id,
    limit: 6,
    branchId: event.branches[0]?.branchId,
  });

  const displayMoreEvents = relatedEvents.length
    ? relatedEvents.slice(0, 6).map((item) => toHomeArchiveEvent(item))
    : moreEvents;

  const jsonLd = buildEventJsonLd({
    event,
    siteName: settings.siteName,
    canonical,
  });

  const customJsonLd =
    event.seo?.customJsonLd;

  const branchNames = event.branches.map((item) => getBranchThaiName(item.branch));
  const locationLabel = branchNames.length
    ? branchNames.join(" · ")
    : event.location?.trim() || "";

  return (
    <main className="min-h-screen bg-white text-foreground">
      <article>
        {/* ========================================
            ARTICLE HEADER
        ======================================== */}
        <div className="mx-auto w-full max-w-[1100px] px-5 pt-16 sm:px-8 sm:pt-10 lg:pt-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted sm:text-sm"
          >
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              หน้าหลัก
            </Link>

            <ChevronRight
              className="h-3.5 w-3.5 text-black/30"
              aria-hidden="true"
            />

            <Link
              href="/events"
              className="transition-colors hover:text-foreground"
            >
              กิจกรรม
            </Link>
          </nav>

          {/* H1 */}
          <header className="pb-4 pt-4 sm:pb-10 sm:pt-14 lg:pb-12 lg:pt-10">
            <h1 className="max-w-5xl text-[2rem] font-semibold leading-[1.15] tracking-[-0.035em] text-foreground sm:text-5xl sm:leading-[1.12] lg:text-[3.5rem]">
              {event.h1 || event.title}
            </h1>
          </header>

          {/* ========================================
              FEATURED IMAGE — 1000 × 751
          ======================================== */}
          {event.featuredImage ? (
            <figure>
              <div className="relative aspect-[1000/751] w-full overflow-hidden bg-[#F3F1EC]">
                <Image
                  src={event.featuredImage}
                  alt={
                    event.coverImageAlt ||
                    event.title
                  }
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1200px) 1100px, 100vw"
                />
              </div>

              {event.coverImageCaption ? (
                <figcaption className="mt-3 text-xs leading-5 text-muted">
                  {event.coverImageCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {/* ========================================
              SUBTITLE + EVENT META
          ======================================== */}
          <section className="grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20 lg:py-16">
            {/* Left */}
            <div className="max-w-2xl">
              {event.subtitle ? (
                <h2 className="text-[1.25rem] font-semibold leading-[1.4] tracking-[-0.025em] text-foreground sm:text-3xl sm:leading-[1.35]">
                  {event.subtitle}
                </h2>
              ) : null}
            </div>

            {/* Right */}
            <dl className="border-t border-black/[0.1]">
              {/* Date */}
              <div className="grid grid-cols-[24px_72px_minmax(0,1fr)] gap-3 border-b border-black/[0.08] py-4">
                <CalendarDays
                  className="mt-0.5 h-[18px] w-[18px] text-paseo-dark"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />

                <dt className="text-sm text-muted">
                  วันที่
                </dt>

                <dd className="text-sm font-medium leading-6 text-foreground">
                  {formatEventDateRange(event.eventDate, event.eventEndDate)}
                </dd>
              </div>

              {/* Time */}
              <div className="grid grid-cols-[24px_72px_minmax(0,1fr)] gap-3 border-b border-black/[0.08] py-4">
                <Clock3
                  className="mt-0.5 h-[18px] w-[18px] text-paseo-dark"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />

                <dt className="text-sm text-muted">
                  เวลา
                </dt>

                <dd className="text-sm font-medium leading-6 text-foreground">
                  {formatEventTime(event.eventDate)}
                  {" น."}
                </dd>
              </div>

              {/* Location */}
              {locationLabel ? (
                <div className="grid grid-cols-[24px_72px_minmax(0,1fr)] gap-3 border-b border-black/[0.08] py-4">
                  <MapPin
                    className="mt-0.5 h-[18px] w-[18px] text-paseo-dark"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />

                  <dt className="text-sm text-muted">
                    สถานที่
                  </dt>

                  <dd className="text-sm font-medium leading-6 text-foreground">
                    {locationLabel}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        {/* ========================================
            CONTENT
        ======================================== */}
        <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8">
          <div className="border-t border-black/[0.1]">
            <div className="mx-auto max-w-[760px] py-12 sm:py-16 lg:py-20">
              <div
                className="
                  prose prose-neutral max-w-none

                  prose-headings:font-semibold
                  prose-headings:tracking-[-0.025em]
                  prose-headings:text-foreground

                  prose-h2:mb-5
                  prose-h2:mt-12
                  prose-h2:text-2xl
                  sm:prose-h2:text-3xl

                  prose-h3:mb-4
                  prose-h3:mt-10
                  prose-h3:text-xl

                  prose-p:my-6
                  prose-p:text-[16px]
                  prose-p:leading-8
                  prose-p:text-[#4B5563]

                  prose-a:font-medium
                  prose-a:text-paseo-dark
                  prose-a:no-underline
                  hover:prose-a:underline

                  prose-strong:font-semibold
                  prose-strong:text-foreground

                  prose-ul:my-6
                  prose-ol:my-6

                  prose-li:my-2
                  prose-li:leading-7
                  prose-li:text-[#4B5563]
                  prose-li:marker:text-paseo-dark

                  prose-blockquote:border-l-paseo
                  prose-blockquote:text-foreground

                  prose-img:my-10
                  prose-img:max-w-full
                  prose-img:h-auto
                  prose-img:rounded-none
                "
                dangerouslySetInnerHTML={{
                  __html: event.content,
                }}
              />

              <EventAlbumGallery
                images={event.images.map((image) => ({
                  id: image.id,
                  url: image.url,
                  alt: image.alt,
                  caption: image.caption,
                }))}
              />

              {/* ========================================
                  POST FOOTER
              ======================================== */}
              <footer className="mt-14 border-t border-black/[0.1] pt-6">
                <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                  {/* Tags + Branches */}
                  <div className="space-y-3">
                    {event.branches.length ? (
                      <div className="flex flex-wrap gap-2">
                        {event.branches.map((item) => (
                          <span
                            key={item.branchId}
                            className="rounded-full bg-paseo/10 px-3 py-1.5 text-xs font-medium text-paseo-dark"
                          >
                            {item.branch.name}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {event.tags.length ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {event.tags.map((item) => (
                          <span
                            key={item.tagId}
                            className="text-xs text-muted"
                          >
                            #{item.tag.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Share — Bottom Right */}
                  <div className="shrink-0 self-end">
                    <ShareMenu
                      url={shareUrl}
                      title={event.title}
                      variant="inline"
                    />
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>

        {/* ========================================
            JSON-LD
        ======================================== */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        {customJsonLd ? (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html:
                JSON.stringify(customJsonLd),
            }}
          />
        ) : null}
      </article>

      {/* ========================================
          MORE EVENTS
      ======================================== */}
      {displayMoreEvents.length ? (
        <section className="bg-[#FCFAF6] py-8 sm:py-10 lg:py-10 px-4">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
                Event
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                MORE EVENT
              </h2>
            </div>

            <EventList events={displayMoreEvents} className="mt-9" />

            <div className="mt-12 flex justify-center sm:mt-14">
              <Link
                href="/events"
                className="group inline-flex items-center gap-3 rounded-full border border-black/[0.1] bg-white px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-paseo-dark/40 hover:bg-paseo-dark hover:text-white"
              >
                ดูกิจกรรมทั้งหมด
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function buildEventJsonLd({
  event,
  siteName,
  canonical,
}: {
  event: EventDetail;
  siteName: string;
  canonical: string;
}) {
  return {
    "@context": "https://schema.org",

    "@type": "Event",

    name:
      event.h1 ||
      event.title,

    description:
      event.seo?.seoDescription ||
      event.subtitle ||
      event.excerpt ||
      undefined,

    image: event.featuredImage
      ? [event.featuredImage]
      : undefined,

    startDate:
      event.eventDate.toISOString(),

    endDate: event.eventEndDate?.toISOString(),

    eventAttendanceMode:
      "https://schema.org/OfflineEventAttendanceMode",

    eventStatus:
      "https://schema.org/EventScheduled",

    location: event.location
      ? {
          "@type": "Place",
          name: event.location,
        }
      : undefined,

    organizer: {
      "@type": "Organization",
      name: siteName,
    },

    url: canonical,
  };
}