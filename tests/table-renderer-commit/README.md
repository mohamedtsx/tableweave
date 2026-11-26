# S1 renderer committed ports — implementation-ready PROVISIONAL

TASK-017 / FR-01/04/13/16, AC-16/25 prerequisite, activated ate8529b0.
This is the shared core/config-capture stage, **not** a DataTable component or
runtime/readiness/privacy/continuity/tool/full-WP09/packed/independent approval.
Main owns docs/TASKS/REVIEW, Git, exports/intake. Date remains isolated against
the unchanged F3 tool API; no changing Date worktree was compiled or edited.

## Exact lease and baseline

Only existing `packages/heroui/src/filters/criteria-commit.tsx` changes. New sources:
`filters/criteria-commit-core.ts`, `table/types.ts`, `table/renderer-commit.ts`.
Everything else, including current Search/Tabs host, headless P2/F1, F3a, Date,
selection, NativeCollection, details, locales, styles, exports/config/package/lock
and old tests/seals, remains frozen.

Before producer edits, `scope.mjs --before` matched all122 actual source entries
(CSS included) and canonical aggregate
`0def42f9748a3762d2a4399d3930a8b0afd7b1ff68a86d0ee3473a3b5437e656`.
Original F3 SHA is
`a135a5d1ef6c773bc21fc2233338a695818db8767018b797d0e3f0d9337fb3ff`.
Its exact preimage and original122 map are preserved in `.artifacts/`; the other121
expected source hashes are derived from that map, never recaptured after edits.
The separate original-input fence captures1295 existing test/config/artifact files,
including historical maps/logs/seals, excluding node_modules/dist trees. Historical
F3/bridge/P2/output maps are not resigned to accept this intentional delta.

After scope expects125 sources, exactly122 + three additions. Final worker inputs,
aggregate and121-source/1295-input comparisons are in `.artifacts/handoff.json`.
No generated-source/output identity or installed-dist update is registered.

## One core, unchanged tool specialization

`criteria-commit-core.ts` is the sole lease/actor/participant/purge/debt/local/work/
snapshot/notification/candidate-operation engine. `createCore` is unexported. Its
two source-private entrypoints choose only fixed library tool/renderer adapters;
there is no factory accepting an app policy/check/reset/registration callback.
The function-only adapter import cycles are explicit and need final runtime proof;
positive compilation is not cycle/runtime verification.

`createCriteriaCommitCell` remains the four-kind tool specialization. Existing
CriteriaActor/MountLease/Committed/LocalCell/WorkHandle/CommitSnapshot/CommitCell,
kind union, constructor signature and error code/message remain unchanged. Tool
runtime own keys/snapshot keys do not gain renderer metadata/update methods.
Actual F3a capture is still the frozen producer. Expected context, C/actual CD,
same-origin stamp/mode checks, real P-issued participant, original capture/register
ordering, post-notify fences, stale leases, timers and cleanup debt retain the
original tool route. No fake builder kind, duplicate engine or app reset in purge.

The renderer specialization registers its real participant **before** private
port traversal. That closed ordering policy does not move the existing tool
registration point. Both paths share the exact same lifecycle implementation.
Purge clears internal ports/locals/model reference and invalidates owned work,
without app callbacks/listeners/focus. Only the actual publisher's cleanup phase
acknowledges cancellation debt; void release is not successful cleanup proof.

Opaque token/aggregate casts materialize library-issued lease/actor/local/work
brands and the renderer's installed metadata method. Validated port-envelope casts
label explicitly checked own fields. No consumer rows/schema are coerced to
object/any to make callbacks fit. Library adapters/capture plumbing are not root
exports, public producers or caller registration setters.

## Actual renderer API

```ts
createTableRendererCell<S,T>(initialModel: DataTableModel<S,T>)
  : TableRendererCell<S,T>
```

Constructor calls exact `getDataTableModelOwner` before model payload. A genuine
uncommitted/source-only model can establish inert D/C provenance. Unknown/copy/
proxy models deny before getters; no source/P/R acquisition or candidate capture.

Cell methods:

- `connect()` → invariant `TableRendererLease<S,T>`;
- `commit(lease, actualModel, opaqueConfig)` → `TableRendererActor<S,T>`;
- `updateModel(lease, actualModel)` → void;
- `require(actor)` → readonly `{actor,ports,origin,model,metadata}`;
- `disconnect(lease)`, `subscribe(listener)`, `getSnapshot()`;
- F3-equivalent finite `createLocal` roles and `timeout`/`animationFrame`/
  `cancelWork`, with renderer-distinct opaque tokens.

Commit/update require actual P2 `requireDataTableModel`, genuine source owner/cap,
current source permission and exact D/C/actual-CD/origin association. The first
successful port publication pins D/C/CD/P/frame owner/mode. Metadata updates require
the same origin including epoch, never retag a saved actor after P reset/P2 change.
A real completed publisher transition can purge/clean the old actor and admit a
new explicit config actor in that same pinned lifetime; old actors stay retired.

`updateModel` has no config input, traverses no candidate app ports, does not release
the participant, cancel work, clear drafts or retire actor A. It replaces only the
genuine model reference. Snapshot `version` (actor/local revision) stays unchanged;
`modelVersion` changes separately. `require(A)` and A's wrappers freshly use model B,
not saved stale model A. P2's strict `requireDataTableModel(A,D)` is not weakened.
An invalid metadata update denies without erasing an otherwise eligible A.

`commit` captures a real actual candidate under an operation fence. Old A remains
the committed revision until the new port publication; a malformed/reentrant
**actual** commit follows original F3 fail-closed purge/debt behavior. After successful
B publication, saved A functions/actors deny rather than selecting latest B ports.
Local values survive eligible same-domain config replacement and metadata refresh.
Stale disconnect cannot clear a newer mount lease. No new C/P/epoch or resource
connection/request/transport/storage/URL work occurs.

Snapshots/actor presence are metadata, not readiness or permission. During a same-
domain C/frame/source refresh the old model may be strictly stale; callbacks remain
inert until a fresh genuine model is provided. The owned cells are not purged merely
for that waiting case. Source/P/context loss immediately denies old private calls.
An R-only change need not emit an S1 version until model update/P cleanup: later
surfaces must also observe actual P2/source metadata, never trust cached actor flags.
No React subtree/form removal or physical memory-erasure claim is made here.

## Exact typed config/capture and callback roles

`TableRendererConfig<S,T>` uses the actual NativeCollection presentation signatures
in an optional outer `collection` branch: required `label`, `rowHeaderColumnId`,
`rowTextValue(NativeRow<T>)`, `columnTextValue(NativeColumn<T>)`,
`cellTextValue(NativeCell<T>)`, optional selection-column ID. Optional outer branch
supports initial state-only configuration without invented row callbacks.
There is no renderCell/header prop: native definitions own their actual renderers.

Other ports: renderToolbar/current model/frame/view/presentation/defaultContent;
renderState/current model/finite recovery/source metadata; `onRetry():void|Promise<void>`;
actual `SelectionAction<S,T>[]`, existing getRestoreFocusTarget/onError types,
actual pagination number formatter and actual column labels/observer fields.
No actual collection, selection, pagination, details or DataTable component changes.

All consumed own fields share descriptor/alias caches per capture. Accessors and
inherited malformed fields deny without invoking getters; required/complete message
fields are checked. Capture invokes no app callbacks and does not freeze/copy app
callback objects, source data, child configs or ReactNodes. Only library-owned
allowlisted envelopes/arrays are frozen.

| Callback role | Fresh proof before/after private entry |
| --- | --- |
| renderState/state strings | Actual current source-safe model/cap; no uncommitted/unavailable custom entry |
| onRetry | Source role plus actual remote canRetry/recovery eligibility; displayed Retry additionally calls genuine controls.require(retry), never controls.retry |
| collection text/messages, renderToolbar, other display messages/formatter/focus/error | Actual display model + genuine tool/source/controls owner |
| selection onAction | Display proof plus fresh actual authority.read/selectionActionContext, captured disabled/pending denial |
| column observer | Display/tool proof plus actual columns intent |

renderState arguments are rebuilt from the fresh committed model. renderToolbar
receives that fresh model and the caller's guarded own-data **opaque defaultContent**
reference; no child callbacks are enclosed or materialized. Selection onAction gets
the actual fresh typed SelectionActionContext, not a caller's alleged context/IDs.
Model identity is rechecked after context/reflection and before invoking the app.

Root/collection/action/column callbacks retain their original captured member
receivers. Message functions preserve original captured dictionary receivers for
direct calls and the actual later component-created merged dictionary for merged
calls. Locale and explicit per-port overrides are merged only after capture; overrides
win. No hardcoded locale or table-state default text is shipped.

Render/formatter callbacks preserve original thrown errors/Suspense values only if
post-permission checks pass, without probing a thrown `.then`. State/render ReactNode
subtrees and promise children are not recursively wrapped or owned at this stage.
Allowed app event failures/rejections can reach the existing app error observer while
the same actor/model remains current. Library gate/introspection failures are fixed
`TableRendererCommitError`, code `table.renderer.unavailable`, with no raw cause/data.

Void/action ports check pre-entry, synchronous exit and ordinary current-realm native
Promise completion. They retain actor A and model-at-entry, never a latest actor or
new model's permissions after await. Unsupported object/thenable/subclass/cross-realm/
proxied promise results deny; arbitrary `.then` getters are not invoked. Ordinary
primitive void values are ignored. Already-run effects are not rolled back; callbacks
that revoke before their returned Promise can be safely observed remain app-owned
rejection/effect responsibilities. No global suppression or universal async ack.

## Locale and opaque child ownership

`DataTableMessages extends TableweaveMessages` adds exactly the14 state string keys:
uncommitted/unavailable/idle/loading/initialError/offline/timeout/updating/updateFailed/
emptyDataset/noMatches/unknownEmpty/noRecordOnPage/retry. `DataTableLocale` replaces
only messages; existing locale/direction/builtinOperatorLabels are retained in types.
Existing11-port locale modules are untouched.

Captured renderer output separates owned collection/sorting/column/selection/pager/
state dictionaries from **opaque** builder/search/tabs/date/dateEditor/details
defaults and builtin labels. Renderer-owned message functions are guarded; child
dictionary functions are not recursively captured/wrapped under the parent actor.
No false claim that opaque child dictionary internals have already been validated.

`ports.toolConfigs` contains readonly builder/search/tabs/date reference slots,
captured at parent commit from `config.tools`. Each child value remains the exact
opaque original object. Parent B does not retire independently committed child A,
release its participant or clear its local edits. These references/defaults are
not child-ready props/capabilities; only the child owns its own L-config capture.

## Concrete later seams — not implemented by S1

The report predates F4 intake. Actual current host is
`toolbar/criteria-tool-host.tsx`: `captureCriteriaCandidate`,
`createCriteriaToolbarStore(kind,createLocal)` with
`commit(input,candidate?)` / `read` / `require`, and `CriteriaToolHost`. There is no
`createCriteriaToolbarHost` or report-proposed alternate host in this tree.

1. Allocate a closed opaque-child/config/default decoder **inside the child's actual
   F3 commit operation**, with separate genuine model/tool metadata and explicit own
   library metadata fields (actual C, expected context, real reset stamp, target).
   Do not spread/read child private fields in DataTable render or wrap callbacks
   under the renderer actor. Preserve independent child config revision/model updates.
   Current omission means legacy, so an initial adopted-unready child must not be
   faked as omission/legacy or given a fabricated tool grant. Date's actual later
   handoff and Builder adoption must be reconciled separately, not guessed here.
2. Allocate SelectionToolbar's committed-event actor seam. Its current saved handler
   can select latest actions after checking only authority identity. It must compare
   the handler's captured actor with its actual committed config **before** choosing
   an action/Cancel/error/focus target. Guarded action functions alone do not fix
   old handler A selecting latest B. Do not replace that producer/focus engine.
3. Allocate actual NativeCollection/FlexRender/header/cell entry and event guards.
   S1 display gates validate the current genuine model/tool domain, not individual
   row/column/cell argument association. Native callbacks remain native-definition
   owned; do not invent extra props or a static row engine. Actual select/navigation/
   sort/columns intents stay in their producer event routes.
4. Later state/render React subtree ownership, stable-model waiting versus real
   domain removal, dictionary defaults/exports, details async/terminal-focus and
   actual DataTable composition need explicit paths. No key by query/model/actor
   merely to hide continuity failures. Existing returned app-node internals/coercion/
   arbitrary globals and app effect cleanup are not universally intercepted.

## Authored evidence, actual LIGHT results and deferred commands

Authored, **not executed**: four own unit/neutral-SSR/golden cases; original F3
exported-declaration/preimage transcript and runtime own-key comparison; unchanged
raw cell/work/SSR suites included in the final runner; nine real browser cases for
actual hook-issued models, A/B capture/metadata continuity, source-only Retry/row
denial, original receivers, opaque children, independent tool actor, async completion,
invalid getter purge, native owned timer/P reentry and same-C/CD/context P1/P2.
The browser fixture uses actual P1 factory C/P/application certificates, P2 hook,
native frames, real resources/bindings/source caps—no permitting model/view/gate mocks.
The golden preimage is byte-preserved; its own namespace dependency shim resolves
only unchanged actual F3a capture, not a second production engine.

Positive inference and10 negative type lines cover actual row/cell/action record T,
readonly/config/opaque-child slots, wrong S/T models, distinct source/tool/renderer
tokens and no invented renderCell prop. Negative directives are excluded from the
light positive program. The authored final source/emitted × TS6/5.9 matrix expects40
removed-negative-line checks, one all-removed program per mode/compiler, not per-line
recompilation. Static import/boundary and function-only cycle runtime checks are
deferred; no installed/packed proof follows from private source/emission fixtures.

Actual installed TS6 own positive source program and unchanged existing F3 positive
program pass. Both resolve the **actual root source alias**, not historical installed
dist. Scoped Biome checks17 source/config files and five own MJS syntax checks pass.
Final logs: `own-final-light-02.log`, `f3-final-light-02.log`,
`biome-final-light-02.log`, `syntax-light.json`, `scope-final-light.log`.

All failed logs are preserved: first new-source compile issues were registration
closure inference, opaque aggregate declarations and unused imports; later errors
were new test noop-result/nullable token annotations and a never-return alias's
control-flow narrowing after lint corrections. They did not require changing any
protected existing fixture/API. Initial Biome void-return failures are preserved too.

```sh
node node_modules/typescript/bin/tsc -p tests/table-renderer-commit/tsconfig.json --pretty false
node node_modules/typescript/bin/tsc -p tests/criteria-commit/tsconfig.json --pretty false
node tests/table-renderer-commit/scope.mjs --after
```

Zero runtime/React/browser/SSR/golden/negative/dual/emitted/import/packed/CI assertions
have run here. No agents, Git, installs, shared builds/emits, browser/server launch,
network, vendor/.repo/credential work or root exports. No Date tree compile.

Main next: inspect actual core/wrapper/model-update/capture APIs and exact handoff/
121-source/1295-input fences, perform its light intake and commit, then allocate
real host/selection/collection/state seams. Private core/adapters stay out of root/
public exports; their internal module exports are library plumbing, not app APIs.

Only in the user's final verification phase:

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/table-renderer-commit/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/table-renderer-commit/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/table-renderer-commit/check-boundary.mjs
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/table-renderer-commit/playwright.config.ts
node tests/table-renderer-commit/scope.mjs --after
```

Browser port6550 is authored only, not launched. Run failures/fixes/affected reruns
and independent reviews in that final phase; neutral SSR, positive types or a mock
never substitute for actual runtime/hydration/privacy/continuity/accessibility proof.
