import type { PaymentFrequency } from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

export const LOAN_TERM_OPTIONS = [
  { value: 12, label: "1 year" },
  { value: 24, label: "2 years" },
  { value: 36, label: "3 years" },
  { value: 48, label: "4 years" },
  { value: 60, label: "5 years" },
  { value: 72, label: "6 years" },
  { value: 84, label: "7 years" },
];
