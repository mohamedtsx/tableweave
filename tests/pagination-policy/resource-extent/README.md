# WP-09 U3 — provisional resource extent producer

**Implemented, not approved.** Target: `/tmp/opencode/tableweave-wp09-stacked`,
starting HEAD `0288904d2764796909ffadfe1660949975039bba`. The user's later
single-final-verification instruction supersedes per-stage exhaustive review
timing. Main may inspect this interface and provisionally advance dependent work;
this handoff grants no source/packet approval.

## Delivered boundary

Only `packages/react/src/resource/{types,adapter,view}.ts` and this new directory
are written. No hook, controller, native, binding, presentation, execution/schema,
export, manifest, lockfile, root configuration, shared build, docs/ledger or Git
mutation is included. No installs, agents, network, browser or server runs.

- Request input/token gain readonly optional `extent?: QueryExecutionExtent`
  (type-only import) and `evaluatedAt?: number`; snapshot inherits its real token.
  Success has **no** metadata override ports.
- Both absent preserves legacy physical page shape. Explicit page must match the
  copied query's index/size; complete is kind-only. Both require finite Date-valid
  captured time. Raw optional types intentionally do not rule out every invalid
  combination; runtime enforces pairing, shape and descriptor rules.
- Consumed root fields, metadata, page and record-container/index data are captured
  through cached own descriptors. Accessors are rejected without invocation;
  unrelated envelope extras and retry's generation remain ignored. Reflection
  traps can have side effects; this does not promise blanket Proxy prohibition.
- Complete success needs a dense supplied array and known safe integer total equal
  to the captured length (including0), without a complete-row cap. Array containers
  are copied/frozen; application records, original arrays and retry functions are
  not cloned/frozen. No custom record iterator is used.
- Failed begin/success validation does not advance generation, close the current
  token, change buffer/retry or notify. Existing context/lifecycle/identity refusal,
  one-buffer replacement and unbound retry callback semantics remain.
- Omitted page and matching explicit page resolve equally. Complete/page differ
  despite identical opaque keys/query. Time alone does not imply obsolescence.
  Complete disables navigation, not otherwise-usable selection/reordering/retry.

`sameExtent` stays private in `view.ts`. There is no schema/registry lookup, policy
inference, clock call, backend authorization or native completeness binding here.

## Immutable before evidence and actual outcomes

Before producer edits, original three hashes and canonical source105 map
`497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790`
matched the activated plan. `.artifacts/prechange-seal.json` preserves originals,
raw/formatted legacy captures, test preimages, original failures and runtime graph.
**Do not rerun before-only capture/seal commands against the new producer.**

Actual prechange evidence:

- One passing legacy test captures five scenarios, including literal view JSON,
  physical request/snapshot keys, retained buffers, retry generations/undefined
  callback `this`, fresh-empty replacement and inactive/disposed refusals.
- Five genuinely failing new-policy tests: missing metadata/navigation behavior,
  complete unknown total, complete contradictory total, success promotion and
  time-only input. Original logs/observations are unchanged.
- Four-module generic runtime graph and bare Node construction passed.

Actual postimplementation outcomes **before the last authoring/formatting changes**:

| Command/lane | Actual result |
| --- | --- |
| `U3_RUN=units … vitest …` |343 tests passed; unchanged resource server test failed to import `react-dom/server` through the private harness. No producer failure. |
| `U3_RUN=units-2 … vitest …` after adding that source-fixture alias |344 passed /17 files:86 new +47 unchanged resource +211 unchanged contracts/controller. |
| `node …/boundary.mjs after` |Same four runtime modules, zero external runtime dependencies; bare Node complete137 construction passed. |
| `node …/guard.mjs --after` |102 protected sources +941 existing inputs unchanged; prechange seal unchanged. |
| TS6 `tsc -p packages/react/tsconfig.json --pretty false` |Passed, no emit. |

The first unit import failure and successful second run are preserved separately
in `.artifacts/units.log` and `.artifacts/units-2.log`. The unchanged server unit is
one bounded pre-existing server-import check, **not** full SSR/hydration evidence.

Since those runs, authoring added three cases (hidden root metadata x2, aliased
result/page x1), fixed legacy-fixture typing without changing its intended runtime
values, placed type directives on their actual offending lines, added explanatory
type comments and formatted only allocated inputs. The current authored suite is
not claimed rerun or passing. The initial Biome authoring run reported two test-file
export errors; those redundant exports were removed.

After authoring, lightweight TS6 compile of all own TypeScript fixtures passed via
`tsconfig.light.json` (strict base, no emit/no skipLibCheck). Scoped Biome checked17
files successfully; the subsequently added handoff script was checked separately.
`.artifacts/light-types-final.log`, `biome-final.log` and `biome-handoff.log` record
these outcomes. A subsequent source/input-only handoff records exact current hashes
and checks the102 protected source bytes, without fingerprinting generated outputs.

## Final-phase commands — DEFERRED, not passed

Run from the target root when main authorizes the final verification phase:

```sh
U3_RUN=final-units NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/resource-extent/vitest.config.mjs
U3_TYPES_RUN=final-types NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/resource-extent/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/resource-extent/boundary.mjs after
node tests/pagination-policy/resource-extent/guard.mjs --after
```

`check-types.mjs` is authored but **not executed**: strict TS6/5.9 whole React source,
own source/declaration emission and consumers, own fixtures,16 individually removed
negative directives per source/emitted/compiler combination (64 intended checks),
with exact diagnostic line/file/code checks. No individual-negative or TS5.9 pass
is claimed. No public/root output emission occurs in this runner. Final inspection
must also consider existing resource type fixtures and any final consumer changes;
the current runner's own fixture compile is not that broader acceptance.

Final scope/guard/Biome, declaration/public discovery integration, fresh independent
review and any required repairs remain main-owned. `guard.mjs --after` intentionally
requires this U3 stage's original protected inputs; after separately authorized U4
changes, use stage-specific verification rather than rebasing historical maps.

## Exact provisional handoff

`.artifacts/handoff.json` supplies the exact producer/test/README input hashes,
aggregate, observed result lanes and deferred list. `.artifacts/protected-source102.json`
is the separate U3 protection map derived from the immutable source105 preimage,
excluding only the three leased resource files. Historical U1/U2 maps are untouched;
their resource-sensitive checks may legitimately observe this intentional U3 delta.
`stage-handoff.mjs` hashes source/authored inputs only, not generated outputs.

No final output manifest has been produced under the verification-timing steering.
No U4/native/control/facade/full-AC, genuine packed, browser/AT/performance, complete
backend truth, publication, commit/push/merge or full-root approval is asserted.
The existing root characterization remains650 passed/2 failed (old180 vs199 output
guards), not rerun or waived here. A fabricated truncated dataset plus fabricated
matching total is not detectable backend completeness proof. Custom temporal
behavior remains captured-evaluation limited, not a clock/identity migration.
