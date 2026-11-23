import type {
  QueryFor,
  QuerySchemaDefinition,
} from "../../packages/react/src/contracts/index.js";
import {
  createQuery,
  defineQuerySchema,
} from "../../packages/react/src/contracts/index.js";

const definition: QuerySchemaDefinition = {
  id: "dynamic-types",
  version: 1,
  fields: { price: { type: "number", owner: "builder", sort: true } },
  tabs: [{ id: "all", rules: [] }],
};
const schema = defineQuerySchema(definition);
// Both are supported at runtime; widening configuration must not make them never.
export const dynamicQuery = createQuery(schema, {
  locale: "en-US",
  timeZone: "UTC",
  sorting: [{ id: "price", desc: false }],
  tabId: "all",
});
const optional: QuerySchemaDefinition<{
  price: { type: "number"; owner: "builder"; sort?: boolean };
  disabled: { type: "number"; owner: "builder"; sort: false };
  title: { type: "text"; owner: "builder" };
}> & { tabs?: readonly { id: "all"; rules: readonly [] }[] } = {
  id: "optional-types",
  version: 1,
  fields: {
    price: { type: "number", owner: "builder", sort: true },
    disabled: { type: "number", owner: "builder", sort: false },
    title: { type: "text", owner: "builder" },
  },
  tabs: [{ id: "all", rules: [] }],
};
const optionalSchema = defineQuerySchema(optional);
export const optionalQuery = createQuery(optionalSchema, {
  locale: "en-US",
  timeZone: "UTC",
  sorting: [{ id: "price", desc: false }],
  tabId: "all",
});
// @ts-expect-error Optional known tab IDs retain their precision.
export const badOptionalTab: QueryFor<typeof optionalSchema>["tabId"] = "other";
// @ts-expect-error Explicit false still forbids sorting.
export const badDisabledSort: QueryFor<
  typeof optionalSchema
>["sorting"][number]["id"] = "disabled";
// @ts-expect-error Omitted sort configuration does not enable sorting.
export const badUnconfiguredSort: QueryFor<
  typeof optionalSchema
>["sorting"][number]["id"] = "title";
const noTabs = defineQuerySchema({ id: "no-tabs", version: 1, fields: {} });
// @ts-expect-error A literal schema without tabs accepts only null.
export const badUnconfiguredTab: QueryFor<typeof noTabs>["tabId"] = "all";
