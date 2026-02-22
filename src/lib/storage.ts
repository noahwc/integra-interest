import type { AppState } from "./types";
import { createDefaultState } from "./defaults";

const STORAGE_KEY = "integra-interest-v1";

/** Apply forward-migrations to a parsed state object. */
export function migrateState(state: AppState): void {
  for (const car of state.cars) {
    if (!car.overrides) {
      car.overrides = {};
    }
  }
  if ((state.settings as Record<string, unknown>).investmentReturn === undefined) {
    state.settings.investmentReturn = 0;
  }
  if ((state.settings as Record<string, unknown>).cashOnHand === undefined) {
    state.settings.cashOnHand = 0;
  }
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.settings || !Array.isArray(parsed.cars)) {
      return createDefaultState();
    }
    migrateState(parsed);
    return parsed;
  } catch {
    return createDefaultState();
  }
}

export function saveState(serialized: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // localStorage quota exceeded or unavailable
  }
}
