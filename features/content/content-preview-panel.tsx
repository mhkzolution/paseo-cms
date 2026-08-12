"use client";

import Image from "next/image";
import { CalendarDays, ChevronRight, Clock3, MapPin } from "lucide-react";

import { CONTENT_PROSE_CLASS } from "@/lib/content-prose";
import { cn } from "@/lib/utils";

const PAGE_WIDTH = 1100;
const PANEL_WIDTH = 520;
const PREVIEW_SCALE = PANEL_WIDTH / PAGE_WIDTH;

type ContentPreviewType = "post" | "event" | "promotion";

interface ContentPreviewPanelProps {
  type: ContentPreviewType;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  eventDate?: string;
  eventEndDate?: string;
  location?: string;
  promotionCategory?: string;
  className?: string;
}

export function ContentPreviewPanel({
  type,
  title,
  subtitle,
  excerpt,
  content,
  featuredImage,
  coverImageAlt,
  coverImageCaption,
  eventDate,
  eventEndDate,
  location,
  promotionCategory,
  className,
}: ContentPreviewPanelProps) {
  const pageLabel =
    type === "post" ? "หน้าข่าว/บทความ" : type === "event" ? "หน้ากิจกรรม" : "หน้าโปรโมชัน";

  return (
    <aside
      className={cn(
        "sticky top-6 flex h-[calc(100vh-3rem)] w-[520px] shrink-0 flex-col gap-3",
        className,
      )}
    >
      <div className="shrink-0 rounded-lg border border-border bg-background px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">ตัวอย่างหน้าเว็บ</p>
        <p className="mt-0.5 text-sm text-muted">{pageLabel}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <ScaledPageFrame>
        {type === "post" ? (
          <PostPagePreview
            title={title}
            subtitle={subtitle}
            content={content}
            featuredImage={featuredImage}
            coverImageAlt={coverImageAlt}
            coverImageCaption={coverImageCaption}
          />
        ) : null}

        {type === "event" ? (
          <EventPagePreview
            title={title}
            subtitle={subtitle}
            content={content}
            featuredImage={featuredImage}
            coverImageAlt={coverImageAlt}
            coverImageCaption={coverImageCaption}
            eventDate={eventDate}
            eventEndDate={eventEndDate}
            location={location}
          />
        ) : null}

        {type === "promotion" ? (
          <PromotionPagePreview
            title={title}
            subtitle={subtitle}
            excerpt={excerpt}
            content={content}
            featuredImage={featuredImage}
            coverImageAlt={coverImageAlt}
            coverImageCaption={coverImageCaption}
            promotionCategory={promotionCategory}
          />
        ) : null}
        </ScaledPageFrame>
      </div>

      <p className="shrink-0 px-1 text-[11px] leading-4 text-muted">
        แสดงตำแหน่งและสัดส่วนเดียวกับหน้าเว็บจริง (ย่อสัดส่วน {Math.round(PREVIEW_SCALE * 100)}%)
      </p>
    </aside>
  );
}

function ScaledPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border shadow-sm" style={{ width: PANEL_WIDTH }}>
      <div style={{ width: PAGE_WIDTH, zoom: PREVIEW_SCALE }}>{children}</div>
    </div>
  );
}

function PostPagePreview({
  title,
  subtitle,
  content,
  featuredImage,
  coverImageAlt,
  coverImageCaption,
}: {
  title: string;
  subtitle?: string;
  content?: string;
  featuredImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
}) {
  return (
    <article className="bg-[#FCFAF6] text-foreground">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8 sm:py-12 lg:py-16">
        <header className="relative">
          <div className="min-w-0 text-center sm:pr-14 sm:text-left">
            <h1 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.035em] text-foreground sm:text-4xl sm:leading-[1.12] lg:text-5xl">
              {title || <PreviewPlaceholder>ชื่อเรื่อง</PreviewPlaceholder>}
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
              <span>1 ส.ค. 2568</span>
              <span aria-hidden="true"> · </span>
              <span>10:00 น.</span>
            </p>
          </div>
        </header>

        {featuredImage ? (
          <figure className="mt-8 sm:mt-10">
            <div className="relative aspect-[1000/751] w-full overflow-hidden bg-[#F3F1EC]">
              <Image
                src={featuredImage}
                alt={coverImageAlt || title || "Cover preview"}
                fill
                className="object-cover"
                sizes="1100px"
              />
            </div>
            {coverImageCaption ? (
              <figcaption className="mt-3 text-xs leading-5 text-muted">{coverImageCaption}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <section className="mt-4 border-t border-black/[0.1] pt-4 sm:mt-12 sm:pt-12">
          {subtitle ? (
            <h2 className="max-w-3xl text-3xl font-semibold leading-[1.4] tracking-[-0.025em] text-foreground sm:text-3xl sm:leading-[1.35]">
              {subtitle}
            </h2>
          ) : null}

          {content ? (
            <div
              className={cn(CONTENT_PROSE_CLASS, "mt-8 text-foreground")}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="mt-8 text-base text-muted">เนื้อหาจะแสดงตรงนี้</p>
          )}
        </section>
      </div>
    </article>
  );
}

function EventPagePreview({
  title,
  subtitle,
  content,
  featuredImage,
  coverImageAlt,
  coverImageCaption,
  eventDate,
  eventEndDate,
  location,
}: {
  title: string;
  subtitle?: string;
  content?: string;
  featuredImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  eventDate?: string;
  eventEndDate?: string;
  location?: string;
}) {
  const dateLabel = formatPreviewDateRange(eventDate, eventEndDate);

  return (
    <article className="bg-white text-foreground">
      <div className="mx-auto w-full max-w-[1100px] px-5 pt-16 sm:px-8 sm:pt-10 lg:pt-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted sm:text-sm">
          <span>หน้าหลัก</span>
          <ChevronRight className="h-3.5 w-3.5 text-black/30" aria-hidden="true" />
          <span>กิจกรรม</span>
        </nav>

        <header className="pb-4 pt-4 sm:pb-10 sm:pt-14 lg:pb-12 lg:pt-10">
          <h1 className="max-w-5xl text-[2rem] font-semibold leading-[1.15] tracking-[-0.035em] text-foreground sm:text-5xl sm:leading-[1.12] lg:text-[3.5rem]">
            {title || <PreviewPlaceholder>ชื่อกิจกรรม</PreviewPlaceholder>}
          </h1>
        </header>

        {featuredImage ? (
          <figure>
            <div className="relative aspect-[1000/751] w-full overflow-hidden bg-[#F3F1EC]">
              <Image
                src={featuredImage}
                alt={coverImageAlt || title || "Cover preview"}
                fill
                className="object-cover"
                sizes="1100px"
              />
            </div>
            {coverImageCaption ? (
              <figcaption className="mt-3 text-xs leading-5 text-muted">{coverImageCaption}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <section className="grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20 lg:py-16">
          <div className="max-w-2xl">
            {subtitle ? (
              <h2 className="text-[1.25rem] font-semibold leading-[1.4] tracking-[-0.025em] text-foreground sm:text-3xl sm:leading-[1.35]">
                {subtitle}
              </h2>
            ) : null}
          </div>

          <dl className="border-t border-black/[0.1]">
            <PreviewMetaRow icon={CalendarDays} label="วันที่" value={dateLabel || "—"} />
            <PreviewMetaRow icon={Clock3} label="เวลา" value={eventDate ? "10:00 น." : "—"} />
            <PreviewMetaRow icon={MapPin} label="สถานที่" value={location || "—"} />
          </dl>
        </section>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8">
        <div className="border-t border-black/[0.1]">
          <div className="mx-auto max-w-[760px] py-12 sm:py-16 lg:py-20">
            {content ? (
              <div
                className={CONTENT_PROSE_CLASS}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-base text-muted">เนื้อหาจะแสดงตรงนี้</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PromotionPagePreview({
  title,
  subtitle,
  excerpt,
  content,
  featuredImage,
  coverImageAlt,
  coverImageCaption,
  promotionCategory,
}: {
  title: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  promotionCategory?: string;
}) {
  return (
    <article className="bg-[#FCFAF6] text-foreground">
      <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <span>Home</span>
          <span className="px-2">/</span>
          <span>Promotions</span>
        </nav>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase text-paseo">
            {promotionCategory || "โปรโมชัน"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            {title || <PreviewPlaceholder>ชื่อโปรโมชัน</PreviewPlaceholder>}
          </h1>
          {subtitle ? <p className="mt-2 text-xl leading-8 text-muted">{subtitle}</p> : null}
          {excerpt ? <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{excerpt}</p> : null}

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-paseo" aria-hidden="true" />
              1 ส.ค. – 31 ส.ค. 2568
            </span>
          </div>
        </header>

        {featuredImage ? (
          <figure className="mt-6">
            <Image
              src={featuredImage}
              alt={coverImageAlt || title || "Cover preview"}
              width={1600}
              height={2000}
              className="h-auto w-full rounded-2xl"
            />
            {coverImageCaption ? (
              <figcaption className="mt-2 text-sm text-muted">{coverImageCaption}</figcaption>
            ) : null}
          </figure>
        ) : null}

        {content ? (
          <div
            className={cn(CONTENT_PROSE_CLASS, "mt-6 text-foreground")}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="mt-6 text-base text-muted">เนื้อหาจะแสดงตรงนี้</p>
        )}
      </div>
    </article>
  );
}

function PreviewMetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_72px_minmax(0,1fr)] gap-3 border-b border-black/[0.08] py-4">
      <Icon className="mt-0.5 h-[18px] w-[18px] text-paseo-dark" strokeWidth={1.75} aria-hidden="true" />
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium leading-6 text-foreground">{value}</dd>
    </div>
  );
}

function PreviewPlaceholder({ children }: { children: React.ReactNode }) {
  return <span className="font-normal italic text-muted">{children}</span>;
}

function formatPreviewDateRange(start?: string, end?: string) {
  if (!start) return "";
  if (!end || start === end) return start;
  return `${start} – ${end}`;
}
