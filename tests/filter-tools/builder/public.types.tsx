import type { TableController } from "@tableweave/react";
import { defineQuerySchema } from "@tableweave/react/contracts";
import { createOptionSource } from "@tableweave/react/filters";
import type {
  FilterBuilderProps,
  FilterOptionPort,
} from "../../../packages/heroui/src/filters/types.js";

const schema = defineQuerySchema({
  id: "typed-builder",
  version: 1,
  fields: {
    person: { type: "enum", owner: "builder", idType: "number" },
    search: { type: "text", owner: "search" },
    neutral: { type: "text", owner: "none" },
  },
});
declare const controller: TableController<typeof schema>;
const source = createOptionSource<number>({
  definitionKey: "typed-builder",
  scopeKey: "synthetic",
  access: true,
  fieldId: "person",
});
const numericPort = {
  idType: "number",
  source,
  onRequest: () => {},
} satisfies FilterOptionPort;
const valid = {
  controller,
  evaluationMode: "client",
  expectedResourceContext: {
    definitionKey: "typed-builder",
    scopeKey: "synthetic",
    access: true,
  },
  invalidationKey: 0,
  fields: {
    person: {
      label: "Person",
      asyncOptions: numericPort,
      formatValue: () => (
        <span>
          Rich <strong>person</strong> summary
        </span>
      ),
    },
  },
} satisfies FilterBuilderProps<typeof schema>;
void valid;
const invalid: FilterBuilderProps<typeof schema>["fields"] = {
  // @ts-expect-error Independent search owners are not builder field presentations.
  search: { label: "Search" },
};
void invalid;
const neutral: FilterBuilderProps<typeof schema>["fields"] = {
  // @ts-expect-error Neutral owners are not builder field presentations.
  neutral: { label: "Neutral" },
};
void neutral;
// @ts-expect-error A string port cannot settle a number-only source.
const wrongPort: FilterOptionPort = {
  idType: "string",
  source,
  onRequest: () => {},
};
void wrongPort;
