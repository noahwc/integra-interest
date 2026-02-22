import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateScenario,
  calculateInvestmentGain,
  calculateLifetimeCost,
} from "./calculations";
import type { DealershipFees, FinancingScenario, FuelInputs } from "./types";

// ── Fixtures ──────────────────────────────────────────

const ZERO_FEES: DealershipFees = {
  freightPdi: 0,
  airConditioningTax: 0,
  tireLevy: 0,
  dealerFee: 0,
};

const DEFAULT_FEES: DealershipFees = {
  freightPdi: 1800,
  airConditioningTax: 100,
  tireLevy: 15,
  dealerFee: 500,
};

const ON_TAX = 0.13;

const DEFAULT_FUEL: FuelInputs = {
  fuelConsumption: 8.5,
  fuelPricePerLitre: 1.65,
};

function makeScenario(
  overrides: Partial<FinancingScenario> = {},
): FinancingScenario {
  return {
    id: "test",
    label: "Test",
    interestRate: 6.99,
    loanTermMonths: 72,
    downPayment: 0,
    payInFull: false,
    paymentFrequency: "monthly",
    ...overrides,
  };
}

/** Standard financing result: $35k car, default fees, ON 13%, $0 down, 6.99%, 72mo monthly */
function standardResult() {
  return calculateScenario(35000, DEFAULT_FEES, makeScenario(), ON_TAX);
}

// ── calculateScenario ─────────────────────────────────

describe("calculateScenario", () => {
  describe("standard Ontario scenario ($35k, 6.99%, 72mo, monthly)", () => {
    const result = calculateScenario(
      35000,
      DEFAULT_FEES,
      makeScenario(),
      ON_TAX,
    );

    it("computes fees and subtotal", () => {
      expect(result.totalFees).toBe(2415);
      expect(result.subtotal).toBe(37415);
    });

    it("computes tax", () => {
      expect(result.taxRate).toBe(0.13);
      expect(result.taxAmount).toBeCloseTo(4863.95, 2);
      expect(result.totalWithTax).toBeCloseTo(42278.95, 2);
    });

    it("computes amount financed with $0 down", () => {
      expect(result.amountFinanced).toBeCloseTo(42278.95, 2);
    });

    it("computes 72 monthly payments", () => {
      expect(result.numberOfPayments).toBe(72);
    });

    it("computes periodic payment", () => {
      expect(result.periodicPayment).toBeCloseTo(720.61, 2);
    });

    it("computes total of payments and interest", () => {
      expect(result.totalOfPayments).toBeCloseTo(51884.0, 0);
      expect(result.totalInterest).toBeCloseTo(9605.05, 2);
    });

    it("computes total cost (down + payments)", () => {
      expect(result.totalCost).toBeCloseTo(51884.0, 0);
    });
  });

  describe("payment frequencies", () => {
    it("biweekly: 156 payments", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ paymentFrequency: "biweekly" }),
        ON_TAX,
      );
      expect(result.numberOfPayments).toBe(156);
      expect(result.periodicPayment).toBeCloseTo(332.17, 2);
      expect(result.totalInterest).toBeCloseTo(9539.8, 1);
    });

    it("semimonthly: 144 payments", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ paymentFrequency: "semimonthly" }),
        ON_TAX,
      );
      expect(result.numberOfPayments).toBe(144);
      expect(result.periodicPayment).toBeCloseTo(359.88, 2);
      expect(result.totalInterest).toBeCloseTo(9544.46, 2);
    });

    it("weekly: 312 payments", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ paymentFrequency: "weekly" }),
        ON_TAX,
      );
      expect(result.numberOfPayments).toBe(312);
      expect(result.periodicPayment).toBeCloseTo(166.0, 1);
      expect(result.totalInterest).toBeCloseTo(9511.81, 2);
    });
  });

  it("handles zero interest rate", () => {
    const result = calculateScenario(
      35000,
      DEFAULT_FEES,
      makeScenario({ interestRate: 0 }),
      ON_TAX,
    );
    expect(result.amountFinanced).toBeCloseTo(42278.95, 2);
    expect(result.periodicPayment).toBeCloseTo(587.21, 2);
    expect(result.totalOfPayments).toBeCloseTo(42278.95, 2);
    expect(result.totalInterest).toBeCloseTo(0, 2);
  });

  describe("down payment", () => {
    it("partial down payment ($10,000)", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ downPayment: 10000 }),
        ON_TAX,
      );
      expect(result.amountFinanced).toBeCloseTo(32278.95, 2);
      expect(result.periodicPayment).toBeCloseTo(550.17, 2);
      expect(result.totalInterest).toBeCloseTo(7333.22, 2);
      expect(result.totalCost).toBeCloseTo(49612.17, 1);
    });

    it("down payment exceeds total (cash purchase)", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ downPayment: 50000 }),
        ON_TAX,
      );
      expect(result.amountFinanced).toBe(0);
      expect(result.periodicPayment).toBe(0);
      expect(result.totalOfPayments).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalCost).toBe(50000);
    });

    it("down payment exactly equals totalWithTax", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ downPayment: 42278.95 }),
        ON_TAX,
      );
      expect(result.amountFinanced).toBeCloseTo(0, 2);
      expect(result.periodicPayment).toBe(0);
      expect(result.totalCost).toBeCloseTo(42278.95, 2);
    });

    it("payInFull covers full cost with no financing", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ payInFull: true }),
        ON_TAX,
      );
      expect(result.amountFinanced).toBe(0);
      expect(result.periodicPayment).toBe(0);
      expect(result.totalOfPayments).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalCost).toBeCloseTo(42278.95, 2);
    });

    it("payInFull with otherFees includes them in down payment", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario({ payInFull: true }),
        ON_TAX,
        500,
      );
      expect(result.amountFinanced).toBe(0);
      expect(result.totalCost).toBeCloseTo(42778.95, 2);
    });
  });

  describe("otherFees", () => {
    it("positive other fees (+$500)", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario(),
        ON_TAX,
        500,
      );
      expect(result.otherFees).toBe(500);
      expect(result.amountFinanced).toBeCloseTo(42778.95, 2);
      expect(result.periodicPayment).toBeCloseTo(729.13, 2);
    });

    it("negative other fees / rebate (-$2,000)", () => {
      const result = calculateScenario(
        35000,
        DEFAULT_FEES,
        makeScenario(),
        ON_TAX,
        -2000,
      );
      expect(result.otherFees).toBe(-2000);
      expect(result.amountFinanced).toBeCloseTo(40278.95, 2);
      expect(result.periodicPayment).toBeCloseTo(686.52, 2);
    });
  });
});

// ── calculateInvestmentGain ───────────────────────────

describe("calculateInvestmentGain", () => {
  // Standard scenario: $35k car, default fees, ON 13%, $0 down, 6.99%, 72mo monthly
  // effectiveDown = totalCost - totalOfPayments = 0 (since downPayment = 0)
  const std = standardResult();
  const effectiveDown = std.totalCost - std.totalOfPayments; // 0
  const PMT = std.periodicPayment;
  const N = std.numberOfPayments;

  describe("gain vs. loss scenarios", () => {
    it("positive gain at 10% return with $50k cash", () => {
      const gain = calculateInvestmentGain(50000, effectiveDown, PMT, N, 10, "monthly");
      expect(gain).toBeCloseTo(22063.61, 2);
    });

    it("positive gain at 3% return with $50k cash", () => {
      const gain = calculateInvestmentGain(50000, effectiveDown, PMT, N, 3, "monthly");
      expect(gain).toBeCloseTo(4962.12, 2);
    });

    it("positive gain at 1% return with $50k cash", () => {
      const gain = calculateInvestmentGain(50000, effectiveDown, PMT, N, 1, "monthly");
      expect(gain).toBeCloseTo(1525.32, 2);
    });
  });

  describe("cashOnHand / effectiveDown variations", () => {
    it("partial cash after down payment", () => {
      // $60k cash, $10k down => $50k invested, same as standard with $50k cash & $0 down
      const gain = calculateInvestmentGain(60000, 10000, PMT, N, 10, "monthly");
      expect(gain).toBeCloseTo(22063.61, 2);
    });

    it("cash equals down payment leaves nothing to invest", () => {
      const gain = calculateInvestmentGain(10000, 10000, PMT, N, 10, "monthly");
      expect(gain).toBe(0);
    });

    it("cash less than down payment returns 0", () => {
      const gain = calculateInvestmentGain(5000, 10000, PMT, N, 10, "monthly");
      expect(gain).toBe(0);
    });
  });

  describe("edge cases (guard clauses return 0)", () => {
    it("returns 0 when annualInvestmentRate = 0", () => {
      expect(calculateInvestmentGain(50000, 0, PMT, N, 0, "monthly")).toBe(0);
    });

    it("returns 0 when cashOnHand = 0", () => {
      expect(calculateInvestmentGain(0, 0, PMT, N, 7, "monthly")).toBe(0);
    });

    it("returns 0 when numberOfPayments = 0", () => {
      expect(calculateInvestmentGain(50000, 0, PMT, 0, 7, "monthly")).toBe(0);
    });

    it("returns 0 when initialInvested <= 0", () => {
      expect(calculateInvestmentGain(1000, 5000, PMT, N, 7, "monthly")).toBe(0);
    });
  });

  it("works with biweekly frequency", () => {
    const bw = calculateScenario(
      35000,
      DEFAULT_FEES,
      makeScenario({ paymentFrequency: "biweekly" }),
      ON_TAX,
    );
    const bwDown = bw.totalCost - bw.totalOfPayments; // 0
    const gain = calculateInvestmentGain(
      30000,
      bwDown,
      bw.periodicPayment,
      bw.numberOfPayments,
      7,
      "biweekly",
    );
    // $30k invested, biweekly payments converted to monthly, compounding monthly over 72 months
    expect(gain).toBeCloseTo(3252.35, 2);
  });
});

// ── calculateLifetimeCost ─────────────────────────────

describe("calculateLifetimeCost", () => {
  // Freeze time to 2026 so effectiveYears calculations are deterministic
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const std = () => standardResult();

  it("age-limited: new 2026 car, fuel on, no investment", () => {
    const result = calculateLifetimeCost(
      std(),
      DEFAULT_FUEL,
      15000,
      15,
      300000,
      2026,
      0,
      true,
      0,
      "monthly",
      0,
    );
    expect(result.effectiveYears).toBe(15);
    expect(result.limitedBy).toBe("years");
    expect(result.annualFuelCost).toBeCloseTo(2103.75, 2);
    expect(result.totalFuelCost).toBeCloseTo(31556.25, 2);
    expect(result.investmentGain).toBe(0);
    expect(result.costPerYear).toBeCloseTo(5562.68, 1);
    expect(result.costPerMonth).toBeCloseTo(463.56, 1);
  });

  it("mileage-limited: 2020 car, 120k km initial", () => {
    const result = calculateLifetimeCost(
      std(),
      DEFAULT_FUEL,
      20000,
      15,
      200000,
      2020,
      120000,
      true,
      0,
      "monthly",
      0,
    );
    expect(result.effectiveYears).toBe(4);
    expect(result.limitedBy).toBe("mileage");
    expect(result.annualFuelCost).toBeCloseTo(2805.0, 2);
    expect(result.totalFuelCost).toBeCloseTo(11220.0, 2);
    expect(result.costPerYear).toBeCloseTo(15776.0, 0);
    expect(result.costPerMonth).toBeCloseTo(1314.67, 1);
  });

  it("fuel OFF excludes fuel cost", () => {
    const result = calculateLifetimeCost(
      std(),
      DEFAULT_FUEL,
      15000,
      15,
      300000,
      2026,
      0,
      false,
      0,
      "monthly",
      0,
    );
    expect(result.annualFuelCost).toBe(0);
    expect(result.totalFuelCost).toBe(0);
    expect(result.costPerYear).toBeCloseTo(3458.93, 1);
    expect(result.costPerMonth).toBeCloseTo(288.24, 1);
  });

  it("zero km/yr: mileage unlimited, fuel = 0", () => {
    const result = calculateLifetimeCost(
      std(),
      DEFAULT_FUEL,
      0,
      15,
      300000,
      2026,
      0,
      true,
      0,
      "monthly",
      0,
    );
    expect(result.effectiveYears).toBe(15);
    expect(result.limitedBy).toBe("years");
    expect(result.annualFuelCost).toBe(0);
    expect(result.costPerYear).toBeCloseTo(3458.93, 1);
  });

  it("subtracts investment gain from lifetime cost", () => {
    const s = std();
    const result = calculateLifetimeCost(
      s,
      DEFAULT_FUEL,
      15000,
      15,
      300000,
      2026,
      0,
      true,
      10,
      "monthly",
      s.amountFinanced,
    );
    expect(result.investmentGain).toBeCloseTo(15750.93, 2);
    expect(result.costPerYear).toBeCloseTo(4512.62, 1);
    expect(result.costPerMonth).toBeCloseTo(376.05, 1);
  });

  it("returns zero cost rates when car is past maxAge", () => {
    const result = calculateLifetimeCost(
      std(),
      DEFAULT_FUEL,
      15000,
      15,
      300000,
      2010,
      0,
      true,
      0,
      "monthly",
      0,
    );
    expect(result.effectiveYears).toBe(0);
    expect(result.costPerYear).toBe(0);
    expect(result.costPerMonth).toBe(0);
  });
});

// ── Cross-validation against external references ──────

describe("cross-validation", () => {
  it("matches Bankrate reference: $30k at 6.89% for 60mo = $592.48/mo", () => {
    const result = calculateScenario(
      30000,
      ZERO_FEES,
      makeScenario({
        interestRate: 6.89,
        loanTermMonths: 60,
        downPayment: 0,
        paymentFrequency: "monthly",
      }),
      0,
    );
    expect(result.amountFinanced).toBe(30000);
    expect(result.numberOfPayments).toBe(60);
    expect(result.periodicPayment).toBeCloseTo(592.48, 2);
    expect(result.totalOfPayments).toBeCloseTo(35548.81, 1);
    expect(result.totalInterest).toBeCloseTo(5548.81, 1);
  });
});
