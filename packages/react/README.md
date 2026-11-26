# @tableweave/react — private accepted producers

Accepted WP-02 provides schemas, wire-v1 validation, pure predicates, operators,
dates and identities. Accepted WP-03 adds the private accepted-state controller/
hook producer. Neither is a full table implementation or release approval.

- `/contracts`: `defineQuerySchema`, `createQuery`, `parseQuery`, `normalizeQuery`,
  `getFilterIdentity`, `getQueryIdentity`, `ContractError`, `defaultLimits`,
  `canonicalJson` and schema-specific types (`QueryFor`, `RuleFor`, `FieldAccessors`).
- `/filters`: operator registry/presets, `compileFilter`, `createFilterEvaluator`,
  `translateQuery`, `invertRule`, explicit date resolution and associated types.
  WP-07 adds `getBuilderFields`, `getFieldOperators`, `validateRuleDraft`,
  `createOptionSource`, `projectOptionSourceView` and own typed option/editor
  contracts. Their scoped headless correction is technically reviewed; full UI
  integration/packet acceptance is separate. See the
  [tool protocol](../../docs/engineering/wp-07-tools.md) for pure validation,
  exact-token generations, bounded labels and passive source ownership.
- Root (client entry): `defineController`, `createTableState`, `reduceTableState`,
  `createTableController`, `replaceTableDefinition`, `ControllerError`,
  `useTableweaveState`, `useTableweaveQuery`, `useTableweaveSelector` and types.
  See the [WP-03 protocol](../../docs/engineering/wp-03-controller.md).
- Root also exposes the **private WP-04 native producer**:
  `defineNativeTable`, `createNativeColumnHelper`, `createNativeController`,
  `useNativeTable`, `NativeBridgeError` and typed native definitions/models/views.
  The [candidate contract](../../docs/engineering/wp-04-native.md) and
  [producer handoff](src/tanstack/README.md) document actual APIs and recorded
  delegated G-01 proof/limits. No whole-table facade or styled UI is supplied here.
- Root's WP-05 producer adds `createResourceAdapter`, `useTableweaveResource`,
  `projectResourceView` and plain tagged resource types. See the
  [resource contract](../../docs/engineering/resources.md) and
  [plan](../../docs/planning/wp-05-implementation-plan.md). This is not the full
  table facade, a fetch cache, framework SSR integration or styled UI.

Contracts/filters contain no client directive or React/UI import. Their only
runtime dependencies are Valibot `1.5.0` and Internationalized Date `3.12.4`.
Vendor validation objects/types are internal. See the repository's
[WP-02 contract](../../docs/engineering/wp-02-contracts.md) for exact context,
normalization, translator and privacy obligations. No fetching, persistence or
authorization is supplied. Only the WP-04 producer root uses a native row pipeline;
the server-safe subpaths do not import it or React.

Not published or ready for application use. Peers are exact development candidates,
not an accepted compatibility matrix. MIT is selected for owned source, but the
rightsholder and legal notice remain pending; private `UNLICENSED` metadata blocks
accidental distribution until those publication inputs are resolved.
