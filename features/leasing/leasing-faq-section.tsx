"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { LeasingFaq } from "@/lib/leasing-faqs";
import { cn } from "@/lib/utils";

type LeasingFaqSectionProps = {
  faqs: LeasingFaq[];
};

export function LeasingFaqSection({ faqs }: LeasingFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="leasing-faq-heading">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#9B8459]">FAQ</p>
      <h2 id="leasing-faq-heading" className="mt-2 text-2xl font-semibold text-[#1F2937] sm:text-3xl">
        คำถามที่พบบ่อย
      </h2>

      <div className="mt-6 divide-y divide-[#E8E2D8] rounded-2xl border border-[#E8E2D8] bg-white">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={faq.question}>
              <h3>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-[15px] font-medium text-[#1F2937] sm:text-base">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-[#9B8459] transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-[15px] leading-7 text-[#6B7280] sm:px-6 sm:pb-6">{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
