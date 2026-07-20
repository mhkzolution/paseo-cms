import { EventArchiveSection } from "@/features/events/event-archive-section";
import type { BranchEvent } from "@/lib/branches/types";
import { buildEventsHref } from "@/lib/events";

type BranchEventsListProps = {
  events: BranchEvent[];
  branchSlug: string;
};

export function BranchEventsList({ events, branchSlug }: BranchEventsListProps) {
  if (!events.length) return null;

  return (
    <EventArchiveSection
      events={events}
      title="EVENT"
      viewAllHref={buildEventsHref({ branch: branchSlug })}
    />
  );
}
