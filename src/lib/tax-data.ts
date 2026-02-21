import type { Province } from "./types";

export interface ProvinceTaxInfo {
  name: string;
  code: Province;
  taxes: { label: string; rate: number }[];
  combinedRate: number;
}

export const PROVINCE_TAX_DATA: Record<Province, ProvinceTaxInfo> = {
  AB: {
    name: "Alberta",
    code: "AB",
    taxes: [{ label: "GST", rate: 0.05 }],
    combinedRate: 0.05,
  },
  BC: {
    name: "British Columbia",
    code: "BC",
    taxes: [
      { label: "GST", rate: 0.05 },
      { label: "PST", rate: 0.07 },
    ],
    combinedRate: 0.12,
  },
  MB: {
    name: "Manitoba",
    code: "MB",
    taxes: [
      { label: "GST", rate: 0.05 },
      { label: "RST", rate: 0.07 },
    ],
    combinedRate: 0.12,
  },
  NB: {
    name: "New Brunswick",
    code: "NB",
    taxes: [{ label: "HST", rate: 0.15 }],
    combinedRate: 0.15,
  },
  NL: {
    name: "Newfoundland & Labrador",
    code: "NL",
    taxes: [{ label: "HST", rate: 0.15 }],
    combinedRate: 0.15,
  },
  NT: {
    name: "Northwest Territories",
    code: "NT",
    taxes: [{ label: "GST", rate: 0.05 }],
    combinedRate: 0.05,
  },
  NS: {
    name: "Nova Scotia",
    code: "NS",
    taxes: [{ label: "HST", rate: 0.15 }],
    combinedRate: 0.15,
  },
  NU: {
    name: "Nunavut",
    code: "NU",
    taxes: [{ label: "GST", rate: 0.05 }],
    combinedRate: 0.05,
  },
  ON: {
    name: "Ontario",
    code: "ON",
    taxes: [{ label: "HST", rate: 0.13 }],
    combinedRate: 0.13,
  },
  PE: {
    name: "Prince Edward Island",
    code: "PE",
    taxes: [{ label: "HST", rate: 0.15 }],
    combinedRate: 0.15,
  },
  QC: {
    name: "Quebec",
    code: "QC",
    taxes: [
      { label: "GST", rate: 0.05 },
      { label: "QST", rate: 0.09975 },
    ],
    combinedRate: 0.14975,
  },
  SK: {
    name: "Saskatchewan",
    code: "SK",
    taxes: [
      { label: "GST", rate: 0.05 },
      { label: "PST", rate: 0.06 },
    ],
    combinedRate: 0.11,
  },
  YT: {
    name: "Yukon",
    code: "YT",
    taxes: [{ label: "GST", rate: 0.05 }],
    combinedRate: 0.05,
  },
};

export function getCombinedTaxRate(province: Province): number {
  return PROVINCE_TAX_DATA[province].combinedRate;
}
