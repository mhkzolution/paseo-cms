import type { LocalizationSettings } from "@/lib/localization-settings";
import { formatNumberWithSettings } from "@/lib/number";

const CURRENCY_SYMBOLS: Record<LocalizationSettings["currency"], string> = {
  THB: "฿",
  USD: "$",
  EUR: "€",
};

const CURRENCY_SUFFIXES: Record<LocalizationSettings["currency"], string> = {
  THB: "บาท",
  USD: "USD",
  EUR: "EUR",
};

export function formatCurrencyWithSettings(
  amount: number,
  settings: Pick<LocalizationSettings, "currency" | "currencyPosition" | "numberLocale">,
) {
  const formattedAmount = formatNumberWithSettings(amount, settings, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (settings.currency === "THB") {
    return settings.currencyPosition === "before"
      ? `${CURRENCY_SYMBOLS.THB}${formattedAmount}`
      : `${formattedAmount} ${CURRENCY_SUFFIXES.THB}`;
  }

  const symbol = CURRENCY_SYMBOLS[settings.currency];
  const suffix = CURRENCY_SUFFIXES[settings.currency];

  return settings.currencyPosition === "before"
    ? `${symbol}${formattedAmount}`
    : `${formattedAmount} ${suffix}`;
}
