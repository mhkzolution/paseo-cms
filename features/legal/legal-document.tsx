import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
  contactEmail?: string;
};

export function LegalDocument({
  eyebrow,
  title,
  description,
  effectiveDate,
  sections,
  contactEmail,
}: LegalDocumentProps) {
  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#9B8459]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1F2937] sm:text-4xl">{title}</h1>
          <p className="mt-4 text-[15px] leading-7 text-[#6B7280]">{description}</p>
          <p className="mt-3 text-sm text-[#9CA3AF]">มีผลตั้งแต่วันที่ {effectiveDate}</p>
        </header>

        <nav aria-label="สารบัญ" className="mt-10 rounded-2xl border border-[#E8E2D8] bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold text-[#1F2937]">สารบัญ</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-6 text-[#374151]">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-[#688E22] underline-offset-2 hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-xl font-semibold text-[#1F2937] sm:text-2xl">{section.title}</h2>
              <div className="mt-4 space-y-3 text-[15px] leading-7 text-[#374151] [&_a]:text-[#688E22] [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {contactEmail ? (
          <footer className="mt-14 rounded-2xl border border-[#E8E2D8] bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold text-[#1F2937]">ติดต่อสอบถาม</p>
            <p className="mt-2 text-[15px] leading-7 text-[#6B7280]">
              หากมีคำถามเกี่ยวกับเอกสารนี้ กรุณาติดต่อ{" "}
              <a href={`mailto:${contactEmail}`} className="font-medium text-[#688E22] underline underline-offset-2">
                {contactEmail}
              </a>
            </p>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
