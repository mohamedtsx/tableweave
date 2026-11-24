# Private WP-08 core controls producer

This module contains read-only facts and explicit event commands, not UI, a table
facade, a query store, a resource buffer or a fetch/cache integration. Main owns
root exports and packed integration. Resource/filter producers are unchanged. The
only coordinator extension is the pure synchronous command-capability guard below.
This module never connects/disconnects a resource or changes server bootstrap.

## Native selection modes

`defineNativeTable({ selection })` accepts omission/false (disabled), true
(backward-compatible multiple), `"multiple"`, or `"single"`. Immutable
`definition.selectionMode` and `nativeView.selectionMode` are false / multiple /
single. The controller capability remains boolean. The existing coordinator's
native `validateState` guard rejects multiple selected IDs in single mode at
initialization, reduction/proposal publication and final override acceptance.

Actual native `getCanMultiSelect()` is false in single mode. Decorated row intents
replace the prior ID, rather than merging it; native setters and direct controller
multi-ID changes reject atomically. Supported `view.selectPage` and native page-all
model methods reject in single/disabled mode, including a one-row page and deselect
all. Generic `controller.dispatch({ type: "selection.page", ... })` also rejects in
single/disabled mode, including empty, one-ID and deselect no-ops, before reduction
or proposal publication. No controller wrapper or alternate accept method exists.

`ControllerOptions.validateCommand?: (command: TableCommand<S>) => void` is an
optional pure synchronous capability constraint. It runs inside the coordinator's
existing reentrancy/error boundary before every dispatch reduction (even no-ops)
and again on the privately retained original command before final controlled
acceptance. It is not called during initialization. The native factory composes
its immutable selection-mode restriction with the application callback, preserving
the application's return value for runtime async/nonvoid rejection. Invalid
callback types (including null) reject with state.ownership. Exceptions and
nonvoid/async outcomes reject safely; promise rejections are observed without
logging application input. Guard failures preserve accepted state, revision,
notifications and earlier pending proposals. State-validation initialization,
candidate/acceptance and no-op invocation timing is unchanged.

Dispatch captures an immutable, controller-owned command envelope before any guard
or reducer sees it. Nested data is copied (including undefined); valid function
updaters keep their references and are neither executed nor frozen by capture.
Accessors, cycles, symbols, sparse/extended arrays and non-data prototypes reject
without invoking getters or freezing caller-owned records. Capture is bounded to
64 nesting levels and 100,000 visited values. The same envelope reaches dispatch
validation, reduction and final acceptance. Native primitive configuration and
callback references are captured once; mutating the original options cannot remove
an installed constraint.

This guard cannot fetch, mutate, replace state or provide backend authorization.
Rejection/Cancel recovery continues to use existing explicit controller commands;
there is no wider authorization-policy or async operation protocol.

## Explicit request association

Server resource keys remain opaque application strings. Begin from the accepted
controller query through the atomic provenance helper (never during render):

```ts
const started = beginControlsRequest(definition, controller, resource, {
  ...context,
  queryKey: appQueryKey,
  requestKey: appRequestKey,
});
if (started) {
  const { request, binding } = started;
  // App owns requestBinding. On accepted success it also owns snapshotBinding.
  // App starts transport using request.query and binding.evaluatedAt/identity.
}
```

Bindings are immutable, opaque, and tied to the exact definition/controller/resource
instances and request token. They include accepted semantic query identity and
evaluation time. The application retains only this provenance association for the
request/snapshot it already owns. `beginControlsRequest` captures the REAL accepted
query, identity and evaluation time BEFORE calling the existing `resource.begin`.
It returns `{ request, binding }` or null, never starts transport, and never acquires
a resource lifetime/buffer. A synchronous resource observer that advances accepted
A to B during begin cannot relabel request A as B.

There is no arbitrary post-hoc bind API. `getControlsRequestBinding(definition,
controller, resource, token)` is lookup-only for EXACT tokens already registered
by the helper; copied, foreign and never-registered tokens return null. Old tokens
can never acquire a newer relative-date evaluation, even on first lookup. Retry
callbacks explicitly supplied to begin are wrapped only to register each actual
retry token's ORIGINAL request provenance before invoking the application port.
The app uses lookup there to retain its retry binding. Retain the prior snapshot
binding until fresh success actually replaces the snapshot. If accepted B advances
before begin(B), association A cannot grant B authority.

## Pure render projection

```ts
const input = {
  native: nativeView,
  expected: expectedResourceContext,
  source: {
    mode: "server",
    resource,             // actual owner, no lifetime acquisition
    view: resourceView,   // current render's resource view
    bindings: { request: requestBinding, snapshot: snapshotBinding },
  },
  manualOrder: true,
};
const facts = projectControls(definition, input);
```

Use the adapter's actual unmasked `getSnapshot()` or `getServerSnapshot()` instance
as `source.view`; copied/projected/foreign views are rejected even if keys, generation
and record references match. This projector applies `projectResourceView` against
`expected` itself. Begin requests in the application's lifecycle, not during render.
Source ports and the supplied view are captured once, then that SAME instance is
authenticated and consumed; accessor changes cannot swap foreign rows after a check.
Before any blocked return can expose accepted IDs/query, privacy checks compare
expected context against BOTH the current unmasked `resource.getSnapshot()` context
and the supplied candidate's context, including permission. A saved initial server
snapshot is never alternate scope/access authority. The actual resource projection
helper still masks resource data; controls additionally mask every selected/loaded/
missing ID, row and requested query on privacy/definition/owner mismatch.
A live current request must have its existing exact-token owner registration;
omitting candidate bindings cannot bypass that check. No new registration is made
by projection.
Actual current/server snapshot identity is checked only after this privacy gate.
Ordinary discarded same-scope views suppress row-targeting actions without hiding
accepted selection/Cancel. Cancel eligibility uses current owner/scope independently
of view freshness, including same-owner access-loss cleanup; it cannot cross scope.
Origin/context masks use one exhaustive neutral-facts builder, not a spread of
foreign presentation facts. Page checked/mixed, activity/staleness/obsolescence and
all operation/recovery/navigation capabilities are neutral. Only immutable origin
selection mode/configured page support survives. Projection shares this builder;
it whitelists same-owner accepted facts or scoped cleanup capability only after
the existing privacy/ownership checks. New required fact fields need explicit
neutral defaults, so adding a field cannot silently copy foreign activity.
Resource UI must route row/page
events through the authority helper rather than raw native row toggle methods:
the native producer intentionally has no resource-freshness ownership.

Client input instead supplies `source: { mode: "client", context, records }`, where
records are the complete local native input and context tags their application scope.
No server metadata or request binding is invented for local input. Render projection
uses current view models, not stable native committed getters. It validates actual
native frame input/mode, immutable record references/order, displayed page metadata,
schema/query semantics and binding provenance. Wrong combinations suppress rows
and displayed metadata instead of claiming freshness. Context privacy masking calls
the actual `projectResourceView`; mismatched private IDs/query facts are suppressed
too. IDs-only Cancel remains usable only for the same origin owner/scope.

`selectedIds` counts all compatible accepted IDs. `loadedSelected` contains only real
`{id, record}` entries (complete client input or actual server snapshot records),
and `missingSelectedIds` are never fabricated records. `displayed` is actual query,
accepted evaluation time, page/size, pageInfo, range and token provenance, or null
when no valid snapshot is available. Missing metadata is not a zero total. Known
fresh zero is truthful 0..0; empty out-of-range or unsafe numeric ranges are null.

`obsolete` compares effective semantic identities, not query object/editor IDs.
`resourceObsolete` separately preserves opaque-resource policy. Resource canSelect /
canNavigate / canReorder flags are never weakened: a same-query refresh may permit
selection while blocking navigation/reorder. Reorder additionally requires explicit
manual order, multiple current-page rows, no effective filters and no sorting.

## Committed event authority

The application alone publishes the current input into a commit-phase port. Do not
assign speculative input during render. Creating this helper only captures origin
tags and ports; it reads no lifetime and publishes no state:

```ts
const actions = createControlsAuthority({
  definition,
  controller,
  mode: "server", resource, // mode client forbids a resource port
  queryIdentity: nativeView.state.queryIdentity,
  context: expectedResourceContext,
  readCommitted: () => committed.current,
});
```

Each event reads controller.getSnapshot(), resource.getSnapshot() and the latest
committed native input. Captured callbacks retain their origin scope/query/owner
guards but never stale booleans or records. Changed metadata/eligibility and accepted
B-before-begin(B) therefore revoke old actions. `read()` returns current facts;
`require(intent)` checks row/page/navigation/reorder/retry authority. Reorder intents
must supply all target/anchor IDs for current-page membership checking.

Query/layout consumers additionally use `require({ type: "sort" })` and
`require({ type: "columns" })`. These recheck the current same origin controller,
registered definition, expected AND actual scope/access, and exact resource owner
from the committed input port. A live resource request must retain its existing
controller/resource owner association; an empty/boot resource needs no request.
They deliberately ignore the captured OLD query identity, snapshot/row freshness,
resource readiness and canNavigate. Same-owner loading, refresh and offline failure
therefore do not lock criteria or column layout. Unsafe invalidation/access or
foreign owners deny even with empty rows. Unsupported ports fail with generic
ControlsError, never raw application errors.

The internal read frame keeps this domain decision separate from the returned
row presentation: require(sort/columns) can succeed while read() is query-blocked
for old captured row callbacks. It does not grant row/page/reorder/retry actions,
mutate state, publish a proposal or introduce public canSort/canColumns flags.
Expected/actual context values and intent fields are captured once per read so a
getter cannot change the permission/discriminant between checking and consumption.
Existing Cancel remains query/freshness independent for same-owner cleanup.

Use the guard synchronously, then the existing source-owned event:

```ts
actions.require({ type: "sort" });
controller.dispatch({ type: "sorting.change", update: nextSorting });
actions.require({ type: "columns" });
controller.dispatch({ type: "columns.visibility", update: nextVisibility });
```

The existing controller/native definition still validates each actual field and
visibility restriction. This is not generic dispatch, backend authorization or an
authorization promise after await. No new sorting or chooser methods are added.

Explicit commands are selectRow, selectPage, cancelSelection, setPageIndex,
setPageSize, nextPage, previousPage and retry. They delegate to the existing owners,
return proposal/commit/no-op results, and never optimistically update UI. Cancel
changes selected IDs only and ignores query freshness/row availability, but checks
the latest committed controller/definition/expected scope AND actual source scope /
resource owner. Same-owner access-loss cleanup remains allowed; an old-scope Cancel
cannot clear new-scope selections even if expected tags lag. Known/unknown navigation never guesses a next page from
record count. No automatic shrink correction or correction-attempt state is added;
later pager composition owns a bounded, event-guarded pagination.clamp chain.

These checks are synchronous UI affordances, not backend authorization or promises
after an await. Applications must recheck asynchronous operations and use their
resource invalidation port to clear selection/details on scope/access loss.

## Source checks

Use isolated `tests/controls/core` configs: strict package/fixture noEmit under TS6
and TS5.9, core Vitest, existing native regression Vitest, and source Chromium native
regressions on port6437. Caches/results remain in this worktree's `.artifacts`.
No UI, emitted/packed, framework SSR, manual AT, performance or full gate approval
follows from this producer's checks.

```sh
pnpm exec tsc -p packages/react/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/tsconfig.json --noEmit
pnpm exec vitest run --config tests/controls/core/vitest.config.ts
pnpm exec vitest run --config tests/controls/core/native-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/core/controller-regressions.vitest.config.ts
pnpm exec playwright test --config tests/controls/core/native.playwright.config.ts
```
