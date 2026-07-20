import { toBangkokDateInputValue, toBangkokDateTimeInputValue } from "@/lib/datetime";

export function toDateInputValue(date: Date | string | null | undefined): string {
  return toBangkokDateInputValue(date);
}

export function toDateTimeInputValue(date: Date | string | null | undefined): string {
  return toBangkokDateTimeInputValue(date);
}
