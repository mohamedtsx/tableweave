import {
  captureFilterBuilderPorts,
  captureFilterDatePorts,
  captureFilterSearchPorts,
  captureFilterTabsPorts,
} from "../../packages/heroui/src/filters/criteria-ports.js";
import { schema, unitGate, type S } from "./fixtures.js";

const gate = unitGate();
// @ts-expect-error actual callback signature cannot be replaced by a boolean
captureFilterSearchPorts<S>({ onMutation: true }, gate.check);
captureFilterBuilderPorts(
  schema,
  // @ts-expect-error arbitrary field cannot widen the schema-owned builder field set
  { evaluationMode: "server", fields: { unknown: { label: "Unknown" } } },
  gate.check,
);
captureFilterBuilderPorts(
  schema,
  // @ts-expect-error search field is not builder-owned
  { evaluationMode: "server", fields: { search: { label: "Search" } } },
  gate.check,
);
captureFilterTabsPorts(
  schema,
  // @ts-expect-error actual tab dictionary remains schema-bound
  { tabs: { unrelated: { label: "Other" } }, children: null },
  gate.check,
);
captureFilterDatePorts<S>(
  // @ts-expect-error actual summary formatter returns a string, not an object
  { messages: { formatSummary: () => ({}) } },
  gate.check,
);
// @ts-expect-error check is mandatory; there is no default permitting gate
captureFilterSearchPorts<S>({});
// @ts-expect-error a boolean permission result is not the internal gate contract
captureFilterSearchPorts<S>({}, () => true);
const owned = captureFilterBuilderPorts(
  schema,
  { evaluationMode: "server", fields: {}, messages: { filters: "Filters" } },
  gate.check,
);
if (owned.messages) {
  // @ts-expect-error newly owned message containers are immutable
  owned.messages.filters = "Mutated";
}
