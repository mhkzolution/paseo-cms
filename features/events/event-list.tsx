import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";

import type { HomeArchiveEvent } from "@/lib/events";
import { formatEventBranchLabel } from "@/lib/events";
import {
  formatDateRangeWithSettings,
  formatTimeWithSettings,
} from "@/lib/datetime";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { buildEventHref } from "@/lib/slug";
import { cn } from "@/lib/utils";

interface EventListProps {
  events: HomeArchiveEvent[];
  className?: string;
}

export async function EventList({ events, className }: EventListProps) {
  if (!events.length) return null;

  const settings = await getLocalizationSettings();

  return (
    <ul
      className={cn(
        "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 scrollbar-hidden",
        "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0",
        "lg:grid-cols-4 lg:gap-x-6",
        className,
      )}
    >
      {events.map((event) => {
        const branchLabel = formatEventBranchLabel(event);
        const dateRangeLabel = formatDateRangeWithSettings(event.eventDate, event.eventEndDate, settings);
        const timeLabel = formatTimeWithSettings(event.eventDate, settings);

        return (
          <li
            key={event.id}
            className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <article className="group">
              <Link href={buildEventHref(event.slug)} className="block">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F0EDE8]">
                  {event.featuredImage ? (
                    <Image
                      src={event.featuredImage}
                      alt={event.coverImageAlt || event.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
                      {event.title}
                    </div>
                  )}

                  <div className="absolute right-4 top-4 hidden h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
                    <ArrowRight
                      className="h-4 w-4 -rotate-45 text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="pt-5">
                  <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-paseo-dark">
                    {event.title}
                  </h3>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <CalendarDays
                        className="h-4 w-4 shrink-0 text-paseo-dark"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted">{dateRangeLabel}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock3
                        className="h-4 w-4 shrink-0 text-paseo-dark"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted">{timeLabel}</span>
                    </div>

                    {branchLabel ? (
                      <div className="flex items-center gap-2.5">
                        <MapPin
                          className="h-4 w-4 shrink-0 text-paseo-dark"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        <span className="line-clamp-1 text-sm text-muted">{branchLabel}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
