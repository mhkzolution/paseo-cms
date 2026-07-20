export const STORE_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type StoreDayKey = (typeof STORE_DAY_KEYS)[number];

export type StoreOperatingHour = {
  day: StoreDayKey;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export const STORE_DAY_LABELS: Record<StoreDayKey, string> = {
  mon: "จันทร์",
  tue: "อังคาร",
  wed: "พุธ",
  thu: "พฤหัสบดี",
  fri: "ศุกร์",
  sat: "เสาร์",
  sun: "อาทิตย์",
};

export function createDefaultOperatingHours(): StoreOperatingHour[] {
  return STORE_DAY_KEYS.map((day) => ({
    day,
    isOpen: day !== "sun",
    openTime: "10:00",
    closeTime: "22:00",
  }));
}

export function parseOperatingHours(value: unknown): StoreOperatingHour[] {
  if (!Array.isArray(value)) return createDefaultOperatingHours();

  const byDay = new Map<StoreDayKey, StoreOperatingHour>();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const day = (item as StoreOperatingHour).day;
    if (!STORE_DAY_KEYS.includes(day)) continue;

    byDay.set(day, {
      day,
      isOpen: Boolean((item as StoreOperatingHour).isOpen),
      openTime: typeof (item as StoreOperatingHour).openTime === "string" ? (item as StoreOperatingHour).openTime : "10:00",
      closeTime:
        typeof (item as StoreOperatingHour).closeTime === "string" ? (item as StoreOperatingHour).closeTime : "22:00",
    });
  }

  return STORE_DAY_KEYS.map((day) => byDay.get(day) ?? { day, isOpen: false, openTime: "10:00", closeTime: "22:00" });
}

const BANGKOK_TZ = "Asia/Bangkok";
const JS_DAY_TO_STORE_DAY: StoreDayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export type StoreOpenStatus = {
  isOpen: boolean;
  label: "เปิด" | "ปิด";
  detail: string;
  today: StoreDayKey;
};

function timeToMinutes(time: string): number {
  const parts = time.split(":").map((part) => Number(part));
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function formatStoreTime(time: string): string {
  return time.slice(0, 5);
}

export function getBangkokDayKey(date = new Date()): StoreDayKey {
  const bangkokDate = new Date(date.toLocaleString("en-US", { timeZone: BANGKOK_TZ }));
  return JS_DAY_TO_STORE_DAY[bangkokDate.getDay()] ?? "mon";
}

export function getBangkokMinutes(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function getStoreOpenStatus(operatingHours: StoreOperatingHour[], date = new Date()): StoreOpenStatus {
  const today = getBangkokDayKey(date);
  const nowMinutes = getBangkokMinutes(date);
  const schedule = operatingHours.find((item) => item.day === today);

  if (!schedule?.isOpen) {
    return { isOpen: false, label: "ปิด", detail: "ปิดทำการวันนี้", today };
  }

  const openMinutes = timeToMinutes(schedule.openTime);
  const closeMinutes = timeToMinutes(schedule.closeTime);
  const closeLabel = formatStoreTime(schedule.closeTime);
  const openLabel = formatStoreTime(schedule.openTime);

  if (nowMinutes < openMinutes) {
    return { isOpen: false, label: "ปิด", detail: `เปิดเวลา ${openLabel} น.`, today };
  }

  if (nowMinutes >= closeMinutes) {
    return { isOpen: false, label: "ปิด", detail: `ปิดเวลา ${closeLabel} น.`, today };
  }

  return { isOpen: true, label: "เปิด", detail: `ปิดเวลา ${closeLabel} น.`, today };
}

