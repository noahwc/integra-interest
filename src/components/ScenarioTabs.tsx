import { For, Show } from "solid-js";
import type { FinancingScenario } from "../lib/types";

interface ScenarioTabsProps {
  scenarios: FinancingScenario[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDuplicate: (scenarioId: string) => void;
  onRemove: (scenarioId: string) => void;
  onRename: (scenarioId: string, label: string) => void;
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
            class="px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap flex items-center gap-1 shrink-0"
            classList={{
              "bg-base-100 shadow-sm font-medium text-base-content":
                index() === props.activeIndex,
              "text-base-content/50 hover:text-base-content/70 hover:bg-base-100/50":
                index() !== props.activeIndex,
            }}
            onClick={() => props.onSelect(index())}
          >
            <Show
              when={index() === props.activeIndex}
              fallback={scenario.label}
            >
              <input
                type="text"
                class="bg-transparent outline-none min-w-0"
                style={{ width: `${Math.max(scenario.label.length, 1)}ch` }}
                value={scenario.label}
                onInput={(e) =>
                  props.onRename(scenario.id, e.currentTarget.value)
                }
                onClick={(e) => e.stopPropagation()}
              />
            </Show>
            <Show when={index() === props.activeIndex}>
              <span
                class="ml-0.5 opacity-40 hover:opacity-100 text-xs cursor-pointer"
                title="Duplicate scenario"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onDuplicate(scenario.id);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 inline"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7zm2 1v8h8V8H6z" />
                </svg>
              </span>
            </Show>
            <Show when={props.scenarios.length > 1}>
              <span
                class="ml-0.5 opacity-40 hover:opacity-100 hover:text-error text-xs cursor-pointer"
                title="Remove scenario"
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
        class="px-3 py-1.5 text-sm rounded-md text-base-content/30 hover:text-base-content/60 hover:bg-base-100/50 transition-all shrink-0"
        onClick={() => props.onAdd()}
      >
        +
      </button>
    </div>
  );
}
