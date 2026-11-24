import type { QuerySchema } from "./.artifacts/emitted/contracts/types.js";
import type {
  CriteriaAuthority,
  CriteriaCurrent,
  CriteriaOrigin,
} from "./.artifacts/emitted/controller/criteria.js";
import {
  createCriteriaAuthority,
  getCriteriaAuthorityOrigin,
  requireCriteriaAuthority,
} from "./.artifacts/emitted/controller/criteria.js";
import type {
  ControllerDefinition,
  TableController,
} from "./.artifacts/emitted/controller/types.js";

type S = QuerySchema<{
  readonly id: "precise-alpha";
  readonly version: 1;
  readonly fields: {
    readonly amount: {
      readonly type: "number";
      readonly owner: "builder";
      readonly sort: true;
    };
  };
}>;
type Other = QuerySchema<{
  readonly id: "precise-beta";
  readonly version: 1;
  readonly fields: {
    readonly name: { readonly type: "text"; readonly owner: "builder" };
  };
}>;
declare const controller: TableController<S>;
declare const definition: ControllerDefinition<S>;
declare const other: CriteriaOrigin<Other>;
declare const context: {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly access: boolean;
};
const origin: CriteriaOrigin<S> = { controller, definition, context, epoch: 1 };
const current: CriteriaCurrent<S> = {
  controller,
  definition,
  expected: context,
  actual: context,
  epoch: 1,
};
const authority = createCriteriaAuthority({
  origin,
  readCurrent() {
    return current;
  },
});
const typed: CriteriaAuthority<S> = authority;
const success: CriteriaOrigin<S> = requireCriteriaAuthority(authority, origin);
const id: "precise-alpha" = authority.require().definition.schema.id;
const lookupId: "precise-alpha" | undefined =
  getCriteriaAuthorityOrigin(authority)?.definition.schema.id;
// @ts-expect-error Schema identity is inferred, not widened to QuerySchema/string.
const wrongId: "precise-beta" = id;
// @ts-expect-error Registered-target helpers preserve the authority's exact schema.
requireCriteriaAuthority(authority, other);
createCriteriaAuthority({
  origin,
  readCurrent: () => ({
    ...current,
    // @ts-expect-error Another current controller schema cannot be substituted for origin S.
    controller: other.controller,
    // @ts-expect-error Another current definition schema cannot be substituted for origin S.
    definition: other.definition,
  }),
});
// @ts-expect-error Successful provenance remains readonly.
success.context.scopeKey = "mutated";
// @ts-expect-error Epoch is a lifecycle string/number, not a permission boolean.
const wrongEpoch: CriteriaOrigin<S> = { ...origin, epoch: true };
const wrongRule = {
  id: "rule",
  field: "name",
  operator: "text.contains",
  value: "x",
} as const;
success.controller.dispatch({
  type: "builder.commit",
  // @ts-expect-error Exact rule field/operator/value inference survives require().
  rule: wrongRule,
});
success.controller.dispatch({
  type: "builder.commit",
  rule: { id: "rule", field: "amount", operator: "number.eq", value: 0 },
});
void typed;
void lookupId;
void wrongId;
void wrongEpoch;
