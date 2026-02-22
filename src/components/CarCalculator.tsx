import { createStore, reconcile } from "solid-js/store";
import {
  createEffect,
  createSignal,
  For,
  Show,
  onMount,
  onCleanup,
} from "solid-js";
import type {
  AppState,
  Car,
  CarOverrides,
  DealershipFees,
  FinancingScenario,
  FuelInputs,
  Province,
} from "../lib/types";
import { loadState, saveState } from "../lib/storage";
import {
  createDefaultState,
  createDefaultCar,
  createDefaultScenario,
  createDefaultSettings,
  generateId,
} from "../lib/defaults";
import { PROVINCE_TAX_DATA } from "../lib/tax-data";
import { parseNumericInput } from "../lib/format";
import {
  encodeShareUrl,
  decodeShareParam,
  getShareParam,
  clearShareParam,
} from "../lib/sharing";
import CarCard from "./CarCard";
import AddCarButton from "./AddCarButton";
import SettingsModal from "./SettingsModal";

export default function CarCalculator() {
  const [state, setState] = createStore<AppState>(createDefaultState());
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [shareModalData, setShareModalData] = createSignal<AppState | null>(
    null,
  );
  const [copied, setCopied] = createSignal(false);
  const [collapsedIds, setCollapsedIds] = createSignal<Set<string>>(new Set());
  const [darkMode, setDarkMode] = createSignal(false);
  const [headerVisible, setHeaderVisible] = createSignal(true);
  let lastScrollY = 0;
  const SCROLL_THRESHOLD = 10;
  const [toast, setToast] = createSignal<{
    message: string;
    type: "info" | "error";
    undo?: () => void;
  } | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function showToast(
    message: string,
    type: "info" | "error" = "info",
    undo?: () => void,
  ) {
    clearTimeout(toastTimer);
    setToast({ message, type, undo });
    toastTimer = setTimeout(() => setToast(null), 3000);
  }

  function dismissToast() {
    clearTimeout(toastTimer);
    setToast(null);
  }

  function toggleCollapsed(carId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(carId)) {
        next.delete(carId);
      } else {
        next.add(carId);
      }
      return next;
    });
  }

  function toggleTheme() {
    const next = !darkMode();
    setDarkMode(next);
    const theme = next ? "nordic-dark" : "nordic";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("integra-theme", theme);
  }

  const collapsedCars = () =>
    state.cars.filter((c) => collapsedIds().has(c.id));
  const expandedCars = () =>
    state.cars.filter((c) => !collapsedIds().has(c.id));

  onMount(() => {
    const saved = loadState();
    setState(reconcile(saved));

    // Restore theme
    const currentTheme = document.documentElement.getAttribute("data-theme");
    setDarkMode(currentTheme === "nordic-dark");

    // Restore collapsed card IDs
    try {
      const raw = localStorage.getItem("integra-collapsed");
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        if (Array.isArray(ids)) setCollapsedIds(new Set(ids));
      }
    } catch {
      /* ignore */
    }

    const shareParam = getShareParam();
    if (shareParam) {
      const shared = decodeShareParam(shareParam);
      if (shared) {
        const hasExistingData =
          saved.cars.length > 1 ||
          saved.cars[0]?.price !== 35000 ||
          saved.cars[0]?.scenarios.length > 1;
        if (hasExistingData) {
          setShareModalData(shared);
        } else {
          setState(reconcile(shared));
          clearShareParam();
        }
      } else {
        clearShareParam();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (settingsOpen()) {
          setSettingsOpen(false);
        } else if (shareModalData()) {
          dismissSharedData();
        } else if (toast()) {
          dismissToast();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

    function handleScroll() {
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY) < SCROLL_THRESHOLD) return;
      setHeaderVisible(y < lastScrollY || y < 50);
      lastScrollY = y;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    onCleanup(() => window.removeEventListener("scroll", handleScroll));
  });

  // Persist collapsed IDs
  createEffect(() => {
    const ids = [...collapsedIds()];
    try {
      localStorage.setItem("integra-collapsed", JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  });

  createEffect(() => {
    saveState(JSON.stringify(state));
  });

  function addCar() {
    setState("cars", (cars) => [
      ...cars,
      createDefaultCar(`Car ${cars.length + 1}`),
    ]);
  }

  function duplicateCar(carId: string) {
    const car = state.cars.find((c) => c.id === carId);
    if (!car) return;
    const cloned: Car = {
      ...car,
      id: generateId(),
      label: `${car.label} (Copy)`,
      overrides: { ...car.overrides },
      scenarios: car.scenarios.map((s) => ({ ...s, id: generateId() })),
    };
    setState("cars", (cars) => [...cars, cloned]);
  }

  function removeCar(carId: string) {
    const car = state.cars.find((c) => c.id === carId);
    if (!car) return;
    const snapshot: Car = JSON.parse(JSON.stringify(car));
    const index = state.cars.indexOf(car);
    setState("cars", (cars) => cars.filter((c) => c.id !== carId));
    showToast(`Deleted "${snapshot.label}"`, "info", () => {
      setState("cars", (cars) => {
        const copy = [...cars];
        copy.splice(index, 0, snapshot);
        return copy;
      });
    });
  }

  function updateCarLabel(carId: string, label: string) {
    setState("cars", (c) => c.id === carId, "label", label);
  }

  function updateCarDescription(carId: string, description: string) {
    setState("cars", (c) => c.id === carId, "description", description);
  }

  function updateCarPrice(carId: string, price: number) {
    setState("cars", (c) => c.id === carId, "price", price);
  }

  function updateFuelInput<K extends keyof FuelInputs>(
    carId: string,
    field: K,
    value: number,
  ) {
    setState("cars", (c) => c.id === carId, "fuelInputs", field, value);
  }

  function updateVehicleYear(carId: string, year: number) {
    setState("cars", (c) => c.id === carId, "vehicleYear", year);
  }

  function updateInitialMileage(carId: string, km: number) {
    setState("cars", (c) => c.id === carId, "initialMileage", km);
  }

  function updateOtherFees(carId: string, amount: number) {
    setState("cars", (c) => c.id === carId, "otherFees", amount);
  }

  function updateOverride<K extends keyof CarOverrides>(
    carId: string,
    field: K,
    value: CarOverrides[K],
  ) {
    setState("cars", (c) => c.id === carId, "overrides", field, value as never);
  }

  function updateAnnualKm(km: number) {
    setState("settings", "annualKm", km);
  }

  function toggleIncludeFuel(enabled: boolean) {
    setState("settings", "includeFuel", enabled);
  }

  function handleShare() {
    const url = encodeShareUrl(JSON.parse(JSON.stringify(state)));
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        showToast("Failed to copy link to clipboard", "error");
      },
    );
  }

  function acceptSharedData() {
    const data = shareModalData();
    if (data) {
      setState(reconcile(data));
    }
    setShareModalData(null);
    clearShareParam();
  }

  function dismissSharedData() {
    setShareModalData(null);
    clearShareParam();
  }

  function setActiveScenario(carId: string, index: number) {
    setState("cars", (c) => c.id === carId, "activeScenarioIndex", index);
  }

  function addScenario(carId: string) {
    const car = state.cars.find((c) => c.id === carId);
    if (!car) return;
    const newIndex = car.scenarios.length;
    const newScenario = createDefaultScenario(`Scenario ${newIndex + 1}`);
    setState(
      "cars",
      (c) => c.id === carId,
      "scenarios",
      (s) => [...s, newScenario],
    );
    setState("cars", (c) => c.id === carId, "activeScenarioIndex", newIndex);
  }

  function removeScenario(carId: string, scenarioId: string) {
    setState(
      "cars",
      (c) => c.id === carId,
      "scenarios",
      (s) => s.filter((sc) => sc.id !== scenarioId),
    );
    const car = state.cars.find((c) => c.id === carId);
    if (car) {
      setState(
        "cars",
        (c) => c.id === carId,
        "activeScenarioIndex",
        Math.min(car.activeScenarioIndex, car.scenarios.length - 1),
      );
    }
  }

  function updateScenario<K extends keyof FinancingScenario>(
    carId: string,
    scenarioId: string,
    field: K,
    value: FinancingScenario[K],
  ) {
    setState(
      "cars",
      (c) => c.id === carId,
      "scenarios",
      (s) => s.id === scenarioId,
      field,
      value as never,
    );
  }

  function updateProvince(province: Province) {
    setState("settings", "province", province);
  }

  function updateFee<K extends keyof DealershipFees>(field: K, value: number) {
    setState("settings", "fees", field, value);
  }

  function updateMaxCarAge(years: number) {
    setState("settings", "maxCarAge", years);
  }

  function updateMileageCap(km: number) {
    setState("settings", "mileageCap", km);
  }

  function updateInvestmentReturn(rate: number) {
    setState("settings", "investmentReturn", rate);
  }

  function updateCashOnHand(amount: number) {
    setState("settings", "cashOnHand", amount);
  }

  function resetFees() {
    const defaults = createDefaultSettings();
    setState("settings", "fees", defaults.fees);
    setState("settings", "maxCarAge", defaults.maxCarAge);
    setState("settings", "mileageCap", defaults.mileageCap);
    setState("settings", "annualKm", defaults.annualKm);
    setState("settings", "includeFuel", defaults.includeFuel);
    setState("settings", "investmentReturn", defaults.investmentReturn);
    setState("settings", "cashOnHand", defaults.cashOnHand);
  }

  function carCardHandlers(car: Car) {
    return {
      car,
      settings: state.settings,
      onToggleCollapsed: () => toggleCollapsed(car.id),
      onUpdateLabel: (label: string) => updateCarLabel(car.id, label),
      onUpdateDescription: (desc: string) => updateCarDescription(car.id, desc),
      onUpdatePrice: (price: number) => updateCarPrice(car.id, price),
      onUpdateVehicleYear: (year: number) => updateVehicleYear(car.id, year),
      onUpdateInitialMileage: (km: number) => updateInitialMileage(car.id, km),
      onUpdateOtherFees: (amount: number) => updateOtherFees(car.id, amount),
      onUpdateFuelInput: <K extends keyof FuelInputs>(
        field: K,
        value: number,
      ) => updateFuelInput(car.id, field, value),
      onDuplicate: () => duplicateCar(car.id),
      onRemove: () => removeCar(car.id),
      onSetActiveScenario: (index: number) => setActiveScenario(car.id, index),
      onAddScenario: () => addScenario(car.id),
      onRemoveScenario: (scenarioId: string) =>
        removeScenario(car.id, scenarioId),
      onUpdateScenario: <K extends keyof FinancingScenario>(
        scenarioId: string,
        field: K,
        value: FinancingScenario[K],
      ) => updateScenario(car.id, scenarioId, field, value),
      onUpdateOverride: <K extends keyof CarOverrides>(
        field: K,
        value: CarOverrides[K],
      ) => updateOverride(car.id, field, value),
    };
  }

  return (
    <div class="container mx-auto p-4 max-w-full">
      <div
        class="navbar bg-base-100 rounded-box shadow mb-6 sticky top-4 z-40 header-bar"
        classList={{ "header-hidden": !headerVisible() }}
      >
        <div class="flex-1">
          <span class="text-xl font-bold px-4">Car Cost</span>
        </div>

        <div class="flex items-center gap-1">
          <div class="dropdown dropdown-end lg:hidden order-last">
            <button tabindex="0" class="btn btn-ghost btn-sm" title="Menu">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <div
              tabindex="0"
              class="dropdown-content z-10 p-4 bg-base-100 rounded-box border border-base-300/50 w-64 mt-2 space-y-3"
            >
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  inputmode="numeric"
                  class="input input-bordered input-sm w-24"
                  min="0"
                  step="1000"
                  value={state.settings.annualKm}
                  onInput={(e) => {
                    const v = parseNumericInput(e.currentTarget.value);
                    if (v !== undefined) updateAnnualKm(Math.round(v));
                  }}
                />
                <span class="text-base-content/70">km/yr</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  checked={state.settings.includeFuel}
                  onChange={(e) => toggleIncludeFuel(e.currentTarget.checked)}
                />
                <span class="text-sm text-base-content/70">Include Fuel</span>
              </label>
              <select
                class="select select-bordered select-sm w-full"
                value={state.settings.province}
                onChange={(e) =>
                  updateProvince(e.currentTarget.value as Province)
                }
              >
                <For each={Object.values(PROVINCE_TAX_DATA)}>
                  {(p) => <option value={p.code}>{p.name}</option>}
                </For>
              </select>
            </div>
          </div>

          <div class="hidden lg:flex items-center gap-3">
            <label class="flex items-center gap-1.5 text-sm">
              <input
                type="number"
                inputmode="numeric"
                class="input input-bordered input-sm w-24"
                min="0"
                step="1000"
                value={state.settings.annualKm}
                onInput={(e) => {
                  const v = parseNumericInput(e.currentTarget.value);
                  if (v !== undefined) updateAnnualKm(Math.round(v));
                }}
              />
              <span class="text-base-content/70">km/yr</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                checked={state.settings.includeFuel}
                onChange={(e) => toggleIncludeFuel(e.currentTarget.checked)}
              />
              <span class="text-sm text-base-content/70">Fuel</span>
            </label>
            <select
              class="select select-bordered select-sm"
              value={state.settings.province}
              onChange={(e) =>
                updateProvince(e.currentTarget.value as Province)
              }
            >
              <For each={Object.values(PROVINCE_TAX_DATA)}>
                {(p) => <option value={p.code}>{p.name}</option>}
              </For>
            </select>
          </div>

          <div class="hidden lg:block w-px h-6 bg-base-300/60"></div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            onClick={toggleTheme}
            title={darkMode() ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Show
              when={darkMode()}
              fallback={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clip-rule="evenodd"
                />
              </svg>
            </Show>
          </button>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            onClick={handleShare}
            title="Copy share link"
          >
            <Show
              when={!copied()}
              fallback={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-success"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" />
                <path d="M7.414 15.414a2 2 0 11-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 005.656 5.656l1.5-1.5a1 1 0 00-1.414-1.414l-1.5 1.5z" />
              </svg>
            </Show>
          </button>

          <div class="w-px h-6 bg-base-300/60"></div>

          <button
            class="btn btn-ghost btn-sm"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row lg:items-start pb-4">
        <Show when={collapsedCars().length > 0}>
          <div class="flex flex-col gap-3 lg:flex-shrink-0">
            <For each={collapsedCars()}>
              {(car) => <CarCard {...carCardHandlers(car)} collapsed={true} />}
            </For>
          </div>
        </Show>
        <div class="flex flex-col gap-6 items-stretch lg:flex-row lg:overflow-x-auto lg:items-start flex-1">
          <For each={expandedCars()}>
            {(car) => <CarCard {...carCardHandlers(car)} collapsed={false} />}
          </For>
          <AddCarButton onClick={addCar} />
        </div>
      </div>

      <SettingsModal
        open={settingsOpen()}
        settings={state.settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateProvince={updateProvince}
        onUpdateFee={updateFee}
        onUpdateMaxCarAge={updateMaxCarAge}
        onUpdateMileageCap={updateMileageCap}
        onUpdateInvestmentReturn={updateInvestmentReturn}
        onUpdateCashOnHand={updateCashOnHand}
        onResetFees={resetFees}
      />

      <Show when={shareModalData()}>
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-light text-xl">Shared Data Detected</h3>
            <p class="py-4">
              Someone shared car comparison data with you. Would you like to
              replace your current data with theirs?
            </p>
            <div class="modal-action">
              <button class="btn btn-ghost" onClick={dismissSharedData}>
                Keep Mine
              </button>
              <button class="btn btn-primary" onClick={acceptSharedData}>
                Replace
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={dismissSharedData} />
        </div>
      </Show>

      <Show when={toast()}>
        {(t) => (
          <div class="toast toast-end toast-bottom z-50">
            <div
              class="alert shadow-lg flex gap-2"
              classList={{
                "alert-error": t().type === "error",
                "alert-info": t().type === "info",
              }}
            >
              <span>{t().message}</span>
              <Show when={t().undo}>
                <button
                  class="btn btn-sm btn-ghost"
                  onClick={() => {
                    t().undo?.();
                    dismissToast();
                  }}
                >
                  Undo
                </button>
              </Show>
              <button
                class="btn btn-sm btn-ghost btn-circle"
                onClick={dismissToast}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
