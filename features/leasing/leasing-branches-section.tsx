import { MapPin, Phone } from "lucide-react";

import { getBranchConfig, isBranchSlug } from "@/lib/branches/branch-config";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import type { BranchRecord } from "@/lib/branches/types";

type LeasingBranchesSectionProps = {
  branches: BranchRecord[];
};

function BranchInfoCard({ branch }: { branch: BranchRecord }) {
  const displayName = getBranchThaiName(branch);
  const theme = isBranchSlug(branch.slug) ? getBranchConfig(branch.slug).theme : null;
  const accent = theme?.primary ?? "#688E22";

  return (
    <article className="rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-sm sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: accent }}>
        สาขา
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[#1F2937]">{displayName}</h3>

      <div className="mt-5 space-y-4">
        {branch.address ? (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} aria-hidden="true" />
            <p className="text-[15px] leading-7 text-[#374151]">{branch.address}</p>
          </div>
        ) : null}

        {branch.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 shrink-0" style={{ color: accent }} aria-hidden="true" />
            <a
              href={`tel:${branch.phone.replace(/\s/g, "")}`}
              className="text-[15px] font-medium text-[#1F2937] hover:underline"
            >
              {branch.phone}
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function LeasingBranchesSection({ branches }: LeasingBranchesSectionProps) {
  return (
    <section aria-labelledby="leasing-branches-heading">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#9B8459]">สาขาของเรา</p>
      <h2 id="leasing-branches-heading" className="mt-2 text-2xl font-semibold text-[#1F2937] sm:text-3xl">
        ข้อมูลสาขาทั้งหมด
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#6B7280]">
        ติดต่อสอบถามรายละเอียดพื้นที่เช่าได้ที่สาขาที่สนใจ
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {branches.length > 0 ? (
          branches.map((branch) => <BranchInfoCard key={branch.id} branch={branch} />)
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-[#D8D0C4] bg-white px-6 py-12 text-center text-[#6B7280]">
            ยังไม่มีข้อมูลสาขาในระบบ
          </div>
        )}
      </div>
    </section>
  );
}
