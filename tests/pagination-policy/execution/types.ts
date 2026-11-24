import {
  compileQueryExecution,
  type QueryExecution,
  type QueryExecutionExtent,
} from "../../../packages/react/src/contracts/execution.js";
import {
  type CustomOperator,
  createQuery,
  defineQuerySchema,
  type OperatorRegistry,
  type QueryFor,
  type QuerySchema,
} from "../../../packages/react/src/contracts/index.js";

export const schema = defineQuerySchema({
  id: "typed-execution",
  version: 12,
  fields: {
    amount: { type: "number", owner: "builder", sort: true },
    label: { type: "text", owner: "search" },
    day: { type: "date", owner: "date", relativePresets: ["today"] },
  },
  date: { mode: "single" },
  pagination: { enabled: false },
});
export const wire = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
export const descriptor = compileQueryExecution(schema, wire, { now: 0 });
export const query: QueryFor<typeof schema> = descriptor.query;
export const evaluation: number = descriptor.evaluatedAt;
export const version: 1 = descriptor.version;
export const extent: QueryExecutionExtent = descriptor.extent;
export function generic<S extends QuerySchema>(
  registered: S,
  input: unknown,
): QueryExecution<S> {
  return compileQueryExecution(registered, input, { now: 0 });
}
type Options = Parameters<typeof compileQueryExecution>[2];
function execute(options: Options) {
  return compileQueryExecution(schema, wire, options);
}
// @ts-expect-error evaluation is explicitly required
execute({});
// @ts-expect-error clock providers are not explicit numeric evaluation values
execute({ now: () => 0 });
// @ts-expect-error exact optional registry cannot be explicitly undefined
execute({ now: 0, registry: undefined });
// @ts-expect-error caller options cannot choose a complete extent
execute({ now: 0, extent: { kind: "complete" } });
// @ts-expect-error execution metadata is readonly
descriptor.evaluatedAt = 1;
export const invalidComplete: QueryExecutionExtent = {
  kind: "complete",
  // @ts-expect-error complete execution has no paging size
  pageSize: 10,
};
// @ts-expect-error page execution requires its validated index too
export const invalidPage: QueryExecutionExtent = { kind: "page", pageSize: 10 };
if (descriptor.extent.kind === "complete") {
  // @ts-expect-error the narrowed complete extent has no offset/index
  descriptor.extent.pageIndex;
}
const owner = {
  id: "bad",
  field: "label",
  operator: "text.contains",
  value: "x",
} as const;
// @ts-expect-error descriptor query retains exclusive inferred builder ownership
export const badOwner: (typeof descriptor.query.builder.rules)[number] = owner;
const number = {
  id: "bad",
  field: "amount",
  operator: "number.eq",
  value: "7",
} as const;
// @ts-expect-error descriptor query retains inferred numeric operands
export const badNumber: (typeof descriptor.query.builder.rules)[number] =
  number;
const sort = [{ id: "label", desc: false }] as const;
// @ts-expect-error query sorting retains only schema-enabled sort fields
export const badSort: typeof descriptor.query.sorting = sort;
const date = {
  operator: "date.on",
  value: { kind: "relative", preset: "tomorrow" },
} as const;
// @ts-expect-error descriptor query preserves configured date presets
export const badDate: typeof descriptor.query.date = date;

declare const registry: OperatorRegistry<
  readonly [CustomOperator<"custom.typed", number, readonly ["number"]>]
>;
export const customSchema = defineQuerySchema(
  {
    id: "typed-custom-execution",
    version: 1,
    fields: {
      value: { type: "number", owner: "builder", operators: ["custom.typed"] },
    },
  },
  registry,
);
export const custom = compileQueryExecution(
  customSchema,
  createQuery(customSchema, { locale: "en-US", timeZone: "UTC" }, { registry }),
  { now: 0, registry },
);
export const validCustom: (typeof custom.query.builder.rules)[number] = {
  id: "valid",
  field: "value",
  operator: "custom.typed",
  value: 7,
};
const customOperand = {
  id: "bad",
  field: "value",
  operator: "custom.typed",
  value: "7",
} as const;
// @ts-expect-error generic execution query retains custom registry operand inference
export const badCustom: (typeof custom.query.builder.rules)[number] =
  customOperand;
