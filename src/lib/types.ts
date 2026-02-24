export type Province =
  | "AB"
  | "BC"
  | "MB"
  | "NB"
  | "NL"
  | "NT"
  | "NS"
  | "NU"
  | "ON"
  | "PE"
  | "QC"
  | "SK"
  | "YT";

export type PaymentFrequency =
  | "monthly"
  | "biweekly"
  | "semimonthly"
  | "weekly";

export interface DealershipFees {
  freightPdi: number;
  airConditioningTax: number;
  tireLevy: number;
  dealerFee: number;
}

export interface FuelInputs {
  fuelConsumption: number;
  fuelPricePerLitre: number;
}

export interface Settings {
  province: Province;
  fees: DealershipFees;
  maxCarAge: number;
  mileageCap: number;
  annualKm: number;
  includeFuel: boolean;
  investmentReturn: number;
  cashOnHand: number;
}

export interface FinancingScenario {
  id: string;
  label: string;
  interestRate: number;
  loanTermMonths: number;
  downPayment: number;
  payInFull: boolean;
  paymentFrequency: PaymentFrequency;
}

export interface CarOverrides {
  annualKm?: number | null;
  includeFuel?: boolean | null;
  maxCarAge?: number | null;
  mileageCap?: number | null;
}

export interface Car {
  id: string;
  label: string;
  description: string;
  price: number;
  vehicleYear: number;
  initialMileage: number;
  otherFees: number;
  insuranceCostPerYear: number;
  fuelInputs: FuelInputs;
  overrides: CarOverrides;
  scenarios: FinancingScenario[];
  activeScenarioIndex: number;
}

export interface AppState {
  settings: Settings;
  cars: Car[];
}

export interface CalculationResult {
  totalFees: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
  otherFees: number;
  amountFinanced: number;
  periodicPayment: number;
  numberOfPayments: number;
  totalOfPayments: number;
  totalInterest: number;
  totalCost: number;
}

export interface LifetimeCostResult {
  effectiveYears: number;
  limitedBy: "years" | "mileage";
  annualFuelCost: number;
  totalFuelCost: number;
  annualInsuranceCost: number;
  totalInsuranceCost: number;
  totalFinancingCost: number;
  investmentGain: number;
  lifetimeTotalCost: number;
  costPerYear: number;
  costPerMonth: number;
}
