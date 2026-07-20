"use client";

import type { StoreOperatingHour } from "@/lib/stores/operating-hours";
import { STORE_DAY_KEYS, STORE_DAY_LABELS } from "@/lib/stores/operating-hours";

interface OperatingHoursFieldProps {
  value: StoreOperatingHour[];
  onChange: (value: StoreOperatingHour[]) => void;
  error?: string;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:bg-background disabled:text-muted";

export function OperatingHoursField({ value, onChange, error }: OperatingHoursFieldProps) {
  const hoursByDay = new Map(value.map((item) => [item.day, item]));

  const updateDay = (day: StoreOperatingHour["day"], patch: Partial<StoreOperatingHour>) => {
    const next = STORE_DAY_KEYS.map((key) => {
      const current = hoursByDay.get(key) ?? { day: key, isOpen: false, openTime: "10:00", closeTime: "22:00" };
      return key === day ? { ...current, ...patch, day } : current;
    });
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">เปิด</th>
              <th className="px-3 py-2 font-medium">วัน</th>
              <th className="px-3 py-2 font-medium">เวลาเปิด</th>
              <th className="px-3 py-2 font-medium">เวลาปิด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STORE_DAY_KEYS.map((day) => {
              const row = hoursByDay.get(day) ?? { day, isOpen: false, openTime: "10:00", closeTime: "22:00" };

              return (
                <tr key={day}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.isOpen}
                      onChange={(event) => updateDay(day, { isOpen: event.target.checked })}
                      aria-label={`เปิดทำการวัน${STORE_DAY_LABELS[day]}`}
                      className="h-4 w-4 rounded border-border text-accent focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">{STORE_DAY_LABELS[day]}</td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={row.openTime}
                      disabled={!row.isOpen}
                      onChange={(event) => updateDay(day, { openTime: event.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={row.closeTime}
                      disabled={!row.isOpen}
                      onChange={(event) => updateDay(day, { closeTime: event.target.value })}
                      className={inputClass}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
