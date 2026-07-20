import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { HomeArchiveEvent } from "@/lib/events";
import { cn } from "@/lib/utils";

import { EventList } from "@/features/events/event-list";

type HomeEventsSectionProps = {
  events: HomeArchiveEvent[];
  className?: string;
};

export function HomeEventsSection({
  events,
  className,
}: HomeEventsSectionProps) {
  return (
    <section
      id="events"
      className={cn(
        "scroll-mt-[72px] bg-[#FCFAF6] py-8 sm:py-20 lg:py-24 px-4",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
            Event
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            กิจกรรมที่น่าสนใจ
          </h2>
        </div>

        {events.length ? (
          <>
            <EventList events={events} className="mt-9" />

            {/* View All */}
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
          </>
        ) : (
          <div className="mt-9 rounded-2xl border border-black/[0.06] bg-white px-6 py-12 text-center">
            <p className="text-sm text-muted">
              ยังไม่มีกิจกรรมในขณะนี้
            </p>
          </div>
        )}
      </div>
    </section>
  );
}