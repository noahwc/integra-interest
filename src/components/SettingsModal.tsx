import { For, Show } from "solid-js";
import type { DealershipFees, Province, Settings } from "../lib/types";
import { PROVINCE_TAX_DATA } from "../lib/tax-data";
import { parseNumericInput } from "../lib/format";

interface SettingsModalProps {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onUpdateProvince: (province: Province) => void;
  onUpdateFee: <K extends keyof DealershipFees>(
    field: K,
    value: number,
  ) => void;
  onUpdateMaxCarAge: (years: number) => void;
  onUpdateMileageCap: (km: number) => void;
  onResetFees: () => void;
}

export default function SettingsModal(props: SettingsModalProps) {
  const provinces = Object.values(PROVINCE_TAX_DATA);

  function handleFeeInput(field: keyof DealershipFees, value: string) {
    const v = parseNumericInput(value);
    if (v !== undefined) props.onUpdateFee(field, v);
  }

  return (
    <dialog class="modal" classList={{ "modal-open": props.open }}>
      <div class="modal-box">
        <h3 class="font-light text-xl">Settings</h3>

        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text text-xs uppercase tracking-wider opacity-70">Province / Territory</span>
          </label>
          <select
            class="select select-bordered select-sm w-full"
            value={props.settings.province}
            onChange={(e) =>
              props.onUpdateProvince(e.currentTarget.value as Province)
            }
          >
            <For each={provinces}>
              {(p) => (
                <option value={p.code}>
                  {p.name} ({(p.combinedRate * 100).toFixed(1)}%)
                </option>
              )}
            </For>
          </select>
          <label class="label">
            <span class="label-text-alt">
              Tax breakdown:{" "}
              <For each={PROVINCE_TAX_DATA[props.settings.province].taxes}>
                {(tax, i) => (
                  <>
                    <Show when={i() > 0}> + </Show>
                    {tax.label} {(tax.rate * 100).toFixed(1)}%
                  </>
                )}
              </For>
            </span>
          </label>
        </div>

        <div class="divider">Dealership Fees</div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs uppercase tracking-wider opacity-70">Freight / PDI</span>
            </label>
            <label class="input input-bordered input-sm flex items-center gap-1">
              $
              <input
                type="number"
                inputmode="numeric"
                class="grow w-full"
                min="0"
                step="50"
                value={props.settings.fees.freightPdi}
                onInput={(e) =>
                  handleFeeInput("freightPdi", e.currentTarget.value)
                }
              />
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs uppercase tracking-wider opacity-70">A/C Tax</span>
            </label>
            <label class="input input-bordered input-sm flex items-center gap-1">
              $
              <input
                type="number"
                inputmode="numeric"
                class="grow w-full"
                min="0"
                step="10"
                value={props.settings.fees.airConditioningTax}
                onInput={(e) =>
                  handleFeeInput("airConditioningTax", e.currentTarget.value)
                }
              />
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs uppercase tracking-wider opacity-70">Tire Levy</span>
            </label>
            <label class="input input-bordered input-sm flex items-center gap-1">
              $
              <input
                type="number"
                inputmode="numeric"
                class="grow w-full"
                min="0"
                step="5"
                value={props.settings.fees.tireLevy}
                onInput={(e) =>
                  handleFeeInput("tireLevy", e.currentTarget.value)
                }
              />
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs uppercase tracking-wider opacity-70">Dealer / Admin Fee</span>
            </label>
            <label class="input input-bordered input-sm flex items-center gap-1">
              $
              <input
                type="number"
                inputmode="numeric"
                class="grow w-full"
                min="0"
                step="50"
                value={props.settings.fees.dealerFee}
                onInput={(e) =>
                  handleFeeInput("dealerFee", e.currentTarget.value)
                }
              />
            </label>
          </div>
        </div>

        <div class="divider">Lifetime Limits</div>

        <div class="form-control">
          <label class="label">
            <span class="label-text text-xs uppercase tracking-wider opacity-70">Max Car Age (years)</span>
          </label>
          <input
            type="number"
            inputmode="numeric"
            class="input input-bordered input-sm w-full"
            min="1"
            max="30"
            step="1"
            value={props.settings.maxCarAge}
            onInput={(e) => {
              const v = parseNumericInput(e.currentTarget.value, 1);
              if (v !== undefined) props.onUpdateMaxCarAge(Math.round(v));
            }}
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text text-xs uppercase tracking-wider opacity-70">Mileage Cap (km)</span>
          </label>
          <input
            type="number"
            inputmode="numeric"
            class="input input-bordered input-sm w-full"
            min="0"
            step="10000"
            value={props.settings.mileageCap}
            onInput={(e) => {
              const v = parseNumericInput(e.currentTarget.value);
              if (v !== undefined) props.onUpdateMileageCap(Math.round(v));
            }}
          />
          <label class="label">
            <span class="label-text-alt">
              Car life ends at age or mileage cap, whichever comes first
            </span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" onClick={() => props.onResetFees()}>
            Reset to Defaults
          </button>
          <button class="btn btn-primary" onClick={() => props.onClose()}>
            Done
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" onClick={() => props.onClose()}>
        <button>close</button>
      </form>
    </dialog>
  );
}
