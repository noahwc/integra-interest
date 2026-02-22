import type {
  CalculationResult,
  DealershipFees,
  FinancingScenario,
  FuelInputs,
  LifetimeCostResult,
  PaymentFrequency,
} from "./types";

const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  monthly: 12,
  biweekly: 26,
  semimonthly: 24,
  weekly: 52,
};

export function calculateInvestmentGain(
  cashOnHand: number,
  effectiveDown: number,
  periodicPayment: number,
  numberOfPayments: number,
  annualInvestmentRate: number,
  paymentFrequency: PaymentFrequency,
): number {
  const initialInvested = cashOnHand - effectiveDown;
  if (initialInvested <= 0 || annualInvestmentRate <= 0) return 0;

  const periodsPerYear = PERIODS_PER_YEAR[paymentFrequency];
  const totalMonths = Math.round((numberOfPayments / periodsPerYear) * 12);
  if (totalMonths <= 0) return 0;

  const monthlyRate = annualInvestmentRate / 100 / 12;
  const monthlyPayment = (periodicPayment * periodsPerYear) / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const fv = initialInvested * compoundFactor - monthlyPayment * ((compoundFactor - 1) / monthlyRate);
  return fv + monthlyPayment * totalMonths - initialInvested;
}

export function calculateScenario(
  carPrice: number,
  fees: DealershipFees,
  scenario: FinancingScenario,
  combinedTaxRate: number,
  otherFees: number = 0,
): CalculationResult {
  const totalFees =
    fees.freightPdi + fees.airConditioningTax + fees.tireLevy + fees.dealerFee;
  const subtotal = carPrice + totalFees;

  const taxAmount = subtotal * combinedTaxRate;
  const totalWithTax = subtotal + taxAmount;

  const effectiveDown = scenario.payInFull
    ? totalWithTax + otherFees
    : scenario.downPayment;
  const amountFinanced = Math.max(0, totalWithTax + otherFees - effectiveDown);

  const periodsPerYear = PERIODS_PER_YEAR[scenario.paymentFrequency];
  const termYears = scenario.loanTermMonths / 12;
  const numberOfPayments = Math.round(termYears * periodsPerYear);
  const periodicRate = scenario.interestRate / 100 / periodsPerYear;

  let periodicPayment: number;
  if (amountFinanced <= 0 || numberOfPayments <= 0) {
    periodicPayment = 0;
  } else if (periodicRate === 0) {
    periodicPayment = amountFinanced / numberOfPayments;
  } else {
    const compoundFactor = Math.pow(1 + periodicRate, numberOfPayments);
    periodicPayment =
      (amountFinanced * (periodicRate * compoundFactor)) / (compoundFactor - 1);
  }

  const totalOfPayments = periodicPayment * numberOfPayments;
  const totalInterest = totalOfPayments - amountFinanced;
  const totalCost = effectiveDown + totalOfPayments;

  return {
    totalFees,
    subtotal,
    taxRate: combinedTaxRate,
    taxAmount,
    totalWithTax,
    otherFees,
    amountFinanced,
    periodicPayment,
    numberOfPayments,
    totalOfPayments,
    totalInterest,
    totalCost,
  };
}

export function calculateLifetimeCost(
  financingResult: CalculationResult,
  fuelInputs: FuelInputs,
  annualKm: number,
  maxCarAge: number,
  mileageCap: number,
  vehicleYear: number,
  initialMileage: number,
  includeFuel: boolean,
  investmentReturn: number,
  paymentFrequency: PaymentFrequency,
  cashOnHand: number,
): LifetimeCostResult {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - vehicleYear;
  const remainingYears = Math.max(0, maxCarAge - currentAge);

  const remainingKm = Math.max(0, mileageCap - initialMileage);
  const mileageYears =
    annualKm > 0 ? remainingKm / annualKm : Infinity;
  const effectiveYears = Math.min(remainingYears, mileageYears);
  const limitedBy: "years" | "mileage" =
    mileageYears <= remainingYears ? "mileage" : "years";

  const annualFuelCost = includeFuel
    ? (annualKm / 100) *
      fuelInputs.fuelConsumption *
      fuelInputs.fuelPricePerLitre
    : 0;
  const totalFuelCost = annualFuelCost * effectiveYears;
  const totalFinancingCost = financingResult.totalCost;
  const effectiveDown = totalFinancingCost - financingResult.totalOfPayments;
  const investmentGain = calculateInvestmentGain(
    cashOnHand,
    effectiveDown,
    financingResult.periodicPayment,
    financingResult.numberOfPayments,
    investmentReturn,
    paymentFrequency,
  );
  const lifetimeTotalCost = totalFinancingCost + totalFuelCost - investmentGain;
  const costPerYear = effectiveYears > 0 ? lifetimeTotalCost / effectiveYears : 0;
  const costPerMonth = costPerYear / 12;

  return {
    effectiveYears,
    limitedBy,
    annualFuelCost,
    totalFuelCost,
    totalFinancingCost,
    investmentGain,
    lifetimeTotalCost,
    costPerYear,
    costPerMonth,
  };
}
