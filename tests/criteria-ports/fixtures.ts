import type {
  AnyCustomOperator,
  JsonValue,
  OperatorRegistry,
  QuerySchema,
} from "../../packages/react/src/contracts/types.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import { createOptionSource } from "../../packages/react/src/filters/options-source.js";

export const schema = defineQuerySchema({
  id: "criteria-ports",
  version: 1,
  fields: {
    first: { type: "number", owner: "builder" },
    second: { type: "number", owner: "builder" },
    search: { type: "text", owner: "search" },
    date: { type: "date", owner: "date" },
  },
  tabs: [
    { id: "all", rules: [] },
    { id: "active", rules: [] },
  ],
});
export type S = typeof schema;

/** Unit-only internal gate: tests capture behavior, NEVER F1/actor provenance. */
export function unitGate() {
  let live = true;
  let calls = 0;
  const check = (): undefined => {
    calls++;
    if (!live) throw new Error("Synthetic inactive capture gate");
    return undefined;
  };
  return {
    check,
    revoke() {
      live = false;
    },
    get calls() {
      return calls;
    },
  };
}
export function source() {
  return createOptionSource({
    definitionKey: "ports-v1",
    scopeKey: "synthetic",
    fieldId: "first",
    access: true,
  });
}
export function registry(
  onCall: (
    kind: "get" | "validate" | "normalize" | "evaluate",
    receiver: unknown,
  ) => void,
): OperatorRegistry {
  const custom: AnyCustomOperator = {
    id: "number.synthetic",
    labelKey: "operators.synthetic",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is JsonValue {
      onCall("validate", this);
      return typeof value === "number";
    },
    normalize(value) {
      onCall("normalize", this);
      return value;
    },
    evaluate() {
      onCall("evaluate", this);
      return true;
    },
  };
  const descriptor = {
    id: custom.id,
    labelKey: custom.labelKey,
    types: custom.types,
    cardinality: custom.cardinality,
    builtin: false,
    custom,
  };
  // A supported application registry port with actual OperatorRegistry metadata,
  // not an authority/native/source permitting mock. No construction callback runs.
  return {
    custom: [custom],
    descriptors: [descriptor],
    get(id) {
      onCall("get", this);
      return id === custom.id ? descriptor : undefined;
    },
  };
}
export function genericSchema<S2 extends QuerySchema>(value: S2): S2 {
  return value;
}
