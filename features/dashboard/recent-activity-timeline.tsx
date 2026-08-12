import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { LocalizationSettings } from "@/lib/localization-settings";
import type { RecentActivityEvent } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const EVENT_LABELS = {
  published: "published",
  unpublished: "unpublished",
  created: "created",
  deleted: "deleted",
} as const;

const TYPE_LABELS = {
  post: "Post",
  event: "Event",
  promotion: "Promotion",
} as const;

const DOT_CLASSES = {
  published: "bg-emerald-500",
  unpublished: "bg-amber-500",
  created: "bg-paseo",
  deleted: "bg-red-400",
} as const;

type RecentActivityTimelineProps = {
  events: RecentActivityEvent[];
  localization: LocalizationSettings;
};

export function RecentActivityTimeline({ events, localization }: RecentActivityTimelineProps) {
  return (
    <section aria-labelledby="recent-activity-heading" className="space-y-3">
      <h2 id="recent-activity-heading" className="text-sm font-semibold text-foreground">
        Recent activity
      </h2>

      {events.length === 0 ? (
        <p className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No recent content activity.
        </p>
      ) : (
        <ul className="space-y-4 rounded-md border border-border bg-surface p-4">
          {events.map((event) => (
            <li key={`${event.contentType}-${event.id}-${event.eventType}-${event.occurredAt}`} className="relative pl-4">
              <span
                className={cn(
                  "absolute left-0 top-2 h-2.5 w-2.5 rounded-full",
                  DOT_CLASSES[event.eventType],
                )}
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                <span className="text-muted">
                  {TYPE_LABELS[event.contentType]} {EVENT_LABELS[event.eventType]} ·
                </span>{" "}
                <Link href={event.href} className="font-medium hover:underline">
                  {event.title}
                </Link>
              </p>
              <p className="text-xs text-muted">{formatDate(event.occurredAt, localization)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
