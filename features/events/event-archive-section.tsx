import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";

import type { ArchiveEvent } from "@/lib/events";
import { buildEventsHref } from "@/lib/events";
import { cn } from "@/lib/utils";

import { EventCard } from "./event-card";

interface EventArchiveSectionProps {
  events: ArchiveEvent[];
  title?: string;
  viewAllHref?: string;
  className?: string;
  compact?: boolean;
}

export function EventArchiveSection({
  events,
  title = "EVENT",
  viewAllHref = "/events",
  className,
  compact = false,
}: EventArchiveSectionProps) {
  if (!events.length) return null;

  return (
    <section className={cn("bg-paseo py-12 sm:py-16", className)}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h2>
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white"
          >
            เพิ่มเติม
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className={cn("mt-6 grid gap-6 sm:gap-8", compact ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3")}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface EventArchivePageGridProps {
  events: ArchiveEvent[];
  emptyMessage?: string;
}

export function EventArchivePageGrid({ events, emptyMessage = "ยังไม่มีกิจกรรมในขณะนี้" }: EventArchivePageGridProps) {
  if (!events.length) {
    return <p className="py-16 text-center text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} imageClassName="rounded-xl" />
      ))}
    </div>
  );
}

export function EventBranchFilter({
  branches,
  activeSlug,
}: {
  branches: Array<{ name: string; slug: string }>;
  activeSlug?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <FilterChip href="/events" active={!activeSlug} label="ทุกสาขา" />
      {branches.map((branch) => (
        <FilterChip
          key={branch.slug}
          href={buildEventsHref({ branch: branch.slug })}
          active={activeSlug === branch.slug}
          label={branch.name}
        />
      ))}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-white"
          : "rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:border-foreground"
      }
    >
      {label}
    </Link>
  );
}
