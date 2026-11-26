# F3a private criteria UI-port capture — PROVISIONAL

Capture-only source and tests authored from the supplied child baseline `1004252`.
Main's canonical `wp-09-criteria-ui-ports-plan.md` was read in the stacked worktree;
the child TASKS top authorizes this exact two-path lease. No Git command, install or
reverification of the supplied revision was performed. **No runtime/final approval.**

Only new `packages/heroui/src/filters/criteria-ports.ts` and this new test directory
are written. F2, raw UI/date/toolbar/types, all existing tests, exports/config/package/
lock/docs/TASKS remain unchanged. No F1 symbol, actor, cell, hook, authority,
publication, criteria-target prop, accepted controller/query mirror or draft buffer.

## Exact internal exports

- `CriteriaPortsCheck = () => undefined`: required future **library-owned** gate.
  Throw/non-undefined denies. A boolean app permission callback is not this protocol
  and is never interpreted as proof. This helper itself establishes no provenance.
- `CriteriaPortsError`: fixed code `criteria.ports.unavailable`, message
  `Criteria UI ports are unavailable.` No raw exception, cause or payload is exposed.
- `FilterSearchPorts<S>`, `FilterTabsPorts<S>`, `FilterDatePorts<S>`,
  `FilterBuilderPorts<S>`, `FilterFieldPorts<S>`: readonly, actual-type-derived
  configuration selections; no weakened full-props clone or generic any dictionary.
- `captureFilterSearchPorts<S>(input, check)`.
- `captureFilterTabsPorts<S>(schema: S, input: TabsInput<NoInfer<S>>, check)`.
- `captureFilterDatePorts<S>(input, check)`.
- `captureFilterBuilderPorts<S>(schema: S, input: BuilderInput<NoInfer<S>>, check)`.

The input aliases are exact `Pick`s of the existing raw tool props. Full actual
props can be passed directly, without reading/spreading their controller/context/
owner/discriminant fields in this module. Tabs/Builder infer S only from the actual
schema argument. Search/Date can receive the explicit S from the future typed host.
Schema metadata is only a key-selection/type input, **not** a genuine frame or
controller identity assertion. Main owns later root discovery and F3 integration.

## Actual captured configuration

| Tool | Consumed ports/data (no defaults manufactured) |
| --- | --- |
| Search | Partial actual search messages and toolbar onMutation |
| Tabs | Actual schema tab IDs only, presentation label/disabled/count value+description, neutralTab, activation, partial messages, onMutation, single opaque children value |
| Date | Registry, supplied presets id/label/typed standalone date operand, actual summary/time-zone/relative formatters and date/editor text messages, toolbar onMutation |
| Builder | evaluationMode, actual builder-owned schema field presentations only, label/operatorLabels/static choices/asyncOptions/formatValue/renderEditor, registry, builder/date messages, createRuleId and builder onMutation |
| Option port | Exact opaque source identity, correlated idType, guarded onRequest and nextPageKey; no method/label/snapshot/connection work on source |
| Registry | Actual custom/descriptors/get shape, metadata id/labelKey/types/cardinality/inverse/builtin/custom, each custom validate/normalize/evaluate separately guarded |

Actual `FilterFieldPresentation` has **formatValue/renderEditor**, not renderValue
or formatOperand. The helper does not invent those missing APIs. Date preset data
is copied by its real date.on/date.between / point/relative/rolling shape. Semantic
query/operator/calendar validation still belongs to the actual controller/helpers;
this capture does not normalize queries or invoke a custom validator to validate
configuration. Registry wrappers are local ports, never a new genuine native
definition/controller/authority.

### Actual call sites and receiver rules

- `toolbar/filter-shared.ts:83–93`: observeMutation receives/destructures the
  observer and invokes it bare; Search/Tabs/Date wrappers use **undefined this**.
- `filters/filter-builder.tsx:180–185,230–234`: createRuleId/onMutation are members
  of actual props; wrappers retain that original input object and captured function.
- `filters/filter-builder.tsx:452–457` and `filters/value-editors.tsx:441–457`:
  formatValue/renderEditor retain the original field-presentation receiver.
- `filters/value-editors.tsx:34–58,391–398` and React source
  `filters/options-source.ts` retry: onRequest is a port-member on initial request,
  **bare on actual source retry**. The one wrapper preserves both call forms;
  nextPageKey retains the original port receiver.
- `toolbar/filter-date.tsx:263–271,306`, `date/date-operand-editor.tsx:215`,
  `filters/filter-builder.tsx:473–475`: direct partial-message calls retain their
  original dictionary; component-merged message calls forward the **actual merged
  invocation receiver** (including its component defaults); bare builder-relative
  calls retain undefined this. No defaults are imported/reconstructed and no merged
  receiver is cloned/frozen. The future caller must pass only its committed message
  containers/arguments; passing an arbitrary receiver is not provenance proof.
- Actual registry.get and custom validate/normalize/evaluate are member calls;
  retain their original registry/custom objects, not captured replacement objects.

The existing public callback signatures are unchanged. No new application callback,
reset callback or renderer protocol is required. Invocation receiver handling does
not change the captured gate identity or make an old wrapper adopt newer props.

## Capture/guard mechanics

1. Run the required gate before any input/schema traversal. Checks also run before
   and after each reflection, including thrown traps, and on cache hits. Consume
   only known own data descriptors; getters are rejected without invocation.
2. A capture shares descriptor/prototype/inherited-presence/key/owned-container and
   wrapper caches across aliases. The same field/custom/descriptor alias is copied
   once and reused. Known config dictionaries are plain/null-prototype objects;
   inherited supplied members are invalid, never an absent-default fallback.
3. Do not enumerate every app prop. Static message keys are exhaustive, type-checked
   schemas, not copied UI default values. Fields/tab entries are selected using actual
   schema IDs; unrelated getters/unknown root or field symbols are untouched. String-
   indexed operator-label dictionaries reject own symbol keys **without reading their
   values**. Arrays consume own length/dense indices, not app iterators/species.
4. Optional root/field/option undefined is retained when actual legacy fallback or
   optional-call behavior allows it; presence is not silently rewritten to omission.
   Missing dictionaries/defaults stay omitted, and empty supplied presets stay empty.
   Required message overrides (text/formatter), including explicitly undefined callable
   overrides that would overwrite a merged required default, are invalid. Null or
   non-function supplied callbacks deny rather than fall back.
5. Freeze only newly owned containers. Original sources/functions/presentations/
   registries/React nodes/records remain borrowed, untouched identities. Choice and
   date metadata receive new containers; opaque source and React-node values are
   never traversed or deep-frozen. No source readSnapshot/clear/connect/subscribe/
   registration, label projection, cursor or transport occurs during capture.
6. A captured wrapper closes over its immutable Capture/check/function/receiver
   selection. It checks before invoking private work and in a finally after return
   **or throw**, discards revoked results and emits only the fixed safe error.
   Wrappers are cached within that capture (gate identity is implicit in its scope),
   not rebound per property read or silently updated from a latest-props ref.
7. Registry.get itself is never called during capture. When explicitly called later,
   its result is guarded/captured with the same alias cache; custom nested callbacks
   are independently fenced. If a normalizer catches denial, the next wrapper and
   the future caller's final gate still deny; this module never treats an earlier
   result as lasting permission or authorizes mutation after a callback/await.
   These fences surround library-initiated calls; they do not interpose inside an
   application's own callback body or patch its saved/raw nested functions. Original
   app receivers/functions must remain intact. Reentry is checked on return/throw
   and before the next library-owned invocation.
8. Do not stringify/inspect arbitrary thrown values, thenables, constructor/species
   or callback result objects. Transport work and React results are returned opaque
   after the synchronous post-call check. No Promise consumption, async permission
   receipt or universal rejection-containment claim is introduced.

These helpers alone provide **no** UI readiness, source genuineness, domain pairing,
same-domain form/session preservation, source cleanup, privacy-before-commit or
backend authorization. The future host must first discriminate owner/context/optional
criteria correctly and require genuine current F1/F2 provenance; the future F3 cell
must commit ports and maintain actor readiness. None of those producers is scaffolded
or imported here. Existing raw tools are not changed or adopted.

## Authored tests — deferred, not passing evidence

`unitGate()` is deliberately a **unit-only capture check**, not a permitting F1
authority, real actor or adoption proof. Tests use actual port types/metadata/functions,
actual schema/normalizer and genuine raw option-source factory where needed. An
opaque source proxy test proves only non-traversal, explicitly **not** F2 genuineness.

Authored cases cover: gate-first opaque input/schema denial; single descriptor capture
and aliases; unknown getters/symbols; supplied inherited callbacks; reflection throw/
revocation; zero capture-time callback/source acquisition; bare/member/merged receiver
semantics; actual raw-source bare retry; registry aliases/nested callback fences;
get/validate/normalize/evaluate/cursor/request/mutation/formatter reentry; safe callback
throws; absent/default vs explicit undefined/invalid values; old wrapper/old gate after
candidate mutation; preset/choice copies and borrowed React children. Positive fixtures
accept the actual four full raw prop interfaces. Negative fixtures remain excluded
from the light program and are not evidence until individually exercised.

## Frozen inputs and measurements

- `protected-before.json`: original F3a preimage of **728** existing inputs, including
  all existing source/tests/manifests/lock/profiles and local docs/product/TASKS owners.
- `protected-f2-before.json`: separate **23** F2 files: three sources and the actual
  20 existing fixture/evidence files (measured count, not an assumed file count).
- All old F2/105-source/input maps are protected byte-for-byte historical inputs.
  This new lease's before map is not an automatic rebase of any prior producer seal.
- `handoff-hashes.json` records the new helper/own fixture hashes only; README/self and
  private emissions are excluded. Measurements grant no approval/public identity.

Measured new helper SHA-256:
`80c7c067bcf5d0c0cb768d6edef83b6aca629827ebcef3836a8fbbd3176bdc37`.
The manifest additionally measures **13** new fixture/evidence files. These are
provisional source/input measurements, not an output-generation identity or approval.

## Actual light work / limits

Permitted: scoped authoring/formatter, one light TS6 positive source/fixture compile,
static syntax/import inspection and scope fingerprints. Initial TS6 authoring errors
were limited to message-schema inference and a test assertion's flow narrowing and
were corrected; the final light result is recorded below. Negative fixtures, units,
React, browser, dual compilers, emitted consumers, package/SSR/CI, manual/device/perf
and independent verification are **not run**. No install, shared build/emission,
server/browser, network, agent, vendor/.repo/credential, Git or root export operation.

Actual final light results:

- TS6 positive source/actual-type/own-fixture noEmit program: **exit 0** after the
  final helper/fixture edits. No negative or emitted-consumer program was included.
- Scope: **all 728 frozen existing inputs unchanged**, including the separately
  fingerprinted 23 F2 source/fixture files and every historical map/profile.
- Static syntax/type-import inspection: **one helper runtime module, zero runtime
  imports, seven erased imports** of actual existing types. Transpile inspection
  stayed in memory; no compiled JS/declaration files or runtime imports were executed.
- Node `--check` on the new deferred unit runner and negative checker: exit 0,
  syntax inspection only. Scoped formatting touched only allocated new files.

Static source graph: only this module at runtime; all actual tool/message/field/option/
registry/React type references are erased imports. Parser/transpile inspection is
not an executed runtime import or browser proof. Fixture typechecking resolves real
existing sources/installed versions through the same explicit source paths as the
existing toolbar type fixture; no fake F1 types or manufactured package exports.

## Deferred final-phase commands (not run here)

```sh
node tests/criteria-ports/scope.mjs
node tests/criteria-ports/check-boundary.mjs
node tests/criteria-ports/run.mjs final-001
node node_modules/typescript/bin/tsc -p tests/criteria-ports/tsconfig.json --pretty false
node node_modules/typescript-5-9/bin/tsc -p tests/criteria-ports/tsconfig.json --pretty false
node tests/criteria-ports/check-negatives.mjs typescript
node tests/criteria-ports/check-negatives.mjs typescript-5-9
```

The unit runner writes only `.artifacts/<fresh-label>` here, uses main-installed actual
declaring data dependencies and preserves failure logs. It rejects runtime HeroUI/
React/component imports from the helper. Its execution and the individual-negative
checker remain provisional until main's final phase. Own emitted/public/packed and
real F3 cell/React integration require separate main-selected checks/intake; these
source-only commands do not prove those lanes.

Implementation-ready **PROVISIONAL**. Main owns intake after active F1 handoff and
then real-cell use of genuine symbols. No self-approval, full WP-09/AC16/25 privacy,
SSR/hydration, manual, package/generation, publication or release claim follows.
