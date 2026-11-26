import type {
  DataTableProps,
  FilterCustomEditorProps,
} from "@tableweave/heroui";
import { useState } from "react";
import type { Transaction } from "../shared/records.js";
import { exampleOperators, type TransactionSchema } from "../shared/schemas.js";

/** Draft strings are local; only the actual builder validates/commits operands. */
export function NumericRecipeEditor(
  props: FilterCustomEditorProps<TransactionSchema>,
) {
  const [parts, setParts] = useState(() =>
    Array.isArray(props.value)
      ? props.value.map(String)
      : [props.value === undefined ? "" : String(props.value), ""],
  );
  const range = props.operator.cardinality === "range";
  if (props.operator.cardinality === "none")
    return <p>No value is required.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {(range ? [0, 1] : [0]).map((index) => (
        <label key={index} className="space-y-1">
          {range ? (index === 0 ? "From" : "To") : "Numeric value"}
          <input
            aria-label={
              range ? (index === 0 ? "From" : "To") : "Recipe numeric value"
            }
            disabled={props.isDisabled}
            className="block rounded border border-border bg-surface px-3 py-2"
            inputMode="decimal"
            value={parts[index] ?? ""}
            onChange={(event) => {
              const next = [...parts];
              next[index] = event.target.value;
              setParts(next);
              const values = next.map((raw) =>
                raw === ""
                  ? ""
                  : Number.isFinite(Number(raw))
                    ? Number(raw)
                    : raw,
              );
              props.onChange(
                range
                  ? values.slice(0, 2)
                  : next[0] === ""
                    ? undefined
                    : values[0],
              );
            }}
          />
        </label>
      ))}
    </div>
  );
}
export function transactionRecipeTools(): NonNullable<
  DataTableProps<TransactionSchema, Transaction>["tools"]
> {
  return {
    search: { messages: { label: "Search descriptions" } },
    tabs: {
      tabs: { posted: { label: "Posted" }, draft: { label: "Draft" } },
      neutralTab: { label: "All records" },
      children: null,
    },
    date: {
      presets: [
        {
          id: "today",
          label: "November 25 UTC",
          date: {
            operator: "date.between",
            value: [
              { kind: "day", value: "2026-11-25" },
              { kind: "day", value: "2026-11-25" },
            ],
          },
        },
      ],
    },
    builder: {
      registry: exampleOperators,
      fields: {
        amount: {
          label: "Amount",
          operatorLabels: { "example.multiple-of": "Multiple of" },
          renderEditor: (props) => <NumericRecipeEditor {...props} />,
        },
        reference: { label: "Reference" },
        account: {
          label: "Account",
          choices: [
            { id: 0, label: "Account zero" },
            { id: 1, label: "Account one" },
            { id: 2, label: "Account two" },
          ],
        },
        tags: {
          label: "Tags",
          choices: [
            { id: "review", label: "Review" },
            { id: "local", label: "Local" },
          ],
        },
        cleared: { label: "Cleared" },
        bookingDay: { label: "Booking day" },
      },
    },
  };
}
