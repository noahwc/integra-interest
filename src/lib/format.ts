import type { PaymentFrequency } from "./types";

const currencyFmt = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Parse a number input value, returning undefined if empty or invalid. Clamps to min. */
export function parseNumericInput(value: string, min = 0): number | undefined {
  if (value === "") return undefined;
  const num = parseFloat(value);
  if (isNaN(num)) return undefined;
  return Math.max(min, num);
}

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: "Monthly",
  biweekly: "Bi-weekly",
  semimonthly: "Semi-monthly",
  weekly: "Weekly",
};
