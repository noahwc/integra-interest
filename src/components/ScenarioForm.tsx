import { For } from "solid-js";
import type { FinancingScenario, PaymentFrequency } from "../lib/types";
import { FREQUENCY_LABELS, LOAN_TERM_OPTIONS, parseNumericInput } from "../lib/format";

interface ScenarioFormProps {
  scenario: FinancingScenario;
  onUpdate: <K extends keyof FinancingScenario>(
    field: K,
    value: FinancingScenario[K],
  ) => void;
}

export default function ScenarioForm(props: ScenarioFormProps) {
  return (
    <div class="space-y-3 mt-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs uppercase tracking-wider opacity-70">Interest Rate</span>
          </label>
          <label class="input input-bordered input-sm flex items-center gap-1">
            <input
              type="number"
              inputmode="decimal"
              class="grow w-full"
              min="0"
              max="30"
              step="0.01"
              value={props.scenario.interestRate}
              onInput={(e) => {
                const v = parseNumericInput(e.currentTarget.value);
                if (v !== undefined) props.onUpdate("interestRate", v);
              }}
            />
            %
          </label>
        </div>

        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs uppercase tracking-wider opacity-70">Loan Term</span>
          </label>
          <select
            class="select select-bordered select-sm w-full"
            value={props.scenario.loanTermMonths}
            onChange={(e) =>
              props.onUpdate(
                "loanTermMonths",
                parseInt(e.currentTarget.value, 10),
              )
            }
          >
            <For each={LOAN_TERM_OPTIONS}>
              {(opt) => <option value={opt.value}>{opt.label}</option>}
            </For>
          </select>
        </div>

      </div>

      <div class="form-control">
        <label class="label py-1">
          <span class="label-text text-xs uppercase tracking-wider opacity-70">Down Payment</span>
        </label>
        <label class="input input-bordered input-sm w-full flex items-center gap-1">
          $
          <input
            type="number"
            inputmode="numeric"
            class="grow w-full"
            min="0"
            step="500"
            value={props.scenario.downPayment}
            onInput={(e) => {
              const v = parseNumericInput(e.currentTarget.value);
              if (v !== undefined) props.onUpdate("downPayment", v);
            }}
          />
        </label>
      </div>

      <div class="form-control">
        <label class="label py-1">
          <span class="label-text text-xs uppercase tracking-wider opacity-70">Payment Frequency</span>
        </label>
        <select
          class="select select-bordered select-sm w-full"
          value={props.scenario.paymentFrequency}
          onChange={(e) =>
            props.onUpdate(
              "paymentFrequency",
              e.currentTarget.value as PaymentFrequency,
            )
          }
        >
          <For each={Object.entries(FREQUENCY_LABELS)}>
            {([value, label]) => <option value={value}>{label}</option>}
          </For>
        </select>
      </div>
    </div>
  );
}
