# WP-09 U4 — explicit complete source (PROVISIONAL)

Implementation handoff only, **not independently verified or approved**. Main
activated this lease at HEAD `1a1086d`, after provisional U3/bootstrap/browser
intakes. The user's one-final-verification instruction applies: only lightweight
compile, syntax, formatting and source/input checks run here. All U4 runtime suites,
negative matrices, preimage replay and independent review remain deferred.

## Changed paths and compatibility fence

Only these eight producers are changed:

- `packages/react/src/tanstack/{types,adapter,boundary}.ts`
- `packages/react/src/presentation/{types,binding,project,masked,authority}.ts`

Main additionally allocated exactly one existing fixture:
`tests/controls/core/authority-mask-review.test.ts`. Its only change is the literal
`paginationEnabled: true` in `neutral()`'s expected object. Original strict equality,
assertions and cases remain intact. Original bytes/hash are preserved in
`.artifacts/original-authority-mask-review.test.ts` and `original-fixture.json`;
`scope.mjs --after` checks the exact one-insertion delta, not just a new hash.

All other new files are inside this folder. No resource/U3, controller/U1, native
definition/features/hook, schema/execution/criteria/publication/details/tool/UI,
export, manifest, lockfile, root configuration, docs/ledger or Git mutation. No
install, shared build/emission, browser/server/network run, agent or vendor change.

## Actual producer interface

- `NativeInput<T>` adds `mode: "server-complete"`, records and **known** page total.
  Only disabled pagination accepts it. Total must be a safe nonnegative integer
  equal to dense supplied count; wrong policy/count is `native.page`, invalid dense
  record container/shape is `native.rows`, before private record callbacks.
  Ordinary server remains rejected under disabled policy, even for empty/full-looking
  pages. Enabled complete is rejected.
- Complete sets all three manual flags and preserves application-provided order.
  `rowCount` is the actual known total; vendor `pageCount` is an explicit own
  undefined clearing value, never dormant-size math. Client/U2 filtering/sorting
  and enabled known/unknown page options retain their routes.
- Boundary prepare captures recognized mode, records and page once, with explicit
  branches for all three modes. Genuine immutable frames, prepare/commit, stable
  native handles and saved-action current guards remain.
- `ControlsRequestInput<S>` omits both query and evaluatedAt. Callers may supply
  optional raw extent, runtime-validated against policy and the captured accepted
  pair. Disabled requires explicit complete; enabled permits legacy/matching page.
  Caller query/time descriptor presence rejects, including hidden/accessor fields.
- `beginControlsRequest` captures accepted query, identity, evaluation time and owner
  references before input reflection/custom compilation. Consumed input/extent fields
  are cached own data descriptors. Policy mismatch rejects before private custom
  query normalization; explicit metadata uses the existing `compileQueryExecution`
  at the captured time with the definition's registry. Pure/idempotent custom
  normalization can repeat; there is no one-callback-count promise or clock read.
- Explicit extent/time reaches real `resource.begin` **before publication**. Legacy
  omission adds neither physical token key. Genuine returned-token binding is
  registered only afterward; synchronous begin observers see unbound/denied. Retry
  registers its actual new token before unbound application transport, closing over
  the original query/extent/time rather than current controller state.
- Scope context/owner disposal is rechecked after custom work/begin/registration.
  Query/tick reentry may retain captured A or refuse, never relabel A as B. Binding
  adds required readonly resolved extent, preserving existing exact WeakMap proofs
  and lookup-only API; no resource factory proof API or old-token upgrade is added.
- Controls source and authority accept explicit remote modes server/server-complete.
  Displayed metadata gains required resolved extent and preserves snapshot A's own
  extent/time while B loads/fails/retries. Token/snapshot/binding extents and explicit
  evaluation times must agree, in addition to existing scope/query/generation proofs.
- Presentation gains required `paginationEnabled` from the immutable origin
  definition, including blocked/masked results. The neutral builder takes it
  explicitly; it is never recovered from another owner's facts.
- Manual pagination expectation is remote **or disabled**; filtering/sorting are
  remote only. Page-only size/remaining bounds stay page-only. Complete requires
  actual known count and unsliced model count. Disabled client total is real filtered
  model count. Disabled range is1..actual rows or0..0; pageCount is null and navigation
  false. Ready complete's intentional resource navigation=false does not produce a
  resource block or deny otherwise-usable selection. Other resource permission,
  freshness, identity, privacy and retry rules remain.
- Navigation still requires event authority before apparent noops. Sort/columns
  retain authorized-domain behavior. Loaded selected records use full original
  input; rendered row eligibility and missing/off-page IDs remain distinct. Selection
  mode false is unsupported selection, not by itself a resource blocked reason.

There is no new public proof helper/export. Local extent comparisons stay private
to binding/project code; U3's private `sameExtent` is not imported or edited.

## Preserved baseline and actual lightweight results

Before runtime edits, all eight initial SHAs matched the activation plan and the
canonical105-source map matched
`3327ca40ba02be4f56534e4b00414fd4836362ec570e15103c97cb606b3cf6fe`.
`.artifacts/before-source105.json` and eight original source copies are immutable
preimages. The separate `.artifacts/protected-source97.json` excludes only the eight
allocated producers. Old U1/U2/U3 source/test maps and failed runs are not rebased.

Actual checks run:

| Check | Result |
| --- | --- |
| Initial8/source105 hashes and protected97-map creation |Passed before producer edits. |
| First TS6 package + own-fixture light compiles |Both failed on one TS2339 remote-union narrowing error in `authority.ts`. Logs retained as `package-light.log` / `fixtures-light-first.log`. |
| Corrected final TS6 package noEmit |Passed: `.artifacts/package-light-final.log`. |
| Corrected final TS6 own fixtures + allocated existing fixture noEmit |Passed: `.artifacts/fixtures-light-final.log`. Strict base, no skipLibCheck/stubs. |
| Scoped Biome / MJS syntax / final source/input check |See `.artifacts/biome-final.log`, `syntax-final.log` and `handoff.json`; these are lightweight checks, not runtime acceptance. |

The first formatting run succeeded with two optional-chain warnings; the suggested
source simplifications were applied before final checks. Neither initial compile
failure was suppressed, erased or classified as passing.

## Authored regression files — execution DEFERRED

- `fixtures.ts`: actual current-target native boundary, resource tokens/views,
  controller factories, bindings and authorities; no fake native table/frame or
  cross-worktree/dist registry. Application fixture retains genuine request tokens
  by identity instead of treating copied snapshot envelopes as tokens.
- `native.test.ts`: all six policy/mode combinations, empty/nonempty/two owners,
  complete137 order/manual/count checks, invalid known/unknown/sparse/accessor
  containers before callbacks, mode capture, client filtered148 and old vendor
  known/unknown/undefined-clearing semantics.
- `binding.test.ts`: publication-time metadata/unbound denial, legacy physical keys,
  metadata/override/getter refusal before private normalization, input/compile/begin
  reentry for query/tick/scope/disposal, retry-before-transport original tuple,
  copied/foreign-owner/resource lookup denial.
- `projection.test.ts`: genuine complete0/137/173, enabled client/known/unknown pages,
  selection modes, disabled navigation/noops, authorized layout, loaded-vs-rendered
  selection, retained A/failure B/retry/fresh0, copied/foreign/stripped/time/label/mode
  denials, raw legacy/complete resources without new binding, false-origin masks,
  stale actors/Cancel and real complete selection/reorder authority.
- `legacy.test.ts`: final-phase comparison of old paged/control fields, physical
  request keys, actual model metadata and callback event order against the exact
  preserved eight-file preimage. No before runtime capture, red failure or golden
  comparison is claimed executed now. Generated JSON is LF-terminated and write-once.
- `types.ts`: positive raw/generic ports and13 negative lines for owner query/time,
  complete known totals, row type, readonly metadata/policy, custom operand/owner/
  sort/date inference and required extent.
- `check-types.mjs`: authored final TS6/5.9 source/own-emitted declaration consumers
  and existing source fixture checks. Uses **one all-directives-removed program per
  compiler/mode**, checking every expected diagnostic line/file/code (52 intended
  negative-line checks), not13 individual recompiles. Not run now.

Projection denial callback counts are reset **after** genuine native construction;
they assert no additional private loaded-record/eligibility work in the denied
projection, not that native construction never inspected records.

## Final-phase commands (not executed)

From `/tmp/opencode/tableweave-wp09-stacked`:

```sh
U4_PREIMAGE=1 U4_RUN=legacy-preimage NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/complete-source/vitest.config.mjs
U4_RUN=final-units NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/complete-source/vitest.config.mjs
U4_TYPES_RUN=final-types NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/complete-source/check-types.mjs
node tests/pagination-policy/complete-source/scope.mjs --after
```

The preimage lane substitutes only preserved original producer bytes via a loader;
it never overwrites candidate sources. Each original hash is checked before use.
The candidate lane must not be run first expecting a missing golden to be a pass.
Original-source capture command `scope.mjs --before` is **not** a replay command;
do not reseal current producers or rebase earlier stage guards.

Full unit/preimage/type/emitted/graph/import/browser/SSR/packed and independent
verification/fixes remain batched for the user's final phase. Main owns public
output/discovery integration, commits and PRs. All PRs remain unmerged/provisional.

## Exact intake and limits

`.artifacts/handoff.json` records current producer/test/README hashes and input
aggregate, the97-source byte check and exact fixture delta. No generated-output
manifest or output-generation approval is produced.

This is application-asserted source metadata plus genuine library binding, **not**
backend completeness/authentication, unfiltered/all-matching selection authorization,
pixel/privacy-of-arbitrary-app-objects, full AC, AT, performance, real consumer,
publication or whole-packet approval. Fabricated truncated rows plus fabricated
matching total cannot be detected as backend truth. Custom temporal behavior stays
captured-evaluation limited; no clock/identity migration is introduced. Historical
root characterization remains650 passed/2 failed (old180 vs199 outputs), not rerun,
fixed or waived here. U1/U2 historical approvals are unchanged; U3/U4 remain provisional.
