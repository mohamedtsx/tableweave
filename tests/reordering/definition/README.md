# Definition reorder capabilities — implementation-ready PROVISIONAL

TASK-018 / FR-02/03/14, AC-12/13. Main owns this isolated two-file addition from
848c94b under the primary tree's definition-capabilities plan. No other worker's
changing source/API was read or intaken. No runtime/independent/G-02 acceptance.

## Actual API and ownership

```ts
const definition = defineTable<Item>()({
  schema,
  columns,
  getRowId: item => item.id,
  reordering: { rows: true, columns: false },
});
```

`DefineTableInput.reordering` is optional own-data metadata. Rows/columns each
default false, independently of selection, manual ordering, tools and handle slots.
`definition.reordering` is a distinct frozen readonly rows/columns object. Supplied
false remains false; an empty object enables neither axis. Explicit present
undefined/null/nonboolean/unknown-key/accessor/nonenumerable/inherited configuration
is rejected rather than truthiness-coerced. Throwing inherited-flag reflection is
converted to the existing safe TableDefinitionError without exposing its cause.

The existing captured-data helper snapshots each supplied descriptor once; it does
not invoke flag getters or freeze caller containers/callbacks/records. Proxy traps
can still perform application-owned effects—this is no arbitrary-code sandbox.
This additive genuine-definition capability is **configuration, not permission**.
Future bindings must also prove current factory/admission/renderer/source/member
authority and explicit UI configuration. These flags create no controller, move
coordinator, callback, row processor, ref, DOM work, transport or persistence action.

Only react/src/table/{types,definition}.ts changes. NativeDefinition/controller schema
producers, real createController callback composition, CD/state/query identity code,
tool defaults, root exports and every existing fixture/seal remain unchanged. Actual
output identity/behavior is a deferred regression obligation, not inferred from a
source-file hash alone. Raw native and pure reorder entry surfaces are untouched.

## Authored fixtures and actual light checks

- Genuine definition regressions cover omitted/empty/default/explicit flags, caller
  mutation/freeze, no record callbacks, native/CD shape/identity, real controller
  factory, one-time descriptors, invalid inputs and safe throwing reflection. They
  are **authored but unexecuted**; adversarial structures appear only in denial cases.
- Type cases preserve Item/schema inference and readonly output; four negatives
  cover mutation, string coercion, unknown axis and explicit undefined. The removal
  runner is authored with intended diagnostic lines and remains unexecuted.
- Necessary frozen existing-dependency install succeeds. No DnD dependency is added.
- Initial positive source TS6 and final current positive TS6 noEmit pass, including
  test-source typing, without executing any factory/test or reading package dist.
- Initial Biome reports own fixture formatting/type-import warnings; a later pass
  reports one helper formatting line. Patch corrections yield a passing full scoped
  formatter/lint with assist disabled. All failed/successful logs remain externally
  under `/tmp/opencode/wp10-definition-*`; no failure is silently erased.
- Static syntax/protected-source scope checks pass against the immutable145-source
  map31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe, preserving other143
  sources. Two original source preimages remain at `/tmp/opencode/wp10-definition-preimages`.
  Deferred-runner syntax passes; no negative program actually ran.

No build, unit/React/browser/SSR, negative/dual/emitted, ordinary installed/packed,
G-02 or independent approval is claimed. Original/fc01/profile assets and producer
seals stay unchanged; installed dist remains historical. Active admission/native
lifetime workers retain their own baselines; main intake waits for their handoffs.

## Deferred final commands

```sh
pnpm exec vitest run --config tests/reordering/definition/vitest.config.mts
node tests/reordering/definition/check-negatives.mjs typescript
node tests/reordering/definition/check-negatives.mjs typescript-5-9
node node_modules/typescript-5-9/bin/tsc -p tests/reordering/definition/tsconfig.json --pretty false
```

Current/ordinary emitted/packed and native UI/admission integration programs must
cover this new field after final output allocation. Do not run historical old-source
hash guards on the intentionally changed files and rewrite those seals to call
them passed; preserve exact producer replay and a distinct current-source lane.
