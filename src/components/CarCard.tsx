import { Show } from "solid-js";
import type {
  Car,
  CarOverrides,
  FinancingScenario,
  FuelInputs,
  Settings,
} from "../lib/types";
import { calculateScenario, calculateLifetimeCost, optimizeDownPayment } from "../lib/calculations";
import { getCombinedTaxRate } from "../lib/tax-data";
import {
  formatCurrency,
  parseNumericInput,
  FREQUENCY_LABELS,
} from "../lib/format";
import ScenarioTabs from "./ScenarioTabs";
import ScenarioForm from "./ScenarioForm";
import ScenarioSummary from "./ScenarioSummary";

interface CarCardProps {
  car: Car;
  settings: Settings;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onUpdateLabel: (label: string) => void;
  onUpdateDescription: (desc: string) => void;
  onUpdatePrice: (price: number) => void;
  onUpdateVehicleYear: (year: number) => void;
  onUpdateInitialMileage: (km: number) => void;
  onUpdateOtherFees: (amount: number) => void;
  onUpdateFuelInput: <K extends keyof FuelInputs>(
    field: K,
    value: number,
  ) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onSetActiveScenario: (index: number) => void;
  onAddScenario: () => void;
  onDuplicateScenario: (scenarioId: string) => void;
  onRemoveScenario: (scenarioId: string) => void;
  onUpdateScenario: <K extends keyof FinancingScenario>(
    scenarioId: string,
    field: K,
    value: FinancingScenario[K],
  ) => void;
  onUpdateOverride: <K extends keyof CarOverrides>(
    field: K,
    value: CarOverrides[K],
  ) => void;
}

export default function CarCard(props: CarCardProps) {
  const activeScenario = () =>
    props.car.scenarios[props.car.activeScenarioIndex];

  const summaryResult = () => {
    const scenario = activeScenario();
    if (!scenario) return null;
    return calculateScenario(
      props.car.price,
      props.settings.fees,
      scenario,
      getCombinedTaxRate(props.settings.province),
      props.car.otherFees,
    );
  };

  const lifetimeResult = () => {
    const result = summaryResult();
    if (!result) return null;
    const s = effectiveSettings();
    const scenario = activeScenario();
    if (!scenario) return null;
    return calculateLifetimeCost(
      result,
      props.car.fuelInputs,
      s.annualKm,
      s.maxCarAge,
      s.mileageCap,
      props.car.vehicleYear,
      props.car.initialMileage,
      s.includeFuel,
      s.investmentReturn,
      scenario.paymentFrequency,
      s.cashOnHand,
    );
  };

  const effectiveSettings = (): Settings => ({
    ...props.settings,
    annualKm: props.car.overrides.annualKm ?? props.settings.annualKm,
    includeFuel: props.car.overrides.includeFuel ?? props.settings.includeFuel,
    maxCarAge: props.car.overrides.maxCarAge ?? props.settings.maxCarAge,
    mileageCap: props.car.overrides.mileageCap ?? props.settings.mileageCap,
  });

  const hasOverrides = () =>
    props.car.overrides.annualKm != null ||
    props.car.overrides.includeFuel != null ||
    props.car.overrides.maxCarAge != null ||
    props.car.overrides.mileageCap != null;

  const handleOptimize = () => {
    const scenario = activeScenario();
    if (!scenario) return;
    const s = effectiveSettings();
    const optimal = optimizeDownPayment(
      props.car.price,
      s.fees,
      scenario,
      getCombinedTaxRate(s.province),
      props.car.otherFees,
      props.car.fuelInputs,
      s.annualKm,
      s.maxCarAge,
      s.mileageCap,
      props.car.vehicleYear,
      props.car.initialMileage,
      s.includeFuel,
      s.investmentReturn,
      s.cashOnHand,
    );
    if (scenario.payInFull) {
      props.onUpdateScenario(scenario.id, "payInFull", false);
    }
    props.onUpdateScenario(scenario.id, "downPayment", optimal);
  };

  return (
    <div
      class="card bg-base-100 border border-base-300/50 shadow-sm rounded-2xl w-full lg:flex-shrink-0 transition-[width] duration-300 ease-in-out"
      classList={{
        "lg:w-64": props.collapsed,
        "lg:w-[26rem]": !props.collapsed,
      }}
    >
      <div class="card-body p-5 lg:p-6">
        <div class="flex items-center gap-2">
          <button
            class="btn btn-ghost btn-sm btn-circle"
            onClick={() => props.onToggleCollapsed()}
            title={props.collapsed ? "Expand card" : "Collapse card"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 transition-transform duration-300"
              classList={{ "-rotate-90": props.collapsed }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <input
            type="text"
            class="input input-ghost font-light tracking-tight flex-1 px-1 rounded-lg"
            classList={{
              "input-sm text-lg": props.collapsed,
              "text-xl": !props.collapsed,
            }}
            value={props.car.label}
            onInput={(e) => props.onUpdateLabel(e.currentTarget.value)}
          />
          <Show when={!props.collapsed}>
            <button
              class="btn btn-ghost btn-sm btn-circle opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => props.onDuplicate()}
              title="Duplicate car"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7zm2 1v8h8V8H6z" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-sm btn-circle text-error opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => props.onRemove()}
              title="Remove car"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </Show>
        </div>

        <div
          class="card-section"
          classList={{
            "card-section-open": props.collapsed,
            "card-section-closed": !props.collapsed,
          }}
        >
          <div>
            <Show when={summaryResult()}>
              <div class="flex justify-between items-center text-sm px-1 pt-1">
                <span>
                  <span class="font-semibold text-primary">
                    {formatCurrency(summaryResult()!.periodicPayment)}
                  </span>
                  <span class="opacity-70">
                    {" "}
                    {FREQUENCY_LABELS[
                      activeScenario()!.paymentFrequency
                    ].toLowerCase()}
                  </span>
                </span>
              </div>
              <Show when={lifetimeResult()}>
                <div class="text-xs opacity-60 px-1 pt-0.5">
                  {formatCurrency(lifetimeResult()!.costPerYear)}/yr
                </div>
              </Show>
            </Show>
          </div>
        </div>

        <div
          class="card-section"
          classList={{
            "card-section-open": !props.collapsed,
            "card-section-closed": props.collapsed,
          }}
        >
          <div>
            <textarea
              class="textarea textarea-bordered textarea-sm w-full resize-none leading-snug"
              placeholder="Notes..."
              rows="2"
              value={props.car.description}
              onInput={(e) => props.onUpdateDescription(e.currentTarget.value)}
            />

            <div class="grid grid-cols-3 gap-3 mt-3">
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text text-xs uppercase tracking-wider opacity-70">
                    Vehicle Price
                  </span>
                </label>
                <label class="input input-bordered input-sm flex items-center gap-1">
                  $
                  <input
                    type="number"
                    inputmode="numeric"
                    class="grow w-full"
                    min="0"
                    step="500"
                    value={props.car.price}
                    onInput={(e) => {
                      const v = parseNumericInput(e.currentTarget.value);
                      if (v !== undefined) props.onUpdatePrice(v);
                    }}
                  />
                </label>
              </div>
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text text-xs uppercase tracking-wider opacity-70">
                    Year
                  </span>
                </label>
                <input
                  type="number"
                  inputmode="numeric"
                  class="input input-bordered input-sm w-full"
                  min="1990"
                  max={new Date().getFullYear() + 2}
                  step="1"
                  value={props.car.vehicleYear}
                  onInput={(e) => {
                    const v = parseNumericInput(e.currentTarget.value);
                    if (v !== undefined)
                      props.onUpdateVehicleYear(Math.round(v));
                  }}
                />
              </div>
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text text-xs uppercase tracking-wider opacity-70">
                    Odometer
                  </span>
                </label>
                <input
                  type="number"
                  inputmode="numeric"
                  class="input input-bordered input-sm w-full"
                  min="0"
                  step="1000"
                  value={props.car.initialMileage}
                  onInput={(e) => {
                    const v = parseNumericInput(e.currentTarget.value);
                    if (v !== undefined)
                      props.onUpdateInitialMileage(Math.round(v));
                  }}
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label py-1 mt-4">
                <span class="label-text text-xs uppercase tracking-wider opacity-70">
                  Other Fees (post-tax)
                </span>
              </label>
              <label class="input input-bordered input-sm w-full flex items-center gap-1">
                $
                <input
                  type="number"
                  inputmode="numeric"
                  class="grow w-full"
                  step="100"
                  value={props.car.otherFees}
                  onInput={(e) => {
                    const v = parseNumericInput(
                      e.currentTarget.value,
                      -Infinity,
                    );
                    if (v !== undefined) props.onUpdateOtherFees(v);
                  }}
                />
              </label>
            </div>

            <Show when={effectiveSettings().includeFuel}>
              <div class="grid grid-cols-2 gap-3">
                <div class="form-control">
                  <label class="label py-1">
                    <span class="label-text text-xs uppercase tracking-wider opacity-70">
                      L/100km
                    </span>
                  </label>
                  <input
                    type="number"
                    inputmode="decimal"
                    class="input input-bordered input-sm w-full"
                    min="0"
                    step="0.1"
                    value={props.car.fuelInputs.fuelConsumption}
                    onInput={(e) => {
                      const v = parseNumericInput(e.currentTarget.value);
                      if (v !== undefined)
                        props.onUpdateFuelInput("fuelConsumption", v);
                    }}
                  />
                </div>
                <div class="form-control">
                  <label class="label py-1">
                    <span class="label-text text-xs uppercase tracking-wider opacity-70">
                      $/L
                    </span>
                  </label>
                  <input
                    type="number"
                    inputmode="decimal"
                    class="input input-bordered input-sm w-full"
                    min="0"
                    step="0.01"
                    value={props.car.fuelInputs.fuelPricePerLitre}
                    onInput={(e) => {
                      const v = parseNumericInput(e.currentTarget.value);
                      if (v !== undefined)
                        props.onUpdateFuelInput("fuelPricePerLitre", v);
                    }}
                  />
                </div>
              </div>
            </Show>

            <div class="collapse collapse-arrow bg-base-200/30 rounded-lg mt-4 border border-base-300/20">
              <input type="checkbox" checked={hasOverrides()} />
              <div class="collapse-title text-xs font-medium py-2 min-h-0 uppercase tracking-wider opacity-70">
                Advanced
                <Show when={hasOverrides()}>
                  <span class="ml-1 text-primary normal-case tracking-normal">
                    (custom)
                  </span>
                </Show>
              </div>
              <div class="collapse-content space-y-2">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={props.car.overrides.annualKm != null}
                    onChange={(e) => {
                      props.onUpdateOverride(
                        "annualKm",
                        e.currentTarget.checked
                          ? props.settings.annualKm
                          : null,
                      );
                    }}
                  />
                  <span class="text-xs w-20 shrink-0">km/year</span>
                  <input
                    type="number"
                    inputmode="numeric"
                    class="input input-bordered input-sm flex-1"
                    min="0"
                    step="1000"
                    disabled={props.car.overrides.annualKm == null}
                    value={
                      props.car.overrides.annualKm ?? props.settings.annualKm
                    }
                    onInput={(e) => {
                      const v = parseNumericInput(e.currentTarget.value);
                      if (v !== undefined)
                        props.onUpdateOverride("annualKm", Math.round(v));
                    }}
                  />
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={props.car.overrides.includeFuel != null}
                    onChange={(e) => {
                      props.onUpdateOverride(
                        "includeFuel",
                        e.currentTarget.checked
                          ? props.settings.includeFuel
                          : null,
                      );
                    }}
                  />
                  <span class="text-xs w-20 shrink-0">Fuel</span>
                  <input
                    type="checkbox"
                    class="toggle toggle-sm toggle-primary"
                    disabled={props.car.overrides.includeFuel == null}
                    checked={effectiveSettings().includeFuel}
                    onChange={(e) => {
                      props.onUpdateOverride(
                        "includeFuel",
                        e.currentTarget.checked,
                      );
                    }}
                  />
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={props.car.overrides.maxCarAge != null}
                    onChange={(e) => {
                      props.onUpdateOverride(
                        "maxCarAge",
                        e.currentTarget.checked
                          ? props.settings.maxCarAge
                          : null,
                      );
                    }}
                  />
                  <span class="text-xs w-20 shrink-0">Max age</span>
                  <input
                    type="number"
                    inputmode="numeric"
                    class="input input-bordered input-sm flex-1"
                    min="1"
                    max="30"
                    step="1"
                    disabled={props.car.overrides.maxCarAge == null}
                    value={
                      props.car.overrides.maxCarAge ?? props.settings.maxCarAge
                    }
                    onInput={(e) => {
                      const v = parseNumericInput(e.currentTarget.value, 1);
                      if (v !== undefined)
                        props.onUpdateOverride("maxCarAge", Math.round(v));
                    }}
                  />
                  <span class="text-xs opacity-50">years</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={props.car.overrides.mileageCap != null}
                    onChange={(e) => {
                      props.onUpdateOverride(
                        "mileageCap",
                        e.currentTarget.checked
                          ? props.settings.mileageCap
                          : null,
                      );
                    }}
                  />
                  <span class="text-xs w-20 shrink-0">Mileage cap</span>
                  <input
                    type="number"
                    inputmode="numeric"
                    class="input input-bordered input-sm flex-1"
                    min="0"
                    step="10000"
                    disabled={props.car.overrides.mileageCap == null}
                    value={
                      props.car.overrides.mileageCap ??
                      props.settings.mileageCap
                    }
                    onInput={(e) => {
                      const v = parseNumericInput(e.currentTarget.value);
                      if (v !== undefined)
                        props.onUpdateOverride("mileageCap", Math.round(v));
                    }}
                  />
                  <span class="text-xs opacity-50">km</span>
                </div>
              </div>
            </div>

            <div class="divider my-1"></div>

            <ScenarioTabs
              scenarios={props.car.scenarios}
              activeIndex={props.car.activeScenarioIndex}
              onSelect={props.onSetActiveScenario}
              onAdd={props.onAddScenario}
              onDuplicate={props.onDuplicateScenario}
              onRemove={props.onRemoveScenario}
              onRename={(id, label) =>
                props.onUpdateScenario(id, "label", label)
              }
            />

            <Show when={activeScenario()}>
              {(scenario) => (
                <>
                  <ScenarioForm
                    scenario={scenario()}
                    onUpdate={(field, value) =>
                      props.onUpdateScenario(scenario().id, field, value)
                    }
                    onOptimize={handleOptimize}
                  />
                  <ScenarioSummary
                    car={props.car}
                    scenario={scenario()}
                    settings={effectiveSettings()}
                  />
                </>
              )}
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
