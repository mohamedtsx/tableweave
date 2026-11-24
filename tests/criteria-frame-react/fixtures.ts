import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../packages/react/src/presentation/binding.js";
import type { CriteriaSourceInput } from "../../packages/react/src/presentation/criteria-frame.js";
import {
  fixture,
  type Item,
  records,
  required,
} from "../criteria-frame/fixtures.js";

export { fixture, type Item, records, required };
export type Fixture = ReturnType<typeof fixture>;
export type Schema = Fixture["schema"];
export function sourceInput(
  f: Fixture,
  mode: "client" | "server" | "server-complete" = "client",
): CriteriaSourceInput<Schema, Item> {
  const { criteria, expected, source } = f.input(mode);
  return { criteria, expected, source };
}
export function begin(f: Fixture, retry?: () => void) {
  const state = f.app.C.getSnapshot();
  return required(
    beginControlsRequest(f.definition, f.app.C, f.resource, {
      ...f.context,
      queryKey: "synthetic-recovery",
      requestKey: `recovery-${f.resource.getSnapshot().request?.generation ?? 0}`,
      extent: f.definition.paginationEnabled
        ? { kind: "page", ...state.query.pagination }
        : { kind: "complete" },
      ...(retry ? { retry } : {}),
    }),
  );
}
export function assertCurrentBinding(f: Fixture) {
  const request = required(f.resource.getSnapshot().request);
  return required(
    getControlsRequestBinding(f.definition, f.app.C, f.resource, request),
  );
}
