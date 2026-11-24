# P1 definition/controller composition — PROVISIONAL

Implementation-ready authoring handoff, **not source approval or full facade**.
Target `/tmp/opencode/tableweave-wp09-generations`, supplied34fad4f base. No Git
inspection/write, install, package build/shared emission, server/browser, network,
agent or existing-file edit occurred. Main owns TASKS/intake/exports and final proof.
Only new `packages/react/src/table/{types,definition}.ts` and this test folder are
owned. Existing105 sources, harness34fad4f and all750 protected inputs are unchanged.

## Actual source-private API

```ts
defineTable<T extends object>():
  <const S extends QuerySchema>(input: DefineTableInput<S,T>) => TableDefinition<S,T>

interface DefineTableInput<S extends QuerySchema,T extends object>
  extends NativeDefinitionInput<S,T> {
  readonly tools?: TableToolPlacement;
  readonly defaultColumns?: Partial<ColumnState>;
}
// Returned object is frozen, with actual native definition + frozen resolved tools.
// createController requires its exact definition as this receiver.
definition.createController(options: NativeControllerOptions<S>): TableController<S>

assertTableDefinition(value: unknown): void
assertTableController<S extends QuerySchema,T extends object>(
  definition: TableDefinition<S,T>, controller: TableController<NoInfer<S>>
): ControllerDefinition<S>
```

No root export/barrel/API documentation was modified. Consumers use the existing
`createNativeColumnHelper<Row>()` and its `.columns(...)` inference; no new column
helper or cast is required (see positive.ts). Schema and record types are invariant
through a unique-symbol function member in TableDefinition. That symbol is not a
registration capability: private WeakMaps still reject structural copies/proxies.

Tools: builder/search/columnChooser allow toolbar/external/hidden; tabs/date only
external/hidden. Builder defaults toolbar only if the **normalized native schema**
has builder-owned fields; all others hidden. Placement neither disables commands
nor changes exclusive field ownership. Selection/details/multisort/schema pagination
remain the actual native/schema defaults/capabilities, not another options engine.

The constructor delegates once to actual defineNativeTable. It keeps config only,
no current query/rows/selected IDs/resource/publication singleton. Defaults use
`columnState(native.controllerDefinition, input)` directly: no dummy controller,
clock or query. It copies/freezes only owned metadata/normalized defaults, not app
functions, columns/meta/visibility maps or record objects. Native producer metadata
reflection/schema/custom registry validation remains its actual contract; no
universal arbitrary-Proxy-side-effect or zero-vendor-import claim is made.

Factory options.initial.query and now remain required. Explicit initial order
replaces default order; visibility merges per stable ID with explicit true/false
winning **before** false-only normalization. Pure/native validation rejects unknown
IDs, moved utilities and last-visible-data contradictions. Query/selection/details
references and original callbacks are forwarded to the actual producer unchanged;
that producer performs its existing accepted-state cloning/validation. Return is
the actual frozen native controller, not a proxy or method wrapper. No publication-
ready validator or extra cleanup constraint is installed.

Factory captures **actual C.getDefinition()**, which may differ by reference from
native.controllerDefinition. assertTableController returns that exact reference
after D/C/CD, actual native registration and liveness checks. Unknown/copy/proxy/
same-schema foreign/raw-native-not-facade-created identities deny before private
getter traversal. A valid definition's borrowed createController method cannot be
retargeted to another definition. Two controllers from one definition are independent.

Facade envelope/placement/identity failures use fixed TableDefinitionError,
code `table.definition.invalid`, message `Invalid Tableweave table definition.`
Unknown keys, inherited/non-enumerable/symbol/accessor configuration reject rather
than guess. Existing native/schema/controller errors are preserved when delegated;
column capture errors use state.columns. No raw cause/input/error is stringified.
Inputs to this new facade are own-data envelopes; this does not retroactively change
raw native APIs' metadata behavior.

## Authored cases — NOT EXECUTED

`definition.test.ts` uses actual schema/helper/native/controller factories:

- Builder/other placement defaults and hidden-placement ownership; invalid/null/
  undefined/unknown/symbol/accessor/hidden/inherited tools.
- No record callback invocation during definition construction; application config/
  function/column metadata not frozen or mutated; owned defaults immutable.
- Explicit true unhide, order replacement, invalid utility/group/visibility/order,
  reusable definition/two controllers, actual native registration + CD identity.
- Explicit initial IDs/details and locale/timezone/clock; controlled real proposals,
  reject/accept and validator/query/commit callback paths.
- Native selection/details/sorting/paging capability restrictions, missing now,
  bare selection Cancel without a new publication gate; foreign/copy/proxy/unknown/
  disposed owner lookup before private access.

`positive.ts`: curried row/schema inference, native numeric/computed cell and header/
row contexts, computed filter accessor, inferred query/command/custom operator types.
`negative.ts`:20 authored markers for row/schema invariance, readonly fields/tools,
field ownership/operator/custom operand, required query/clock/initial, placements,
default column values, row ID/accessor/cell/wrong-row inference and factory receiver.

`check-types.mjs` is a **deferred final-phase** runner. Per selected compiler/mode it
compiles the annotated fixture, removes all20 directives preserving line ranges,
requires a real diagnostic for each marker, rejects unused-only/outside-fixture
failures, and preserves logs. Emitted mode first creates actual private own package
emission in this folder's artifacts; it is NOT public-root/packed-consumer proof.

## Actual light checks and limits

One permitted TS6.0.3 command was run:

```sh
node tests/table-facade/definition/light.mjs
```

It compiled the whole actual React package source + positive.ts, noEmit, inherited
strict/full-library options: status0, empty diagnostic log. It did not execute
fixtures or compile negative.ts/runtime tests. Evidence `.artifacts/light-ts6.log`
and `.artifacts/light-ts6.json`. The single compile preceded the final explicit-null
tools guard and formatting/optional-chain follow-ups. To honor the one-light-program
limit it was **not rerun**; no latest-source/full-type approval is inferred.

Static review corrected an explicit-null tools fallback. Initial scoped Biome found
negative native self-assignment and an optional-chain suggestion; both were fixed
without suppressions. Final scoped Biome check:12 code/config files clean/no fixes.
`node syntax.mjs` then parsed six owned TS/config files and node --check'ed four
owned scripts: zero parse/syntax errors, **zero** type programs/tests/emissions.
No full units, dual-compiler/negative/import/emitted/SSR/browser/packed/CI ran.

```sh
node tests/table-facade/definition/syntax.mjs
node tests/table-facade/definition/guard.mjs
```

Guard compares against the original protected-before.json, never rebases it. It
records exact permission-mode/raw-byte-SHA maps (relative keys, Node localeCompare
sort, JSON.stringify(indent2)+LF), excluding Git/.repo/node_modules/.artifacts and
the exact P1 lease. This is not a fresh installed-vendor audit or Git-mode seal.

| Protected scope | Count | Unchanged aggregate SHA256 |
| --- | ---: | --- |
| All existing protected inputs |750|a01655de1c3929001feda1ef48a30d33e06f6f490fb6fa1f22cba7f5fe4250da|
| Existing package sources |105|934fdff95dfccaff66ede588ef6e3956a63a0a0aa46ff1a02fd012fc6659b097|

New producer byte SHA256s:

- table/definition.ts: `5bfd9e77a9436f50f6bf339298e085bc7cb182f7ba9850080ce25a7b3cdd5507`
- table/types.ts: `60c56b51b7e37a17b13dab8404a89792cf8415715e3b50b68478b910a72aa4de`

Final `guard.mjs` writes `.artifacts/implementation-map.json` with exact new
producer/test/config/README/evidence hashes and prints its separately named
aggregate. It excludes ignored artifacts (including itself as output), not old
protected maps. Old historical source/generation seals are never recalculated as
expected or overwritten; these are new P1 scope identities only.

## Final-phase commands — DEFERRED, main/reviewer allocated

```sh
pnpm exec vitest run --config tests/table-facade/definition/vitest.config.mts
node tests/table-facade/definition/check-types.mjs typescript source
node tests/table-facade/definition/check-types.mjs typescript-5-9 source
node tests/table-facade/definition/check-types.mjs typescript emitted
node tests/table-facade/definition/check-types.mjs typescript-5-9 emitted
```

These authored commands were NOT run. Main later integrates discovery/exports and
independently reviews actual final-source runtime/type negatives, native paged
compatibility, import graph and real emitted/packed consumers. This P1 neither needs
nor implements NativeInput/ControlsInput/U4 modes, F1 frame/criteria hooks, resource
lifetimes, useDataTable, recovery/slots/DataTable/SSR or public output registration.
No final definition/facade/WP09/release/PR/merge approval follows from this handoff.
