import type {
  AppState,
  Car,
  DealershipFees,
  FinancingScenario,
  FuelInputs,
  Settings,
} from "./types";

let nextId = 0;
export function generateId(): string {
  return `${Date.now()}-${++nextId}`;
}

export function createDefaultFees(): DealershipFees {
  return {
    freightPdi: 1800,
    airConditioningTax: 100,
    tireLevy: 15,
    dealerFee: 500,
  };
}

export function createDefaultFuelInputs(): FuelInputs {
  return {
    fuelConsumption: 8.5,
    fuelPricePerLitre: 1.65,
  };
}

export function createDefaultSettings(): Settings {
  return {
    province: "ON",
    fees: createDefaultFees(),
    maxCarAge: 15,
    mileageCap: 300000,
    annualKm: 15000,
    includeFuel: true,
    investmentReturn: 0,
    cashOnHand: 0,
  };
}

export function createDefaultScenario(label?: string): FinancingScenario {
  return {
    id: generateId(),
    label: label ?? "Scenario 1",
    interestRate: 6.99,
    loanTermMonths: 60,
    downPayment: 0,
    paymentFrequency: "monthly",
  };
}

export function createDefaultCar(label?: string): Car {
  return {
    id: generateId(),
    label: label ?? "New Car",
    price: 35000,
    vehicleYear: new Date().getFullYear(),
    initialMileage: 0,
    otherFees: 0,
    fuelInputs: createDefaultFuelInputs(),
    overrides: {},
    scenarios: [createDefaultScenario()],
    activeScenarioIndex: 0,
  };
}

export function createDefaultState(): AppState {
  return {
    settings: createDefaultSettings(),
    cars: [createDefaultCar("Car 1")],
  };
}
