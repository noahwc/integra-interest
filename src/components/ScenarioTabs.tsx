import { For, Show } from "solid-js";
import type { FinancingScenario } from "../lib/types";

interface ScenarioTabsProps {
  scenarios: FinancingScenario[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (scenarioId: string) => void;
}

export default function ScenarioTabs(props: ScenarioTabsProps) {
  return (
    <div
      class="flex gap-1 bg-base-200 rounded-lg p-1 mt-1 overflow-x-auto"
      role="tablist"
    >
      <For each={props.scenarios}>
        {(scenario, index) => (
          <button
            role="tab"
            class="px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap flex items-center gap-1"
            classList={{
              "bg-base-100 shadow-sm font-medium text-base-content":
                index() === props.activeIndex,
              "text-base-content/50 hover:text-base-content/70 hover:bg-base-100/50":
                index() !== props.activeIndex,
            }}
            onClick={() => props.onSelect(index())}
          >
            {scenario.label}
            <Show when={props.scenarios.length > 1}>
              <span
                class="ml-0.5 opacity-40 hover:opacity-100 hover:text-error text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onRemove(scenario.id);
                }}
              >
                &#x2715;
              </span>
            </Show>
          </button>
        )}
      </For>
      <button
        role="tab"
        class="px-3 py-1.5 text-sm rounded-md text-base-content/30 hover:text-base-content/60 hover:bg-base-100/50 transition-all"
        onClick={() => props.onAdd()}
      >
        +
      </button>
    </div>
  );
}
