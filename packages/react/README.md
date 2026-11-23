# @tableweave/react — private contract candidate

WP-02 adds browser-independent schemas, wire-v1 validation, pure predicates,
operator/preset extensions, date resolution and semantic identities. These are
private producer candidates awaiting packet review, not a table implementation.

- `/contracts`: `defineQuerySchema`, `createQuery`, `parseQuery`, `normalizeQuery`,
  `getFilterIdentity`, `getQueryIdentity`, `ContractError`, `defaultLimits`,
  `canonicalJson` and schema-specific types (`QueryFor`, `RuleFor`, `FieldAccessors`).
- `/filters`: operator registry/presets, `compileFilter`, `createFilterEvaluator`,
  `translateQuery`, `invertRule`, explicit date resolution and associated types.
- Root: still an empty client entry; no controllers, hooks or native table API.

Contracts/filters contain no client directive or React/UI import. Their only
runtime dependencies are Valibot `1.5.0` and Internationalized Date `3.12.4`.
Vendor validation objects/types are internal. See the repository's
[WP-02 contract](../../docs/engineering/wp-02-contracts.md) for exact context,
normalization, translator and privacy obligations. No fetching, persistence,
authorization or row-processing pipeline is supplied.

Not published or ready for application use. Peers are exact development candidates,
not an accepted compatibility matrix. MIT is selected for owned source, but the
rightsholder and legal notice remain pending; private `UNLICENSED` metadata blocks
accidental distribution until those publication inputs are resolved.
