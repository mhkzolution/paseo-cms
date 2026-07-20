import { Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";

type HomeMembershipSectionProps = {
  className?: string;
};

export function HomeMembershipSection({ className }: HomeMembershipSectionProps) {
  return (
    <section id="membership" className={cn("scroll-mt-[72px] bg-[#24211D] py-14 text-white sm:py-16", className)}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-paseo">Membership</p>
            <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">PaseoLife</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
              แอป PaseoLife รวมสิทธิประโยชน์ โปรโมชัน และกิจกรรมจาก The Paseo ไว้ในมือคุณ
              พร้อมให้ดาวน์โหลดบน Android และ iOS
            </p>
            <p className="mt-3 text-sm text-white/55">
              รายละเอียดเพิ่มเติมจะประกาศในภายหลัง
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-paseo text-paseo-dark">
                <Smartphone className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-semibold">ดาวน์โหลด PaseoLife</p>
                <p className="text-sm text-white/65">เร็วๆ นี้บน App Store และ Google Play</p>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-medium text-white/80"
              >
                App Store
              </button>
              <button
                type="button"
                disabled
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-medium text-white/80"
              >
                Google Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
