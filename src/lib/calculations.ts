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

  const taxRate = combinedTaxRate;
  const taxAmount = subtotal * taxRate;
  const totalWithTax = subtotal + taxAmount;

  const totalAfterDown = Math.max(0, totalWithTax + otherFees - scenario.downPayment);
  const amountFinanced = totalAfterDown;

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
  const totalCost = scenario.downPayment + totalOfPayments;

  return {
    totalFees,
    subtotal,
    taxRate,
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
  const lifetimeTotalCost = totalFinancingCost + totalFuelCost;
  const costPerYear = effectiveYears > 0 ? lifetimeTotalCost / effectiveYears : 0;
  const costPerMonth = costPerYear / 12;

  return {
    effectiveYears,
    limitedBy,
    annualFuelCost,
    totalFuelCost,
    totalFinancingCost,
    lifetimeTotalCost,
    costPerYear,
    costPerMonth,
  };
}
