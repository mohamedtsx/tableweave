# P2 headless facade — implementation-ready PROVISIONAL

TASK-017 / FR-01/04/12/13/16, partial AC-16/25, activated by main at9b68eae.
This handoff implements the allocated source hook/model/recovery slice only.
Runtime, React, SSR, negative/dual/emitted, browser, import-graph, packed and
independent verification remain deferred to the user's single final phase.
No n1 approval, full acceptance, source-output registration, publication or merge.

## Lease and preserved baseline

Existing worker sources: `table/types.ts`, `presentation/criteria-frame.ts`,
`presentation/criteria-frame-react.ts`. New sources: `table/use-data-table.ts`,
`table/recovery.ts`. All remaining source, old tests/artifacts, manifests/configs,
lockfile and root exports are frozen. Main alone owns docs/TASKS/REVIEW, exports,
intake and Git. The Search/Tabs worker remains isolated until this handoff.

Before any producer edit, `scope.mjs --before` verified the actual119-source map
(including CSS) and its supplied aggregate:
`1eb525a870c29deebfa7c7db840ed8044b664d26c782b8369e14c18cb0813420`.
The three exact activation hashes matched the plan. The canonical map, three
preimages and derived116-source protected subset are saved in `.artifacts/`.
The other116 expected hashes are never recaptured from modified bytes.

`before-inputs.json` additionally captures1234 existing test/config/seal files,
including historical `.artifacts` files (excluding `node_modules`/`dist` trees).
Historical bridge/F1/U3 maps, blockers, failed logs and output identities are not
rewritten. The main-owned resource identity source remains exactly
`7ce69208472b815420ff1688016375c6633fdb9626a6ef8b055b42d6fa3405d2`.
After inventory expects exactly121 source paths:119 + two intentional additions.
Final source/fixture hashes and aggregate are in `.artifacts/handoff.json`.

## Source-module APIs (root integration still main-owned)

```ts
useDataTable<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S,T>,
  options: DataTableOptions<NoInfer<S>,NoInfer<T>>,
): DataTableModel<S,T>;
```

`DataTableOptions` has readonly `controller`, `publication`, `criteria`,
`expected`, the actual existing `ControlsInput<S,T>["source"]`, and optional
own-data `manualOrder`. It has **no** duplicate NativeInput, derivation callback,
permission flag, transport, query/cache provider, default Export or UI actions.
Schema/record inference is anchored in invariant P1 definition types.

The actual P1 `assertTableController` authenticates D/C identity and returns the
real `C.getDefinition()` object. No equality assumption against
`D.native.controllerDefinition` is used. Unknown/copy/proxy D/C and same-schema
foreign C reject before source payload or alleged C snapshot readers. Exact
publication binding of an issued criterion authenticates P before alleged P ports.
Own getters on private input envelopes are not invoked; malformed envelopes deny.
Arbitrary side effects hidden in Proxy traps/global mutations are not a universal
interception guarantee.

One session borrows the immutable D/C/P lifetime and creates an inert genuine
F1 owner. Only that selected session's original lazy boundary can become active.
React may discard duplicate *inert initializer evaluations* in development Strict
render probing; they acquire no boundary/subscription/lifetime. Strict **layout
replay** retains the selected owner and its sole native boundary. There is no
global singleton/cache of C/P or shared owner between facade instances.

The app owns P setup/issued criteria, initial certificate/retirement, pending
receipts, resource connection, fetch and request binding before providing data.
No new C, C wrapper, P, epoch, auto-bootstrap, initial reset, persistence, URL,
storage, clock, Query dependency or resource begin/connect/clear/setContext/dispose
is introduced by the facade. Accepted state is the actual readonly C snapshot,
subscribed directly; it is not a requested/displayed state mirror.

### Readonly model and identity

`DataTableModel<S,T>` has an invariant declaration brand and separate private exact
WeakMap issuance. Its readonly fields are:

- actual `definition`, `controller`, `state` references (null if unavailable data
  must be masked; an unknown owner never becomes a fabricated reference);
- `phase`: `uncommitted`, `display`, `no-display`, `unavailable`;
- actual committed `frame`, `view`, `presentation`, `authority` when available;
- `toolTarget: { owner, authority: CriteriaToolAuthority<S> } | null`;
- distinct `sourceTarget: { owner, authority: CriteriaSourceAuthority<S> } | null`;
- finite source `metadata` and pure `recovery` facts.

Targets are structural headless envelopes carrying exact actual capabilities;
there is no HeroUI import. Source authority is never cast into tool authority.
Model issuance is derived reference/provenance, not publication or permission.

`assertDataTableModel(model)` checks only exact issuance, including genuine neutral
unavailable models. `getDataTableModelOwner(model)` is provenance-only and returns
actual D/C refs, or null without an accepted owner. Unknown/copy/proxy models are
rejected before payload traversal.

`requireDataTableModel(model, expectedDefinition)` authenticates issuance/owner,
actual D/C/CD/P, current C snapshot and genuine source/tool authorities. A neutral
uncommitted read also checks the real pending/current publication origin; it grants
no actions. Display reads require the exact still-current committed frame, not
merely a tool capability that can follow a later replacement. Metadata/state are
checked again after gates; stale/revoked/superseded models deny. Error type is fixed
`DataTableModelError`, code `table.model.unavailable`, with no raw cause.

There is no public model registration setter or structural permitting flag.
Internal casts label untrusted owner refs immediately before exact registry
assertion, or the sole immutable model issuance whose proof is privately stored.
They do not coerce consumer rows/schema/operands to fit the facade.

Cached `canSelect`/`canRetry`/other visual booleans are **not** event permission.
Actors must use actual authority methods/capability checks at event time. Source-
only Retry is eligibility metadata, not an app callback/transport fallback.
Previously delivered references cannot be physically erased from consumers;
no memory-erasure claim is made.

## Private bridge extension and projection linearization

Existing public `useCriteriaFrame` still treats an omitted native input as
source-only. Explicit invalid native fields still deny. Its raw return contract
does not expose the facade's presentation cache or run controls projection.

New source-private helpers in the allocated files are
`captureCriteriaSourceFrameInput`, `useCriteriaSourceFrame`, and
`requireCriteriaCommittedFrame`. Main should **not** add them to root exports.
An internal common store/capture implementation carries the private mode; there
is no application callback/derive option and no second processing engine.

Only actual layout/commit:

1. Authenticates the actual owner/P/criterion/expected/source. Remote factory
   identity precedes alleged R view/ports/bindings. Existing U4 current/snapshot
   binding, policy, query-reference, extent/time and liveness gates remain required.
2. Derives NativeInput from the actual client complete array, or the genuine
   displayed remote snapshot's own records/page. No remote snapshot means **no
   native model**, not a fake zero-row boundary. A genuine fresh empty success
   can correctly produce an empty real model.
3. Commits source metadata, then actual sole-owner native prepare/commit/issue.
   Retained snapshot A stays A while B is pending/failed, including A's query,
   original evaluation/extent, page/range and empty cause.
4. Calls the actual paired `controls.read()` once for a fresh committed frame,
   after source/tool permission. The exact returned ControlsPresentation is cached
   by reference. Pre/post/finally checks cover source, current exact frame/version,
   actual C snapshot and R view identity; reentry/failure discards local readiness.
   No renderer calls authority.read/projectControls/getRowId/eligibility/custom
   compilation merely to obtain presentation.

The existing native-before-paired-publication order is unchanged. Source readiness
is distinct from a native-frame transaction. No vendor rollback is claimed.
ManualOrder goes only into the actual existing ControlsInput; no order cache.

Render uses pure accepted/permission metadata and cached genuine committed facts.
P begin/access loss masks frame/presentation/targets immediately on permission
read, not an effect-time grant. Private facade phase distinguishes attempted
unavailable readiness from initial uncommitted; unavailable state is masked.
The raw public hook's null behavior remains compatible.

The semantic commit key uses real accepted C snapshot, origin/mode/context,
exact resource/view/bindings/record refs/page primitives and manualOrder. Private
client complete input count is captured by guarded own-data length at commit,
not by a render-time scan. Equal reallocated envelopes skip native/projection
work. C selection/columns/query/relative-clock snapshot changes refresh at layout
using actual state, never a copied query engine. Same-reference application array
mutation is not a deep-watch protocol.

Owner replacement requires a keyed lifetime. Invalid owner candidates use neutral
external-store readers before any new candidate private data, then disconnect
only old local frame/source/subscription receipts at layout. No render-written
latest-props ref exists. Same-domain abandoned/suspended B never starts private
work; A remains eligible until actual B commit unless genuine permission revokes.

Subscriptions are explicit C/P/F1/R metadata subscriptions after valid commits,
plus facade's accepted-C subscription. Cleanup is local, exact and stale-safe;
it never closes/disposes C/P/R or acquires a resource connection. Mode and exact R
remain pinned by the original frame owner. A changed source domain does not
silently retag it.

## Pure recovery union

`projectDataTableRecovery` consumes only finite metadata and an already-issued
committed presentation. It never scans records, compiles/evaluates a query,
formats content, invokes callbacks or returns raw errors/functions/query copies.

- `uncommitted`, `unavailable`, `idle`, `loading`;
- `initial-error` with allowlisted `unavailable|offline|timeout` and actual bound
  Retry eligibility; access loss is unavailable, not a network retry;
- `records` with finite notice/busy/stale/obsolete/Retry facts;
- `empty` / `updating-empty` with cause `dataset|filtered|unknown|no-record-on-page`
  and finite notice/busy/stale/obsolete/Retry facts.

Remote empty cause is the actual supplied emptyKind, not guessed from zero rows.
Client dataset-zero vs filtered-zero uses authenticated complete input count and
actual native filtered total. A zero-row page with nonzero matching total is
`no-record-on-page`, never invented no-matches/dataset-empty. Retained empty while
updating is distinct; fresh zero replaces previous rows. No reset/Clear-all/default
Export or Retry callback is introduced.

## Authored CODE, not executed assertions

- 16 unit/SSR cases across policy/mode loops, real client paginated/unsliced173,
  actual server complete order, supplied remote empty causes, client dataset/
  filtered/out-of-range causes, retained A records/empty/failure/fresh zero and
  no-snapshot initial error/source-only eligibility.
- Real P1 D.createController application owner fixture, not the old raw-native
  controller constructor. Its one initial certificate checks actual constructor C
  snapshot, exact pending receipt and P candidate. Initial IDs/pending stay owned
  by the app; subsequent retirement performs actual reject/cancel/accept.
- Neutral SSR, D/C/CD/P/proxy/copy/foreign and model issuance/read identity cases.
- Eight browser React cases: Strict/no-loop/private-work-outside-render,
  selection/columns/relative-clock, abandoned B, source-only failure, retained A/
  fresh zero, access/P loss, C/P replacement, independent tables/local cleanup and
  preservation of the application's original single resource connection lease.
- Positive row/computed/header/model/options inference fixtures and nine negative
  lines: record/schema anchoring, no duplicate NativeInput, readonly options/model,
  model brand, source-vs-tool and custom numeric operand. Negative file is excluded
  from light positive fixture compilation.
- Deferred dual/source/emitted runner expects36 removed-negative-line checks,
  using one all-directives-removed program per compiler/mode. Its isolated emission
  includes actual fixture declarations so emitted consumers do not mix source and
  emitted private brands. No installed/root/packed proof follows.

## Actual LIGHT checks and history

Installed TS6 whole React source and own positive fixture noEmit checks pass;
scoped Biome checks20 code/config files; five own MJS syntax checks pass.
Exact final commands/logs and scope result are recorded in `.artifacts/`:

```sh
node node_modules/typescript/bin/tsc -p packages/react/tsconfig.json --pretty false
node node_modules/typescript/bin/tsc -p tests/table-facade/hook/tsconfig.light.json --pretty false
node tests/table-facade/hook/scope.mjs --after
```

Final logs: `package-final-light.log`, `fixtures-final-light.log`,
`biome-final-light.log`, `syntax-light.json`, `scope-final-light.log`.
The first package compile passed before final guard refinement. The first own
fixture compile failed on new-fixture ParseOptions/now, captured nullable model
inference and a throwing getter's return annotation. Corrected positive compile
passes are preserved. Biome's initial non-null warning/formatting history is also
preserved; no old test/assertion was changed or suppressed.

There are **zero executed runtime/React/browser/SSR/negative/dual/emitted/import/
packed/CI cases** in this implementation phase. No independent approval, installs,
root build/shared emission, Git mutation, agents, network, server/browser launch,
vendor patches, `.repo` work or credentials. Root exports and historical dist are
unchanged, not a new source output identity.

## DEFERRED final-phase commands and main handoff

Main next: inspect actual APIs/diff, exact handoff inputs/116-source/1234-input
fences and resource identity; perform its permitted combined light intake, commit,
then deliberately expose the new public facade/model/recovery APIs. Private bridge
helpers stay source-private. Styled shell/adoption remains a later allocation.

Only in the user's final verification phase:

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/table-facade/hook/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/table-facade/hook/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/table-facade/hook/check-imports.mjs
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/table-facade/hook/playwright.config.ts
node tests/table-facade/hook/scope.mjs --after
```

Browser fixture port is6548; its server has not been launched. SSR coverage is
neutral prelayout only, not hydration or full private SSR proof. Packed/real consumer/
output-generation/integrated existing suites and independent review remain separate
main-owned gates. Inspect failures, fix within explicit leases, rerun affected checks
and obtain actual review before any final acceptance/merge.
