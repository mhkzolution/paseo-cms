import { MapPin, Phone } from "lucide-react";

import { resolveBranchMapsUrl } from "@/lib/branches/maps";
import type { BranchRecord } from "@/lib/branches/types";

type BranchContactProps = {
  branch: BranchRecord;
};

export function BranchContact({ branch }: BranchContactProps) {
  const mapsUrl = resolveBranchMapsUrl(branch);
  const hasContact = branch.address || branch.phone || mapsUrl;
  if (!hasContact) return null;

  return (
    <section className="border-t border-border bg-white py-16">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <p className="text-sm font-semibold uppercase text-[var(--branch-primary)]">ติดต่อสาขา</p>
        <h2 className="mt-2 text-3xl font-semibold">{branch.name}</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {branch.address ? (
              <p className="flex items-start gap-2 text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--branch-primary)]" aria-hidden="true" />
                {branch.address}
              </p>
            ) : null}
            {branch.phone ? (
              <p className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-[var(--branch-primary)]" aria-hidden="true" />
                <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="hover:text-[var(--branch-primary)]">
                  {branch.phone}
                </a>
              </p>
            ) : null}
          </div>

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-border bg-[var(--branch-background)] p-8 text-sm font-medium text-[var(--branch-primary)] hover:border-[var(--branch-primary)]"
            >
              เปิดแผนที่ Google Maps
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
