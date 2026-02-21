import type { AppState } from "./types";
import { createDefaultState } from "./defaults";

const STORAGE_KEY = "integra-interest-v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.settings || !Array.isArray(parsed.cars)) {
      return createDefaultState();
    }
    // Migrate: ensure each car has overrides
    for (const car of parsed.cars) {
      if (!car.overrides) {
        car.overrides = {};
      }
    }
    return parsed;
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage quota exceeded or unavailable
  }
}
