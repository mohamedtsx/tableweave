# WP-09 U2 — actual native client unslicing

**Worker delivery for independent main review, not source/packet approval.**

Authorized by the full `docs/planning/wp-09-native-client-plan.md` including Activation,
TASKS:58–63 and the explicit U2 allocation. Starting HEAD:
`9f96deb72fcd0f1ff164f2e62ea8ed43f9e11ba2`. Only these producers and this new folder
were written in `/tmp/opencode/tableweave-wp09-stacked`:

- `packages/react/src/tanstack/types.ts`
- `packages/react/src/tanstack/definition.ts`
- `packages/react/src/tanstack/adapter.ts`
- `tests/pagination-policy/native-client/**`

TASK-017 / FR-12/15/16, D-10/D-24. Client-only native source proof; no complete server
input/resource/presentation/facade, controls readiness or full AC-09 acceptance.

## Exact policy and implementation

NativeDefinition now exposes readonly `paginationEnabled:boolean` and each native
view exposes readonly `pagination.enabled:boolean`. The definition flag derives
**only** from `controllerDefinition.schema.pagination.enabled !== false`, using
the single existing validated controller definition. There is no new caller flag.
The original defineController call/arguments occur exactly once before and after;
`normalization-proof.json` verifies the printed original call is identical. Actual
definition/controller WeakSet/WeakMap registration is unchanged.

False + client configures manualFiltering=false, manualSorting=false and
manualPagination=true. The original fixed feature slots and predicate carrier remain
unchanged. Actual TanStack9.3.1 `getRowModel()` now returns the filtered → sorted →
pre-pagination model without slicing. No parallel application row pipeline, copied
filtered array, huge page size, Infinity, complete marker or schema-limit change.

False + ordinary server mode rejects with existing native.page immediately after
the original input-shape gate, before getRowId/eligibility/accessor/filter work.
This also rejects empty/equal-total/full-looking input and unknown/missing metadata.
Existing current/disposed/state checks and legacy invalid-mode/non-array diagnostics
retain priority. There is no new universal getter/proxy or input-capture guarantee.

Disabled view reports a **real known filtered total**, pageCount=null and both
navigation booleans=false. Count/offset math does not interpret the dormant pair as
a result cap. Existing own undefined rowCount/pageCount options clear old values;
no -1 disabled/complete sentinel is added. Enabled unknown manual pages retain their
existing -1 vendor meaning. Enabled/omitted/true client/server behavior is unchanged.

previousPage/nextPage retain current/disposed/query checks first, then deny disabled
policy before old no-op/mutation. Supported native.setPagination still enters the
unchanged U1 guard, denying state.capability before updater/private validators/clock.
Selection false/single/multiple, eligible rendered subset and offscreen IDs remain
separate. Raw vendor options/model internals remain unsupported escape surfaces,
not new authorization/completeness guarantees.

| Producer | Starting SHA256 | Delivery SHA256 |
| --- | --- | --- |
| types.ts | `a72486264cd77d8cfd80db9e1f74d57e95dcda57d9a441ba3eb2e81f99ffb2b3` | `7cca21e7ed8c55760e07dde869bcae40320047634542374341833476e3da34a9` |
| definition.ts | `9f0a6ae53e0fdf33dd976d30861eef88ae54d92d60a3c58d5a0ee5e1601db3b0` | `8480164f945c985be473115a6bb27f74fb3935b0fc10f3a11c221435bf1e3451` |
| adapter.ts | `f2add671658a719c98ecbc6712ba6cf2db275b90b9196c149806103e5bf949a4` | `48497c6bfc342824908648f188100314c6ca40eb36a781dc7b571730a1f657e6` |

`source-delta.patch`/json record the bounded actual diff. No other source is changed.

## Prechange capture — actual original native outputs, not replacement expectations

Before editing, guard verified the three hashes and105-source canonical map:

```text
abba84ba882b2d6d6fa596b74f91003308ed6d249001fa2084ebdef40a8403c2
```

This replays the same Git-mode/actual-SHA map, ASCII/Python sorted keys, indent2 +LF
recipe as main. A new phase-specific102-source protection map excludes only the
three allocated native files. It includes both accepted U1 producers and all prior
metadata/filter/native-boundary/hook/feature/resource/presentation/tool/details/styles.

The original actual model then captured **36 passing paged cases**: omitted/true ×
default/custom size × client/known-server/unknown-false/unknown-true × page0/page1,
plus four known→unknown→client→known phase sequences. Captures include literal
query/identity strings, every ordered final/sorted/filtered ID, manual flags, own
vendor totals, selection/eligible IDs, grouped/visible columns and Next/Previous
effects. The newly added flag is checked separately; old fields replay exactly.

Next, **five actual tests FAILED** on the original sources: two173-record unslicing
cases returned only10/7 rather than148 matches; three ordinary-server cases with
0/1/173 supplied records failed to deny native.page before callbacks. Raw failures,
actual ID arrays/counters and Vitest JSON are preserved, not labeled passed negatives.
Original bare native creation also proved173 input records were sliced to10.

All raw originals, source copies, maps, fixture source copies, graph/bundle and raw
pass/fail reports were sealed in `.artifacts/prechange-seal.json` **before producer
edits**. Raw JSON was written directly to ignored artifacts with LF. A durable
formatted `paged-baselines.json` was made from that raw capture before edits, checked
for identical parsed values, and both byte hashes sealed. No rebase/archival rewrite.

## Executed source verification

| Lane | Result |
| --- | --- |
| New runtime cases | **40 pass**:5 initial denials/unslicing +32 policy +2 time +1 complete golden replay |
| Unchanged native cases | **24 pass**, including original grouped/selection/memo/rollback/boundary regressions |
| Unchanged contract/controller cases | **211 pass** |
| Unchanged final-WP08 command cases | **27 pass** |
| Scoped combined run | **302 passed,18 files**, no failures/skips/todos |
| Strict TS6.0.3/5.9.3 | Whole React source, unchanged native/control-core/collection fixtures, own emitted consumers and authored fixtures |
| Meaningful error removal | **16 directives individually removed ×2 compilers ×2 source/own-emitted modes =64** intended diagnostic cases |
| Native import graph | **18 actual source modules**, original edges/declaring-package externals unchanged |
| Bare Node native construction | Before/after pass; actual registered definition/controller/boundary + real TanStack model, no window/document |
| Full Biome | Three producers + all own supported code/data pass, **15 files**, no rule disables/fixes |
| U2 protection | **102 runtime sources +710 existing test/artifact/config/manifest/lock inputs unchanged** |
| U1 acceptance identity | All14 U1 inputs still match approved `2c2d8f4df8efc57270a2f85d27d0c7c75abcf690e66daa85e4bef944e1496532` |
| Original prechange evidence | All sealed hashes unchanged; durable/raw golden objects identical |

Runtime proof checks every ID/order for173 inputs with148 real matches, defaults10
and custom7 dormant size, plus empty/small/311-record cases with results exceeding
maxPageRows100. That limit remains a page-configuration limit, not a complete-client
dataset cap. Two ordered sorts execute in the actual native model. Tests require
view.rows === actual getRowModel().rows and the final unsliced model === sorted model;
all originals retain exact record references, mutable objects/arrays and original
JSON content. Independent expected ID calculations are test oracles, not producers.

Time cases exercise the real23-hour New York DST interval, its start/end exclusions,
147 matching datetime records, and actual explicit tick changing accepted time. A
valid pure/idempotent rounded custom operator filters/sorts172 rows at accepted time;
wall-clock changes alone do not refresh the predicate. Existing arbitrary-custom
temporal identity/tick limitations are not migrated or waived.

Real getRowId/eligibility/accessor/predicate and command/state/clock/request/query/
commit/subscriber/updater counters verify zero work for false ordinary-server denial
and supported denied paging, after construction/reset at the applicable boundary.
Tests cover empty/equal/full-looking/unknown server inputs, malformed shape priority,
throwing private row getters never reached, actual own-undefined vendor clearing,
current/disposed/stale saved callbacks, U1 reentry priority, actual controlled receipt
reject/accept preservation, weak registration, selection modes, complete eligible
subset/offscreen distinctions, grouped/hidden carrier behavior and selection-only
model/slice reference preservation. No fabricated controls frame is used.

The native actors use unchanged actual createNativeBoundary prepare/commit (which
constructs real TanStack tables and calls real bindTable), and the existing native
constructNativeFixture helper for time/custom cases. No mocked table/getRowModel or
handwritten vendor/runtime copy. Native fixtures use this fixture adapter's actual
options before their first memo observation; comparisons never cross predicate
instances from different adapters. Subscribe/FlexRender come from the real boundary,
not render stubs. This is still not React commit/hydration acceptance.

Types preserve S/Trow, numeric native cell access, field/owner/operand/custom operator,
date/sort and selection inference. Resolved booleans are readonly boolean metadata;
caller paging flags and future complete-server input are rejected. Error-removal
requires the intended file/line and a real semantic diagnostic; no unresolved-module,
missing-name, stub or skipLibCheck acceptance. Native typing legitimately includes
React/TanStack/DOM declarations; no headless two-module/DOM-free claim is made.
Own emitted declarations and their output hashes are listed in handoff.json.

## Exact scoped commands / dependencies / host limits

Cwd `/tmp/opencode/tableweave-wp09-stacked`. Before-only executed commands:

```sh
node tests/pagination-policy/native-client/guard.mjs --before
U2_RUN=before-paged NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/native-client/vitest.config.mjs
U2_RUN=before-disabled NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/native-client/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/native-client/boundary.mjs before
node tests/pagination-policy/native-client/seal-prechange.mjs
```

The disabled command exited nonzero with five failures. Do not rerun/reseal these
before-only commands on updated producers. Final commands:

```sh
U2_RUN=delivery-units NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/pagination-policy/native-client/vitest.config.mjs
U2_TYPES_RUN=delivery-types NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/native-client/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/pagination-policy/native-client/boundary.mjs after
node node_modules/@biomejs/biome/bin/biome check packages/react/src/tanstack/types.ts packages/react/src/tanstack/definition.ts packages/react/src/tanstack/adapter.ts tests/pagination-policy/native-client
node tests/pagination-policy/native-client/guard.mjs --after
sha256sum --quiet -c tests/pagination-policy/native-client/.artifacts/SHA256SUMS
```

All cache/emission/config/report output is in this folder. Source unit aliases are
only the three exact current-target @tableweave/react entries and actual declaring
React/date dependencies, matching root's single-factory registry strategy. Workspace
dist is rejected. This does not use another worktree/registry or a new packed build.

Installed table-core/react-table are9.3.1. Read-only inspection of actual installed
`core/row-models/coreRowModelsFeature.utils.js` confirms getRowModel → pagination;
manualPagination returns pre-pagination, which retains sorting/filtering. Runtime
tests prove that path; v8 documentation assumptions are not substituted. Externals
come from the actual target declaring-package links. React/TanStack runtime is
expected here; the18-source graph is not a pure headless-core import restriction.

Strict checks use actual target installed tool paths and real declaring dependency
declarations. Private emitted-consumer paths explicitly resolve those real packages,
including React-table's actual React-store ESM declarations; no installed files were
changed. One initial240-second host limit interrupted a partial type lane, not a
reported pass. Final long native error-removal runs use an unlimited background host
budget; logs/results record actual completion. Normal TypeScript oldProgram reuse
retains unchanged library parsing while each changed fixture is rechecked, with
skipLibCheck=false and every intended error asserted independently.

Failure history: one new single-selection assertion expected NativeBridgeError,
but the existing controller intentionally converts that validator failure to safe
ControllerError; the private assertion was corrected, not the producer. Initial
private table augmentation did not supply the real Subscribe overload; fixture
construction now uses the unchanged actual boundary. Its first memo comparison
initially crossed two adapter predicate instances; initialization was corrected,
retaining the strict reference assertion. Private type mapping initially treated
React-store's require-resolved .cjs as its ESM declaration path; it now resolves the
actual .d.ts. Formatter-displaced negative directives were moved to actual property
error lines. Raw failures/partial outputs remain separate from final results.

## Frozen history / next owner

U1's old103-source guards and old generation manifests now legitimately detect these
three intentional native changes. Their files/bytes remain frozen: none was rebased,
edited or relabeled passing. U2 uses its own new102-source phase map instead. Existing
U1 artifact-writing tests were not invoked into their frozen folder; U1 producers
are checked through actual native denials and the14-input acceptance identity.

No other source/test/config/index/export/manifest/lock/doc/TASKS/REVIEW/Git edit,
install, shared build/root emission, browser/server/agent, vendor/.repo change or
PR/merge occurred. Main may update docs/ledger; no whole-repository identity claim.
The recorded650-pass/**2-failed** root180-vs199 generation boundary is unchanged;
this stage neither reruns/waives it nor claims full pnpm check.

Ordinary server-complete input/resource provenance remains U4/later. Current controls
projection still equates manualPagination with remote mode and intentionally needs
separate integration; false native metadata does not authorize controls readiness.
No new renderer/static/unknown behavior, facade/tool buffer/privacy before UI commit,
genuine packing, browser/SSR/hydration/manual/performance/backend authorization/full
AC or packet/release acceptance is claimed. Main independently reviews the exact
source/test aggregate and chooses the next allocation; all PRs remain unmerged.
