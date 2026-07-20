import type { BranchRecord } from "@/lib/branches/types";
import { LEASING_FAQS } from "@/lib/leasing-faqs";

import { LeasingBranchesSection } from "./leasing-branches-section";
import { LeasingFaqSection } from "./leasing-faq-section";
import { LeasingForm } from "./leasing-form";

type LeasingPageContentProps = {
  branches: BranchRecord[];
  recaptchaSiteKey: string;
};

export function LeasingPageContent({ branches, recaptchaSiteKey }: LeasingPageContentProps) {
  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#9B8459]">พื้นที่เช่า</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1F2937] sm:text-4xl">สนใจเช่าพื้นที่กับเดอะพาซิโอ</h1>
          <p className="mt-4 text-[15px] leading-7 text-[#6B7280]">
            ร่วมเป็นส่วนหนึ่งของชุมชนเชิงพาณิชย์ที่มีชีวิตชีวา ส่งข้อมูลธุรกิจของคุณเพื่อให้ทีมงานติดต่อกลับ
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-sm sm:mt-12 sm:p-8 lg:p-10">
          <LeasingForm branches={branches} recaptchaSiteKey={recaptchaSiteKey} />
        </section>

        <div className="mt-16 sm:mt-20">
          <LeasingFaqSection faqs={LEASING_FAQS} />
        </div>

        <div className="mt-16 sm:mt-20">
          <LeasingBranchesSection branches={branches} />
        </div>
      </div>
    </div>
  );
}
