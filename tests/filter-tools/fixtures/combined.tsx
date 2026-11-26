import type {
  FilterCustomEditorProps,
  FilterFieldPresentation,
} from "@tableweave/heroui";
import { FilterBuilder } from "@tableweave/heroui";
import type { BuilderFieldId } from "@tableweave/react/filters";
import { useCallback, useMemo, useState } from "react";
import type { FixtureSchema } from "./data.js";
import { entityNumberOptions, entityTextOptions } from "./data.js";
import type { FixtureBindings, WorkbenchProps } from "./workbench.js";
import { FilterWorkbench } from "./workbench.js";

function MultipleEditor(props: FilterCustomEditorProps<FixtureSchema>) {
  const [text, setText] = useState(() =>
    typeof props.value === "number" ? String(props.value) : "",
  );
  return (
    <label className="wp07-custom-editor">
      Custom numeric operand
      <input
        type="text"
        inputMode="decimal"
        value={text}
        disabled={props.isDisabled}
        onChange={(event) => {
          const next = event.currentTarget.value;
          setText(next);
          const value = next.trim() ? Number(next) : undefined;
          props.onChange(
            value === undefined
              ? undefined
              : Number.isFinite(value)
                ? value
                : next,
          );
        }}
      />
    </label>
  );
}

function Builder({
  bindings,
  asyncOptions,
}: {
  readonly bindings: FixtureBindings;
  readonly asyncOptions: boolean;
}) {
  const fields = useMemo<
    Readonly<
      Partial<
        Record<
          BuilderFieldId<FixtureSchema>,
          FilterFieldPresentation<FixtureSchema>
        >
      >
    >
  >(
    () => ({
      amount: { label: "Amount" },
      note: { label: "Note (hidden column)" },
      entityNumber: {
        label: "Numeric entity",
        ...(asyncOptions
          ? {
              asyncOptions: {
                idType: "number" as const,
                source: bindings.numberDriver.source,
                onRequest: bindings.numberDriver.enqueue,
                nextPageKey: bindings.numberDriver.nextPageKey,
              },
            }
          : { choices: entityNumberOptions }),
      },
      entityText: {
        label: "Text entity",
        ...(asyncOptions
          ? {
              asyncOptions: {
                idType: "string" as const,
                source: bindings.textDriver.source,
                onRequest: bindings.textDriver.enqueue,
                nextPageKey: bindings.textDriver.nextPageKey,
              },
            }
          : { choices: entityTextOptions }),
      },
      tags: {
        label: "Tags",
        choices: [
          { id: "red", label: "Red" },
          { id: "blue", label: "Blue" },
        ],
      },
      flag: { label: "Nullable flag" },
      day: { label: "Calendar day" },
      customScore: {
        label: "Computed score",
        operatorLabels: { "fixture.multiple-of": "is a multiple of" },
        renderEditor: (props) => <MultipleEditor {...props} />,
      },
    }),
    [asyncOptions, bindings.numberDriver, bindings.textDriver],
  );
  return (
    <FilterBuilder
      controller={bindings.controller}
      evaluationMode="client"
      expectedResourceContext={bindings.expectedContext}
      invalidationKey={bindings.invalidationKey}
      registry={bindings.registry}
      fields={fields}
      createRuleId={bindings.createRuleId}
      onMutation={bindings.onMutation}
    />
  );
}

export interface CombinedWorkbenchProps
  extends Omit<WorkbenchProps, "builderSlot"> {
  readonly asyncOptions?: boolean;
}
export function CombinedWorkbench({
  asyncOptions = false,
  ...props
}: CombinedWorkbenchProps) {
  const slot = useCallback(
    (bindings: FixtureBindings) => (
      <Builder bindings={bindings} asyncOptions={asyncOptions} />
    ),
    [asyncOptions],
  );
  return <FilterWorkbench {...props} builderSlot={slot} />;
}
