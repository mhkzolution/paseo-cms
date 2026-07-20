import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { FaPhone } from "react-icons/fa6";

import { StoreStatusBadge } from "@/features/stores/store-status-badge";
import type { StoreDetail } from "@/lib/stores";
import { buildStoresHref } from "@/lib/stores";
import {
  formatStoreTime,
  getStoreOpenStatus,
  STORE_DAY_KEYS,
  STORE_DAY_LABELS,
} from "@/lib/stores/operating-hours";
import { cn } from "@/lib/utils";

type StoreSingleContentProps = {
  store: StoreDetail;
  listingQuery?: { category?: string; branch?: string };
};

export function StoreSingleContent({ store, listingQuery }: StoreSingleContentProps) {
  const status = getStoreOpenStatus(store.operatingHours);
  const phones = [...new Set([store.phone1, store.phone2].filter(Boolean))] as string[];
  const backHref = buildStoresHref({
    branch: listingQuery?.branch ?? store.branch.slug,
    category: listingQuery?.category,
  });

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      {store.cover ? (
        <section className="relative aspect-[21/9] w-full bg-[#E8E2D8] sm:aspect-[3/1]">
          <Image src={store.cover} alt={store.name} fill priority className="object-cover" sizes="100vw" />
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          กลับไปรายการร้านค้า
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{store.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StoreStatusBadge isOpen={status.isOpen} className="px-3 py-1 text-xs" />
              <span className="text-sm text-muted">{status.detail}</span>
            </div>
          </div>

          {phones.length ? (
            <div className="flex flex-col gap-2">
              {phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone?.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2
                      bg-paseo-hover text-paseo-dark font-medium  text-sm
                      py-1.5 px-2 rounded-full 
                      hover:opacity-90 transition"
                >
                  <FaPhone className="h-6 w-6 text-white md:p-1.5 p-1 bg-paseo-dark rounded-full" aria-hidden="true" />
                  {phone}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">สาขา</dt>
            <dd className="mt-1 text-sm font-medium">{store.branch.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">หมวดหมู่</dt>
            <dd className="mt-1 text-sm font-medium">{store.category?.name ?? "ไม่ระบุหมวดหมู่"}</dd>
          </div>
          {store.floor ? (
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">ชั้น</dt>
              <dd className="mt-1 text-sm font-medium">{store.floor}</dd>
            </div>
          ) : null}
          {store.zone ? (
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">โซน</dt>
              <dd className="mt-1 text-sm font-medium">{store.zone}</dd>
            </div>
          ) : null}
          {store.location ? (
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">ที่ตั้ง</dt>
              <dd className="mt-1 inline-flex items-start gap-1.5 text-sm font-medium">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                {store.location}
              </dd>
            </div>
          ) : null}
          {store.storeType ? (
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">ประเภทร้าน</dt>
              <dd className="mt-1 text-sm font-medium">{store.storeType}</dd>
            </div>
          ) : null}
        </dl>

        {store.description ? (
          <div className="mt-6 rounded-xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold uppercase text-muted">รายละเอียด</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/90">{store.description}</p>
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold uppercase text-muted">เวลาทำการ</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-[#FCFAF6] text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">วัน</th>
                <th className="px-5 py-3 font-medium">เวลาเปิด</th>
                <th className="px-5 py-3 font-medium">เวลาปิด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STORE_DAY_KEYS.map((day) => {
                const row = store.operatingHours.find((item) => item.day === day);
                const isToday = day === status.today;

                return (
                  <tr
                    key={day}
                    className={cn(isToday && "bg-[#F0FDF4] font-bold text-[#166534]")}
                  >
                    <td className="px-5 py-3">{STORE_DAY_LABELS[day]}</td>
                    <td className="px-5 py-3">
                      {row?.isOpen ? `${formatStoreTime(row.openTime)} น.` : "ปิดทำการ"}
                    </td>
                    <td className="px-5 py-3">
                      {row?.isOpen ? `${formatStoreTime(row.closeTime)} น.` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
