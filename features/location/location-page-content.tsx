import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ExternalLink, MapPin, Phone } from "lucide-react";

import { getBranchConfig, isBranchSlug } from "@/lib/branches/branch-config";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import { resolveBranchMapEmbedUrl, resolveBranchMapsUrl } from "@/lib/branches/maps";
import type { BranchRecord } from "@/lib/branches/types";

type LocationPageContentProps = {
  branches: BranchRecord[];
};

function BranchLocationCard({ branch }: { branch: BranchRecord }) {
  const displayName = getBranchThaiName(branch);
  const mapsUrl = resolveBranchMapsUrl(branch);
  const embedUrl = resolveBranchMapEmbedUrl(branch);
  const theme = isBranchSlug(branch.slug) ? getBranchConfig(branch.slug).theme : null;
  const branchHref = `/branches/${branch.slug}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="p-6 sm:p-8 lg:p-10">
          <p
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: theme?.primary ?? "#688E22" }}
          >
            สาขา
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1F2937] sm:text-3xl">{displayName}</h2>

          <div className="mt-6 space-y-5">
            {branch.address ? (
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: theme?.primary ?? "#688E22" }}
                  aria-hidden="true"
                />
                <p className="text-[15px] leading-7 text-[#374151]">{branch.address}</p>
              </div>
            ) : null}

            {branch.phone ? (
              <div className="flex items-center gap-2">
                <Phone
                  className="h-5 w-5 shrink-0"
                  style={{ color: theme?.primary ?? "#688E22" }}
                  aria-hidden="true"
                />
                <a
                  href={`tel:${branch.phone.replace(/\s/g, "")}`}
                  className="text-[15px] font-medium text-[#1F2937] hover:underline"
                >
                  {branch.phone}
                </a>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#D8D0C4] px-5 py-2.5 text-sm font-medium text-[#1F2937] transition-colors hover:border-[#9B8459] hover:text-[#9B8459]"
              >
                เปิด Google Maps
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
            <Link
              href={branchHref}
              className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme?.primary ?? "#1a1a1a" }}
            >
              ดูข้อมูลสาขา
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] bg-[#F3F0EA] lg:min-h-full">
          {embedUrl ? (
            <iframe
              title={`แผนที่ ${displayName}`}
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : branch.image ? (
            <Image
              src={branch.image}
              alt={displayName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6 text-center text-sm text-[#6B7280]">
              ยังไม่มีข้อมูลแผนที่สำหรับสาขานี้
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function LocationPageContent({ branches }: LocationPageContentProps) {
  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#9B8459]">ที่ตั้ง</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1F2937] sm:text-4xl">สาขาของเดอะพาซิโอ</h1>
          <p className="mt-4 text-[15px] leading-7 text-[#6B7280]">
            ค้นหาที่อยู่ เบอร์ติดต่อ และแผนที่ของแต่ละสาขา สามารถเปิดนำทางผ่าน Google Maps ได้ทันที
          </p>
        </header>

        <div className="mt-10 grid gap-8 sm:mt-12">
          {branches.length > 0 ? (
            branches.map((branch) => <BranchLocationCard key={branch.id} branch={branch} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8D0C4] bg-white px-6 py-16 text-center text-[#6B7280]">
              ยังไม่มีข้อมูลสาขาในระบบ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
