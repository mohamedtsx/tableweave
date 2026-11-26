# Private WP-03 coordinator contract

TASK-009 implements the [plan](../planning/wp-03-implementation-plan.md) after
explicit WP-02 acceptance. The maintainer **accepted WP-03 after review session 1
n1–n2 corrections**, not the full table/native/resource API. [TASKS](../../TASKS.md) owns status.
Product behavior remains in [shared rules](../../product/shared-rules.md) and
[operators](../../product/operators.md); [state/query](state-and-query.md) owns
the broader native/integration architecture.

## Exports and initialization

Root `@tableweave/react` remains a client entry. It now exports:

- `defineController`, `createTableState`, `reduceTableState`, `ControllerError`;
- `createTableController`, `replaceTableDefinition`;
- `useTableweaveState`, `useTableweaveQuery`, `useTableweaveSelector`;
- state, command, proposal, controller, updater and definition types.

`/contracts` and `/filters` are unchanged React-free server-safe entries. No new
dependency, peer, subpath or vendor type leak is introduced. Root hooks require
the existing React peer. `defineTable`, `useTableweave`, resources/native table,
styled UI and sortable integration are still unavailable.

```ts
import { createTableController } from '@tableweave/react';
import { createQuery, defineQuerySchema } from '@tableweave/react/contracts';

const schema = defineQuerySchema({
  id: 'synthetic', version: 1,
  fields: { amount: { type: 'number', owner: 'builder', sort: true } },
});
const query = createQuery(schema, { locale: 'en-US', timeZone: 'UTC' });
const clock = 0; // Supply the application's explicit clock/shared SSR context.
const controller = createTableController(
  { schema, selection: true },
  { initial: { query }, now: () => clock },
);
controller.dispatch({
  type: 'builder.commit',
  rule: { id: 'r1', field: 'amount', operator: 'number.gte', value: 0 },
});
```

The definition is JSON-cloned, revalidated and frozen. Selection/details are
opt-in. Optional column metadata contains stable leaf IDs, `hideable`, `utility`
and `reorderGroup`, not native columns/renderers. The future bridge must derive
it from the real definition, not maintain a competing column framework.

Initial input has one query value and optional selection/columns/details groups.
No separate simultaneous default and controlled values exist. `controlled` fixes
the owner of each named group for that controller; duplicate/unknown groups and
controlled groups without `onRequest` are errors. Defaults: empty selection,
definition-order/all-visible columns and null details row ID. Queries are already
schema-specific, but runtime initialization validates them again.
Defaults fill **omitted** initialization properties only. Explicit null groups,
column metadata, order or visibility are invalid, not reset requests. Valid partial
column seeds may omit order or visibility. Commands must supply valid updated
values; direct/updater-returned null fails without changing state, revision,
subscriptions or pending controlled intent.

## Accepted snapshots and pure transitions

`TableState<S>` includes query, selected-ID map, complete column order/visibility,
details row ID, revision, explicit evaluation time and cached filter/request/
definition identities. It contains no records, resource buffer, native Row or
callbacks. All accepted values are deeply readonly/frozen. `getSnapshot` retains
the same reference until a state group or effective query identity changes.

`createTableState(definition, seed, context)` and
`reduceTableState(definition, previous, command, context)` are pure. The reducer
checks the definition fingerprint, preventing a state from being reused with a
different schema or presentation policy. Functional updates receive frozen accepted
values and must be pure. There are no reducer callbacks, network, URL/storage,
clock lookup or backend actions. Query validation uses WP-02, not a parallel engine.

`StateTransition` carries the next state, reason, changed groups and
`queryChanged`/`filterChanged`. A wire/editor change may increment state revision
without changing request identity; it must not cause an unnecessary request.
Independent duplicate rules retain editor IDs while semantic duplicates stay
neutral. No-op commands preserve state/reference/revision and emit no callbacks.

### Command families and reset rules

| Commands | Accepted effect |
| --- | --- |
| `builder.commit/duplicate/negate/remove/join/clear` | Valid applied rules only; Duplicate needs a supplied new ID; Negate uses configured inverse/replacement; Clear keeps join and all independent tools |
| `search.commit`, `tabs.change`, `date.commit`, `query.context/replace` | Complete validated query transition; field ownership cannot be bypassed |
| `sorting.change`, `pagination.change` | Value/functional slice updates, validated through the schema; sort/page-size change resets page 0 |
| `pagination.clamp` | Known page count plus current request identity; bounded index, zero/no-op supported; stale correction rejected |
| `clock.tick` | Explicit relative-boundary reevaluation, no timer or per-render Date.now |
| `selection.change/page/cancel` | Value/functional ID updates, eligible current-page changes, or IDs-only Cancel |
| `columns.visibility/order` | Required/utility visibility and full-order/permutation/partition guards |
| `details.change` | Stable row-ID/null open state, independent of selection/index |

Effective filter change resets page 0 and selection by default. Tab scope changes
also clear selection, even if both tabs have equal predicates; an equivalent-filter
tab change preserves page because filtering did not change. Sort/page/page-size
preserve selection unless a relative filter also advances during that query
transition. Builder Clear preserves search/tab/date/sort/size/presentation/details.
Selection Cancel never touches query or advances its clock.

All query commands compare the newly resolved candidate with the **cached accepted
filter key**, not with an old query resolved again at the new clock. Presentation,
selection and details commands use the accepted evaluation context and never
silently change relative filtering. Applications schedule ticks/committed search
and provide clock/locale/timezone; browser defaults/debounce/hydration are later work.

Selection maps normalize false entries away. IDs are nonempty strings, including
off-page IDs; no all-matching sentinel or fabricated records exist. `selection.page`
requires unique supplied page/eligible IDs, eligible subset membership and matching
query identity. The application supplies truthful eligibility/freshness; this is
not record authorization or a resource-staleness bridge.

Column orders must be complete permutations. Contiguous reorder-group runs and
utility positions cannot be crossed; hidden IDs retain their accepted slots when
visible leaves move. Utilities/required leaves cannot hide. A configured data-leaf
set must retain visible data. Actual native grouped collection/drag behavior is
not proved by these pure guards.

## Controlled transaction protocol

If **any changed group** is controlled, dispatch does not commit any part of the
transition. It returns `{status:'proposed', proposal}` and calls one `onRequest`
with the complete immutable intent/reason/base revision. Accepted reads, request
callbacks and subscriptions remain unchanged, including uncontrolled reset groups.

After dispatch returns, the owner calls `accept(proposal)` or `reject(proposal)`.
There are no partial per-group acknowledgements. Only controlled selection may
explicitly override the proposed clear using `accept(proposal,{selection})`;
the override is validated. An uncontrolled selection override is rejected.

Proposal object identity, pending identity and base revision must all match.
New proposals/accepted revisions invalidate earlier intents. Forged, copied,
cross-controller and already-resolved proposals fail. Invalid commands preserve
the existing pending intent and accepted state; no-op commands do not supersede
it. Before accepting a query proposal, resolve its request identity with the
current injected clock: boundary drift rejects stale intent rather than committing
an obsolete relative query. Pending intent is never an accepted optimistic mirror.

Mutation results discriminate `noop`, `proposed`, `committed` and request-callback
`rejected`. A committed result contains `notificationFailures`, a count only.
Accepted publication happens before observers. `onQueryChange` fires once only
when request identity changes; `onCommit` and each subscription fire once per
accepted transition. A callback failure cannot roll back/hide a commit or prevent
other subscribers from observing it. Request-callback failure commits nothing.
These are synchronous notifications: failure counts cover synchronous throws.
Applications must handle rejections from any asynchronous effects they start;
the controller does not await, fetch, retry or supervise those effects.

Synchronous same-controller mutation from an updater/request/observer is guarded
against reentrancy. Accept/reject after dispatch, or in a later application turn;
do not call accept inside onRequest. Application state updates in callbacks are
allowed, but the controller itself has no per-group controlled React mirror.
Unexpected errors become generic `ControllerError` diagnostics; WP-02 validation
retains safe `ContractError` issues. No exception payloads are logged by default.

## React and lifecycle

Create one stable controller explicitly; hooks do not construct or mirror it.
`useTableweaveState(controller)` subscribes to accepted snapshots;
`useTableweaveQuery(controller)` makes query available before fetching data;
`useTableweaveSelector(controller, selector, equal?)` caches selected values via
React's installed useSyncExternalStore. Default equality is Object.is; pass an
appropriate equality function for object projections. Distinct registrations have
independent unsubscribe functions, including repeated listener functions.
The last committed selected value survives reader recreation (such as an inline
selector on a parent rerender). The current equality function can reuse that value
by reference; changed selector results still recompute. Commit-phase effect
publication updates this baseline, not render-time/speculative reader calls.
Use the snapshot's semantic `queryIdentity` (available through a selector) for
request keys, not query object reference or editable rule IDs; hooks never fetch.

`getServerSnapshot` is the immutable initialization snapshot. Bare React server
rendering is tested from tarballs; real request scoping/Start/Next/hydration still
need their later integration gates. Getters do not read a clock or mutate state.

`replaceTableDefinition(previous,nextDefinition,nextOptions)` validates a new typed
controller and supplied state before disposing the old one. Changed schema
semantics require a different ID/version. No version stamping, silent stale-rule
deletion/migration or implicit state carry-over. Invalid replacement leaves the
old controller usable. Successful replacement defaults selection/details to empty
unless explicitly supplied; old pending intents cannot mutate the new instance.

`dispose` is idempotent, clears pending intent/listeners and rejects later commands/
subscriptions. Existing snapshot getters retain their last immutable values, so
applications must release old handles on scope teardown; disposal is not a claim
to erase previously observed data or implement access revocation. No resource
records or async results are retained by this packet.

## Proof and review limits

Use [README commands](../../README.md#local-foundation-workflow):
`pnpm test:controller`, `pnpm typecheck`, `pnpm pack:check`, `pnpm test:browser` or
`pnpm check`. The React fixture runs separately on port 6008, importing emitted
Tableweave modules and existing pinned vendor dependencies (no Tableweave aliases).
It checks StrictMode accepted reads, atomic controlled acceptance/rejection,
query/selector render isolation, object equality/no-op stability and unmount.

These tests cover pure portions of AC-03/05/08–11/24–26. No G-01–G-05/full AC,
native table/collection, resource races, actual backend authorization, rendered
toolbar/draft/details UI, manual AT, benchmark, framework SSR or release pass is
implied. The controlled protocol is accepted as a producer for WP-04/WP-05;
executing those dependent packets still requires separate authorization.
