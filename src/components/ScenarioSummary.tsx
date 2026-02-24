import type { Car, FinancingScenario, Settings } from "../lib/types";
import { calculateScenario, calculateLifetimeCost } from "../lib/calculations";
import { getCombinedTaxRate } from "../lib/tax-data";
import { formatCurrency, formatPercent, FREQUENCY_LABELS } from "../lib/format";

interface ScenarioSummaryProps {
  car: Car;
  scenario: FinancingScenario;
  settings: Settings;
}

export default function ScenarioSummary(props: ScenarioSummaryProps) {
  const result = () =>
    calculateScenario(
      props.car.price,
      props.settings.fees,
      props.scenario,
      getCombinedTaxRate(props.settings.province),
      props.car.otherFees,
    );

  const lifetime = () =>
    calculateLifetimeCost(
      result(),
      props.car.fuelInputs,
      props.settings.annualKm,
      props.settings.maxCarAge,
      props.settings.mileageCap,
      props.car.vehicleYear,
      props.car.initialMileage,
      props.settings.includeFuel,
      props.settings.investmentReturn,
      props.scenario.paymentFrequency,
      props.settings.cashOnHand,
      props.car.insuranceCostPerYear,
    );

  const lifetimeLow = () =>
    calculateLifetimeCost(
      result(),
      props.car.fuelInputs,
      props.settings.annualKm * 0.8,
      props.settings.maxCarAge,
      props.settings.mileageCap,
      props.car.vehicleYear,
      props.car.initialMileage,
      props.settings.includeFuel,
      props.settings.investmentReturn,
      props.scenario.paymentFrequency,
      props.settings.cashOnHand,
      props.car.insuranceCostPerYear,
    );

  const lifetimeHigh = () =>
    calculateLifetimeCost(
      result(),
      props.car.fuelInputs,
      props.settings.annualKm * 1.2,
      props.settings.maxCarAge,
      props.settings.mileageCap,
      props.car.vehicleYear,
      props.car.initialMileage,
      props.settings.includeFuel,
      props.settings.investmentReturn,
      props.scenario.paymentFrequency,
      props.settings.cashOnHand,
      props.car.insuranceCostPerYear,
    );

  const showRange = () => props.settings.annualKm > 0;

  const hasInvestment = () =>
    props.settings.investmentReturn > 0 && props.settings.cashOnHand > 0;

  return (
    <div class="mt-4">
      <div class="stats stats-vertical w-full rounded-xl bg-base-200/60 border border-base-300/40">
        <div class="stat py-3 px-4">
          <div class="stat-title text-xs uppercase tracking-wider opacity-70">
            Payment
          </div>
          <div class="stat-value text-primary text-xl font-normal">
            {formatCurrency(result().periodicPayment)}
          </div>
          <div class="stat-desc">
            {FREQUENCY_LABELS[props.scenario.paymentFrequency]}
          </div>
        </div>
        <div class="stat py-3 px-4">
          <div class="stat-title text-xs uppercase tracking-wider opacity-70">
            Total Interest
          </div>
          <div class="stat-value text-error text-lg font-normal">
            {formatCurrency(result().totalInterest)}
          </div>
          <div class="stat-desc">{result().numberOfPayments} payments</div>
        </div>
        <div class="stat py-3 px-4">
          <div class="stat-title text-xs uppercase tracking-wider opacity-70">
            Total Cost
          </div>
          <div class="stat-value text-lg font-normal">
            {formatCurrency(result().totalCost)}
          </div>
          <div class="stat-desc">Out-of-pocket cash</div>
        </div>
        {hasInvestment() && (
          <div class="stat py-3 px-4">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70">
              Investment Gain
            </div>
            <div
              class="stat-value text-lg font-normal"
              classList={{
                "text-success": lifetime().investmentGain >= 0,
                "text-warning": lifetime().investmentGain < 0,
              }}
            >
              {lifetime().investmentGain >= 0 ? "+" : ""}
              {formatCurrency(lifetime().investmentGain)}
            </div>
            <div class="stat-desc">
              at {formatPercent(props.settings.investmentReturn)} annual return
            </div>
          </div>
        )}
      </div>

      <div class="collapse collapse-arrow bg-base-200/50 mt-4 rounded-lg border border-base-300/30">
        <input type="checkbox" />
        <div class="collapse-title text-sm font-medium py-2 min-h-0">
          Cost Breakdown
        </div>
        <div class="collapse-content text-xs space-y-1">
          <div class="flex justify-between">
            <span>Vehicle Price</span>
            <span>{formatCurrency(props.car.price)}</span>
          </div>
          <div class="flex justify-between">
            <span>Dealer Fees</span>
            <span>{formatCurrency(result().totalFees)}</span>
          </div>
          <div class="flex justify-between font-medium">
            <span>Subtotal</span>
            <span>{formatCurrency(result().subtotal)}</span>
          </div>
          <div class="divider my-1" />
          <div class="flex justify-between">
            <span>Tax ({formatPercent(result().taxRate * 100)})</span>
            <span>{formatCurrency(result().taxAmount)}</span>
          </div>
          <div class="flex justify-between font-medium">
            <span>Total with Tax</span>
            <span>{formatCurrency(result().totalWithTax)}</span>
          </div>
          {result().otherFees !== 0 && (
            <div class="flex justify-between">
              <span>Other Fees</span>
              <span classList={{ "text-success": result().otherFees < 0 }}>
                {result().otherFees < 0 ? "" : "+"}
                {formatCurrency(result().otherFees)}
              </span>
            </div>
          )}
          <div class="divider my-1" />
          <div class="flex justify-between">
            <span>Down Payment{props.scenario.payInFull ? " (Full)" : ""}</span>
            <span class="text-success">
              -{formatCurrency(
                props.scenario.payInFull
                  ? result().totalWithTax + result().otherFees
                  : props.scenario.downPayment
              )}
            </span>
          </div>
          <div class="flex justify-between font-medium">
            <span>Amount Financed</span>
            <span>{formatCurrency(result().amountFinanced)}</span>
          </div>
          <div class="divider my-1" />
          <div class="flex justify-between">
            <span>Total of Payments</span>
            <span>{formatCurrency(result().totalOfPayments)}</span>
          </div>
          {hasInvestment() && (
            <>
              <div class="divider my-1" />
              <div class="flex justify-between">
                <span>Investment Gain</span>
                <span
                  classList={{
                    "text-success": lifetime().investmentGain >= 0,
                    "text-warning": lifetime().investmentGain < 0,
                  }}
                >
                  {lifetime().investmentGain >= 0 ? "+" : ""}
                  {formatCurrency(lifetime().investmentGain)}
                </span>
              </div>
              <div class="flex justify-between font-medium">
                <span>Effective Cost</span>
                <span>{formatCurrency(result().totalCost - lifetime().investmentGain)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div class="divider text-xs my-3 opacity-70">
        Lifetime ({lifetime().effectiveYears.toFixed(1)} year
        {lifetime().limitedBy === "mileage"
          ? ` / ${props.settings.mileageCap.toLocaleString()} km`
          : ""}
        )
      </div>

      <div class="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-3">
        <div class="text-xs uppercase tracking-wider text-primary/70 font-medium">
          Cost per Year
        </div>
        <div class="text-2xl font-semibold text-primary mt-1">
          {formatCurrency(lifetime().costPerYear)}
        </div>
        <div class="text-sm text-base-content/60 mt-0.5">
          {formatCurrency(lifetime().costPerMonth)}/mo
        </div>
        {showRange() && (
          <div class="text-xs text-base-content/50 mt-1">
            {formatCurrency(lifetimeLow().costPerYear)} —{" "}
            {formatCurrency(lifetimeHigh().costPerYear)}
          </div>
        )}
      </div>

      {props.settings.includeFuel && (
        <div class="stats stats-vertical w-full bg-base-200/60 rounded-xl border border-base-300/40">
          <div class="stat py-3 px-4">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70">
              Annual Fuel
            </div>
            <div class="stat-value text-lg font-normal">
              {formatCurrency(lifetime().annualFuelCost)}
            </div>
            <div class="stat-desc">
              {formatCurrency(lifetime().totalFuelCost)} over{" "}
              {lifetime().effectiveYears.toFixed(1)} years
            </div>
            {showRange() && (
              <div class="stat-desc text-xs opacity-60">
                {formatCurrency(lifetimeLow().annualFuelCost)} —{" "}
                {formatCurrency(lifetimeHigh().annualFuelCost)}
              </div>
            )}
          </div>
        </div>
      )}
      {props.car.insuranceCostPerYear > 0 && (
        <div class="stats stats-vertical w-full bg-base-200/60 rounded-xl border border-base-300/40 mt-3">
          <div class="stat py-3 px-4">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70">
              Annual Insurance
            </div>
            <div class="stat-value text-lg font-normal">
              {formatCurrency(lifetime().annualInsuranceCost)}
            </div>
            <div class="stat-desc">
              {formatCurrency(lifetime().totalInsuranceCost)} over{" "}
              {lifetime().effectiveYears.toFixed(1)} years
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
