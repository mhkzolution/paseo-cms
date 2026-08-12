import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { buildEventHref } from "@/lib/slug";

import type { ArchiveEvent } from "@/lib/events";
import { formatDateRangeWithSettings } from "@/lib/datetime";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: ArchiveEvent;
  className?: string;
  imageClassName?: string;
}

export async function EventCard({ event, className, imageClassName }: EventCardProps) {
  const settings = await getLocalizationSettings();
  const dateRangeLabel = formatDateRangeWithSettings(event.eventDate, event.eventEndDate, settings);

  return (
    <Link href={buildEventHref(event.slug)} className={cn("group block", className)}>
      <div className={cn("relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/20", imageClassName)}>
        {event.featuredImage ? (
          <Image
            src={event.featuredImage}
            alt={event.coverImageAlt || event.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#24211D]/10 px-6 text-center text-sm font-medium text-foreground/70">
            {event.title}
          </div>
        )}
      </div>
      <article className="mt-4">
        <p className="line-clamp-4 text-sm leading-6 text-foreground">{event.excerpt || event.title}</p>
        <p className="mt-2 text-xs text-foreground/70">
          {dateRangeLabel}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </article>
    </Link>
  );
}
