# D2/P4 bound details — provisional source handoff

**Implementation and authored tests, not behavioral or engineering acceptance.**
Main supplied isolated base `76c3823` and the frozen install. This worker made no
Git, install, build, emitted-output, browser/server, network, agent, vendor or
reference operation. TASKS/docs/exports/configuration outside this directory stay
frozen. TASK-017 / FR-05/13/16 and partial AC-16/25 remain bounded prerequisites.
The approved initial Figma appearance does not approve this runtime implementation.

## Intake surface

Exactly six existing production files changed:

- `packages/heroui/src/filters/criteria-commit-core.ts`
- `packages/heroui/src/details/{types.ts,use-details-session.ts,session-identity.ts,details-shell.tsx,identity.ts}`

Exactly four new production files:

- `packages/heroui/src/details/committed-details.ts`
- `packages/heroui/src/data-table/{details-binding.ts,details-provider.tsx,details-trigger.tsx}`

Everything else authored is below this README's directory. Main owns intake,
DataTable/host composition, root export decisions and later verification. No S2,
renderer-port, NativeCollection, selection, Date, Builder, F1/P2 or resource producer
was changed. No active sibling tree/API was treated as an accepted dependency.

Source entrypoints (direct private imports in fixtures, **not an installed API claim**):

```ts
useDetailsAccessory<S, T>(
  table: DataTableModel<S, T>,
  options: DetailsAccessoryOptions<NoInfer<S>, NoInfer<T>>,
): DetailsAccessory<S, T>

// details-provider.tsx
DetailsProvider({ accessory, children, direction?: 'ltr' | 'rtl' })
RecordDetails({ accessory })

// data-table/details-trigger.tsx; distinct from the unchanged legacy trigger
DetailsTrigger({ rowId, label, children?, isDisabled?, className? })
```

`DetailsAccessoryOptions` is the actual `DetailsOptions` without controller or field
arrays, intersected with actual shell options without session/direction. It uses
`expected`, `authority`, `source`, `port.read/retry`, `beforeChange`, `onOutcome`,
`focusFallback`, title/messages and real render/focus slots. No invented dirty-form,
permission-selector, invalidate, backend or draft-storage API was added.
Direction is presentation metadata supplied by the provider, not a form/session key.

No export file changed. **Export audit for main:** the existing details barrel uses
`export type * from './types.js'`; appended declarations are consequently visible
through that existing source type-star. No new runtime entrypoint was added to a
barrel, and no supported/root/installed availability is asserted for these new names.
Historical dist, public generation `fc01`, old package outputs and all old producer
seals remain unchanged. No generation was automatically registered.

## Actual lifecycle and issuance

`createDetailsCommitCore` is the third closed entrypoint. It chooses only the actual
`createDetailsAdapter` and the same unexported `createCore`; there is no second cell,
reset factory, controller, publisher, resource, modal or accepted-target engine.
`DetailsCommitCell/Actor/Lease/Local/Work/Committed` carry the real specialization's
S/T and opaque brands. Tool/renderer signatures, runtime key installation and engine
ordering were not changed. The AST check removes only the two details imports and
third factory before comparing the entire original core.

The constructor first looks up exact P2 model issuance and fixes its genuine D/C
identity boundary, without reading private options. Real commit pins frame owner,
actual CD/P, original genuine source capability, source mode and origin. It tests
`C.getDefinition().details`, never `NativeDefinition.details`. No C/P/R wrapper,
replacement instance, bootstrap or epoch advance exists here. Original source proof
is retained as historical provenance, not an authorization flag or a fresh epoch.

The adapter separates source/domain liveness from display freshness. Current model
metadata updates use the actual core `updateModel` without retiring A's ports;
strict `requireDataTableModel` still denies stale C snapshots for new display work.
That validator already checks its actual committed frame; the non-root frame helper
is not imported as a fabricated root API. A committed foreign/unprovable metadata
update disconnects this binding instead of leaving A displayed beneath B.

Actual config identity changes at L-config retire A, cancel exact owned work and
capture B. Own data descriptors are cached once through `CommitMetadata`, with
checks around reflection and captured callback invocation and original receivers.
Optional malformed/accessor callbacks deny config, not default-allow. No candidate
option object is spread/read during render; source-only capture inspects none of it.
Config identity tokens are inert WeakMap values, not retained candidate prop refs.

Accessory, binding and adopted-session registries are independent exact WeakMaps.
`useBoundDetailsSession` is a real producer from its first inert render and never
calls the raw hook. Its returned getters/methods carry the captured actor, not a
latest-view record/source ref. `requireSession` rejects legacy, copy, proxy, foreign
binding and retired-actor views before alleged fields. `getDetailsAccessoryOwner`
returns D/C/actual-CD/frame-owner/P/original-source/mode/mount provenance, not a grant.
Here owner `mode` is the source mode; session owner mode is separately `adopted`.

Raw `recordDetailsSession` remains fixed `legacy`; there is no application mode
setter. Raw `getDetailsSessionOwner` continues returning only legacy owners. The
separate `getAdoptedDetailsSessionOwner` returns adopted producer provenance. Both
are historical issuance, not currentness/access/backend authorization. Direct
internal-module imports are not a consumer security boundary.

## Gates, records and form continuity

- **Initial source-only/uncommitted:** metadata only; no private config descriptor,
  detail reader, body/header/footer/interior/focusInitial or row-trigger projection.
  No record fetch/connect/subscribe is started by this details producer.
- **Display:** strict genuine current model, its frame/view/tool, actual controls
  owner and original source/domain, then the actual committed app `port.read` and
  current details authority/accepted target. Generation is rechecked around output.
- **Close/retry:** current actor/domain/source and actual target/accepted baseline;
  neither requires a loaded row. Retry uses actual error source and app retry port.
- **Row trigger:** actual controls facts/current displayed row reference, source,
  frame, C snapshot and stable row ID are checked before private label capture and
  immediately before dispatch. No fake select-row intent or new headless intent.
  Selection-disabled and unselectable rows are valid details targets. Off-page,
  unloaded and obsolete rows deny this route. Saved trigger events and ref cleanups
  also carry exact registration tickets; they cannot use/clear replacement tickets.
- **Programmatic open:** retains arbitrary-target policy support. An independently
  opened off-page detail record is not rewritten to a loaded-row-only API.

The private native association is stored at actual layout/config metadata update in
the core-owned local. A returned row must match exact current model/frame/C state,
details target/lifecycle/generation and `row.original === record`. Missing association,
off-page data or a same-ID independently refetched object gives `row: undefined`.
There is no row clone, alternate native boundary, getRowId replay, record substitute
or application-record freeze/clone. Loading/missing/error have undefined record/row;
renderBody still runs for every allowed status. Field arrays use the actual native
visible columns and actual CD/schema utility metadata.

An eligible existing form can wait hidden/inert when strict frame freshness is
pending but its genuine original source/domain and accepted target still hold. The
opaque previous output is retained in the actual purgeable local, with no new private
reader/slot/record/row projection in that waiting branch. Initial source-only has no
output to hold. A fresh projection replaces it without query/model/actor/generation/
width keyed remounts. `contentKey` remains details context/epoch/session/row identity,
not generation, query identity or callback revision. App component type/key and app
draft effects remain app-owned; this cannot preserve state that the app resets.

## Shared policy, purge and focus

`runDetailsRequest` is the sole policy/accepted-transition implementation for both
raw and bound routes. Raw uses its existing refs plus per-call request storage; bound
uses the actual core local map. It uses real `beforeChange` and retained observer,
current checks after sync/async policy and inside the final C updater, actual
`state.details` baseline, exact pending token and unchanged proposal/commit/noop/
reject behavior. The async continuation receives only runtime/opaque token and the
app decision promise; private change/options/observer data live in owned storage.
A port commit/reset makes A's continuation stale, never an invocation of B's ports.
There is no optimistic open/close state mirror or rollback of accepted app state.
Bare app `details.change(null)` remains usable when UI readiness is denied.

Bound source/ports use the actual core committed storage; owned output, native
association, policy/request map/activity, receipt/restorer, waiting-focus/caret,
private heading/content/trigger refs and queued focus ticket use the real local.
React stores opaque liveness/version/lease metadata and a neutral library boundary
ref, not a second private form/source/port ref. C subscriptions clear target-owned
output/activity on actual accepted details changes, not ordinary query/layout updates.
P purge/disconnect clears owned locals, current model/captured-port capsule and exact
work without app callbacks, onOutcome, focus, observers, C commands or fictional
onInvalidate acknowledgement. Cleanup debt/order remains the unchanged shared core.

Accepted/proposed closes stage an exact accepted-null object receipt; focus runs
only after that object is actually accepted and the modal has unmounted. The core
task closes over binding/actor only; the private receipt/DOM pointer remain in its
purgeable local. At delivery it rechecks exact null state, actor/domain, captured
post-close details authority (session and generation, not an assumed +1), connected
non-inert target and surviving external focus. Matching library trigger tickets can
restore their still-displayed node. App restoreFocus/focusFallback can run only for
their still-current actor/receipt, never retagged to B. Actor replacement/access loss
suppresses stale private callbacks and permits only a safe surviving neutral library
boundary. Full table/page unmount focus remains app-owned. Waiting caret tickets and
initial focus also stay core-owned; there is one existing Drawer/NoSwipeDialog/trap.

## Evidence and limits

`source126-before.json` is the byte-for-byte main inventory, SHA256
`4a956137a365746d964c084a161884853650138c36e1aebe6a586d178345b731`.
`preimages/` contains all six original files. Main's executable Git modes were checked
without Git or chmod; actual checkout permissions (mostly `100664`) are separately
protected. `snapshot-first.log` preserves the initial mode-format mismatch; it was
fixed in the snapshot tool before any production edit, not by rebasing a source map.

Protected baseline: **1,052 files**, including **120 other package source files**,
old tests/artifacts/assets/seals, manifests/lockfiles and documentation.

- Protected-file aggregate: `bd619d358218be811e872f6b6c0d46dad71c5ae396350afabb7d4cb1bb435f34`
- Protected-source aggregate: `12121c5ce0821e40e0e57111088030725205ba2e1d1dda436cda29b9cd950d83`

Light checks only:

1. `pnpm exec tsc -p tests/data-table/details-accessory/tsconfig.light.json --pretty false`
   passed (`ts6-positive.log`, empty output/exit 0). This is TS **6.0.3**, noEmit,
   real current root source aliases and direct private new modules, not old dist.
   `.artifacts/compile-inputs.json` pins 132 source/positive inputs, aggregate
   `535b409bafa2215582516b77a12de8aaa0f419e89d07ea8915c41674285274a8`.
   The handoff checker verifies those inputs remain unchanged. `ts6-first.log` and
   `ts6-final.log` are preserved failed attempts (the latter name is historical,
   **not** a passing final check): root-helper/optional-prop/fixture errors, then a
   direction literal widening. No negative or second compiler was executed.
2. Scoped authored-input Biome exits 0. The retained pass reports a stylistic
   optional-chain warning and template-literal suggestions, not a zero-warning
   claim. Earlier Biome failure logs are retained verbatim; rules/config and old
   logs were not weakened or reformatted. Generated maps and preimages are excluded
   from authored formatting. The last check includes later authored JS fixtures.
3. Static AST/import/syntax and scope checks pass; final logs/artifacts are adjacent.
   The whole original core (except details imports/third factory), raw hook outside
   request extraction, raw Interior and raw Trigger are AST-equal to preimages.
   Original normalized core digest:
   `651937a7d042978b455b43a696c09b23203d9e39d330600f8c956cad7d92f562`.
   This is **not** a behavior/cycle/SSR or raw shared-helper equivalence proof.

`.artifacts/implementation-map.json` records exact worker-owned files and production
hashes, excluding itself to avoid recursion. The terminal handoff carries its final
aggregate. Do not regenerate/rebase old D1/S1 maps or old golden/producer seals.

Authored, **not run**: metadata denial; genuine bound/raw SSR; real D.factory C/P/
ApplicationOwner + useDataTable + app DetailsPort browser fixtures; selection-disabled
and unselectable targets; genuine native association/new object/off-page distinction;
saved A/B commands/policy/retry/session ABA; independent generation/epoch counters;
controlled reject/accept; real shared-core stale lease/purge/bare cleanup; actual
Strict/Suspense/foreign-owner source-only denial; arbitrary controlled/uncontrolled
form/draft/node/caret/width/waiting checks; close reasons, removed trigger/new-dialog
focus, app access loss and RTL. Six meaningful NoInfer/schema/record/row/controller
negative cases are authored separately. Existing raw/D1/S1 assertions are untouched.
JS extra cases are authored browser obligations, not part of the positive TS inputs.

No runtime, React, SSR/hydration, browser, negative/dual, cycle, golden, emitted,
packed, CI, independent, manual AT/device/RTL, privacy, performance or full WP-09
approval is claimed. Hiding a UI is not backend authorization. The library cannot
erase app-controlled drafts/effects, React's internals, externally retained values or
app promises; synchronous clearing means its own canonical owned buffers, not a
universal memory-erasure guarantee. Applications must publish real permission/source
transitions; an unannounced app mutation cannot be observed during a no-read wait.
Source/domain loss is terminal to this binding; remount/adoption remains app-owned.

## Final authorized verification phase — deferred commands

From this worktree, sequential browser configs use port **6560**. No server or suite
was started during implementation.

```sh
pnpm exec vitest run --config tests/data-table/details-accessory/vitest.config.mjs
pnpm exec playwright test --config tests/data-table/details-accessory/playwright.config.ts
pnpm exec playwright test --config tests/data-table/details-accessory/playwright.extra.config.mjs
node tests/data-table/details-accessory/check-negatives.mjs typescript
node tests/data-table/details-accessory/check-negatives.mjs typescript-5-9
pnpm exec playwright test --config tests/details/playwright.config.ts
pnpm exec vitest run --config tests/details-session-identity/vitest.config.mjs
pnpm exec playwright test --config tests/details-session-identity/playwright.config.ts
pnpm exec vitest run --config tests/table-renderer-commit/vitest.config.mjs
pnpm exec playwright test --config tests/table-renderer-commit/playwright.config.ts
```

Main then owns the final integrated SSR/hydration/cycle/dual/golden/emitted/packed/
regression matrix, explicit new-generation registration and independent review.
Historical exact-source seals may intentionally not describe the new source: retain
their original evidence, do not auto-rebase expected maps or relabel old outputs.
Additional integration/assistive-technology/privacy cases remain independent gates.
Review the actual source/fixtures and hashes first; these commands are authored
instructions for that later phase, not successful results or permission to run now.
