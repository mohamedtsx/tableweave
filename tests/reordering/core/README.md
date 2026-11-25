# WP-10 stage1: private pure reorder producer

Candidate delivery under the approved
[stage1 plan](../../../docs/planning/wp-10-implementation-plan.md), not independent
approval, a public export, G-02, or application persistence/authorization proof.
Main owns later exports, the real WP-08 adapter, renderer bindings, navigation
interlock, optional dependencies and integration. No existing producer was changed.

## Exact entry and ownership

`packages/react/src/reordering/index.ts` exports:

- `createRowMoveCoordinator({ instanceId, readCurrent })`;
- `moveVisibleColumn(policies, acceptedColumnState, placement)`;
- `ReorderError`, frozen `reorderLimits`, and own types from `types.ts`.

There are no runtime imports outside these five new modules. The API does not
accept record objects, query objects, a controller, resource, transport or mutation
callback. It never connects a resource, fetches, persists, retries automatically,
sets an accepted order, or writes an optimistic/rollback row model. Only one
pending operation's immutable ID provenance, scalar authority high-water metadata
and safe feedback are retained. Application records remain application-owned.

`RowMoveCoordinator` exposes:

```ts
getSnapshot(): RowMoveState;
subscribe(listener: () => void): () => void;
begin(origin: RowReorderFrame, placement: RowMovePlacement): RowMoveBeginResult;
settle(operation: RowMoveOperation, outcome: RowMoveSettlement): RowMoveEventResult;
acknowledge(operation: RowMoveOperation, ack: RowMoveAcknowledgement): RowMoveEventResult;
reconcile(): RowMoveEventResult;
invalidate(reason: 'context' | 'access' | 'unmount'): void;
dispose(): void;
```

`begin` returns `started` plus the exact operation, `noop`, or `blocked` with
`invalid | unavailable | origin | pending | membership | anchors | eligibility`.
Operations are type-branded and runtime-exact objects. A copied, proxy-wrapped,
foreign or old token cannot settle another operation even if all fields match.
The application supplies a lifetime-unique non-secret instance ID; checked
generation produces `instanceId:generation`. Generation never resets on clear.

Event results are `changed` or `ignored` with a fixed reason. **Changed means
operation state changed**, possibly because current authority invalidated it;
it does not by itself mean persistence succeeded. Inspect pending/feedback.
Malformed configuration/subscriptions/invalidation reasons throw a fixed
`ReorderError`; malformed begin/event arguments return fixed blocked/ignored
codes without raw application errors. Column failures throw `reorder.columns`.

## Committed application port, not invented WP-08 integration

`readCurrent(ids)` must synchronously return one atomic committed
`RowReorderFrame` with:

- `stamp`: nonnegative safe integer `ownerEpoch` and `sourceVersion`; definition,
  scope and semantic query identity; nonnegative safe page index; positive safe
  page size; opaque revision `string | finite number | null`;
- complete unique ordered current-page `pageIds`, no more than `pageSize`;
- explicit wire `baseRevision: string | null`. Numeric revisions are not coerced.

For nonempty targets, the later application adapter must call its genuine current
`ControlsAuthority.require({ type: 'reorder', ids })` and enforce app row eligibility.
Stage1 does not import an unavailable presentation module or recreate its checks.
The synthetic test port is **not** that adapter or a backend authorization test.
Throw a library-created `ReorderError('reorder.eligibility')` for an explicit
eligibility rejection; unknown port failures become unavailable/fail closed.

Empty-ID calls are observation-only (`reconcile`, settlement, acknowledgement).
They must still provide current owner/privacy-validated committed metadata, but
must not require an old moved row to remain eligible or present. They grant no
move permission. This distinction must be preserved when main supplies the actual
WP-08 port: its row `require` rejects empty targets; observation is a separate
read of the authorized committed frame, not a fake empty reorder grant.

Epochs must not be reused across definition, authorization, scope, query/page or
owner transitions, including A/B/A. Source versions advance for authoritative
records/revision/eligibility changes within an epoch. Repeated reads of unchanged
metadata are valid; revision or wire-revision changes need a new version. Reused
epoch tags, rollback versions and changed page IDs under a pending operation's
unchanged origin fail closed. There is deliberately no accepted-order/record mirror
to detect every application mislabelling: **the app port must tag data honestly**.
Stamps are UI fences, never credentials or backend concurrency proof.

`begin` compares all captured origin fields, wire revision and the whole page ID
sequence with the current port. Remove `movedId` first: `afterId` is the immediate
predecessor, `beforeId` its immediate successor; null names the corresponding
boundary. Self/duplicate/off-page/nonadjacent anchors reject; the original gap is
a no-op. Every unique moved/anchor ID is passed to the guard in one frozen array.

## Settlement, acknowledgement and lifetime

- Backend `accepted` (optional string revision metadata) retains pending with
  `phase: awaiting-authority`; it is not authoritative records and does not unlock
  another move. Its revision is not treated as proof or ordered against later data.
- Definitive server `rejected` / `conflict` releases pending, leaving latest app
  rows alone. This must not be used to label an uncertain transport failure.
- `indeterminate` (`unavailable | timeout | cancel-requested`) retains pending and
  exposes fixed `unavailable` feedback. The UI must describe uncertainty and
  reconciliation, not rejection, success or undo. There is no implicit retry.
- Exactly one transport settlement is consumed per token. Subsequent reconciliation
  uses an authoritative acknowledgement, not a contradictory second settlement.
- `acknowledge` requires that exact token, the current matching stamp and a strictly
  newer source version. The application establishes terminal `applied`, `not-applied`
  or `superseded` from authoritative reconciliation. Array resemblance alone is not
  proof. Ack may finish before transport resolves; late settlement is then ignored.
- Explicit commit/update `reconcile()` marks same-origin newer input superseded but
  keeps the lock until terminal resolution. It never renders stored page IDs as rows.
- A new owner epoch detaches old pending/feedback. Explicit `invalidate` clears both,
  revokes the last observed epoch and requires a higher epoch for another begin.
  Unavailable/malformed observation also fails closed this way. The app must publish
  a fresh valid owner epoch after correcting that boundary. Disposal is permanent.

Do not invoke reconciliation or assign the app committed port during render.
An abandoned render must not clear a committed scope. Gesture cancellation before
begin emits nothing. Submitted cancellation cannot undo backend work. Scope/query
changes can still happen externally: invalidate at the app boundary and reconcile
actual backend effects independently. Main must add the later pending-navigation
event interlock; this pure coordinator cannot intercept existing controller/pager
commands or modify `ControlsPresentation.canNavigate`.

Snapshots/owned envelopes are frozen, stable between changes and safe to subscribe
to. Ordinary reentrant mutations are blocked, including notification-time events.
Synchronous invalidation/disposal wins even inside a guard/listener; begin then
returns no submission token. One bad listener cannot stop others. Genuine ordinary
native Promise rejections returned/thrown by callbacks are observed; arbitrary
thenables are never invoked. Proxy-wrapped/cross-realm Promise internals cannot be
universally recovered; do not return asynchronous/proxy values from the sync port.

## Column order and capture budgets

Pass the **original native** `controllerDefinition.columns` policy allowlist and
accepted complete `ColumnState`, not group headers/padding/native carrier fields.
Policies are structural own `ReorderColumnPolicy` values compatible with the
controller's `ColumnPolicy`: `id`, optional `hideable`, `utility`, `reorderGroup`.

The helper follows the actual original controller's contiguous group runs and
splits both sides of every utility. Repeated group names in nonadjacent runs are
not one partition. Anchors are adjacent gaps in the moved partition's **visible**
data sequence; null names that partition boundary. Utilities and hidden targets
cannot move/anchor/cross. Hidden IDs remain at exactly their accepted indices;
the result is an own frozen full permutation. Visibility/row-header IDs are not
rewritten. The helper never dispatches or claims a controlled proposal was accepted.

Safety budgets are 100,000 items/own dictionary keys per container and 1,048,576
UTF-16 string code units per capture budget. Begin shares one string budget across
origin/placement; the fresh port frame has a separate budget. Columns share one
budget across policies/state/placement. Overflow rejects; nothing is truncated.
These are allocation defenses, **not** a new schema page-size/dataset restriction.
Column IDs/groups retain the existing controller's 1..128-character ID grammar.

Inputs are captured through own enumerable data descriptors once; null/plain object
prototypes and ordinary dense arrays are accepted. Accessors, extra/symbol fields,
sparse/extended arrays and malformed/throwing proxy traps reject. No input toJSON,
iterator or property-value getter runs. Owned values are frozen, not caller input.
Transparent Proxies cannot be universally detected in JavaScript; no such claim is
made. The producer cannot authorize access or prove its app-supplied revisions.

## Isolated commands and proof limits

Run from this isolated tree with the explicitly allowed exact primary vendor links.
No install, root build or package dist generation is needed. All emitted output and
caches are under this directory's ignored `.artifacts`, never shared node_modules.

```sh
node node_modules/typescript/bin/tsc -p tests/reordering/core/tsconfig.build.json
node node_modules/typescript/bin/tsc -p tests/reordering/core/tsconfig.json
node node_modules/typescript/bin/tsc -p tests/reordering/core/tsconfig.consumer.json
node node_modules/typescript-5-9/bin/tsc -p tests/reordering/core/tsconfig.build.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/reordering/core/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/reordering/core/tsconfig.consumer.json
node node_modules/vitest/vitest.mjs run --config tests/reordering/core/vitest.config.ts --configLoader runner
node node_modules/@biomejs/biome/bin/biome check packages/react/src/reordering tests/reordering/core
```

The build and declaration consumer use ES2022 with **no Node/DOM/React types**;
test/config checking uses the genuine installed runner's Node/DOM types. Strict,
exact optional and skipLibCheck:false are inherited unchanged. `consumer.ts` tests
positive/narrowed APIs and negative opaque-token, readonly, malformed outcome,
wire revision, asynchronous port and invented persistence-callback cases. One
unit test executes the actual scoped emitted JavaScript.

Column parity tests import the real accepted controller validation without editing
it: 5,040 complete permutations, 12 valid seed states and 108 returned move proposals
checked against its actual hidden-slot/partition validation. These vector counts
are not inflated into the unit-test count. See [worker evidence](EVIDENCE.md).

No real WP-08 adapter, native renderer, dnd package, DOM identity, gesture/focus,
pager interlock, actual persistence, browser/AT, packed root entry, G-02 or release
acceptance follows. Main links these isolated notes and arranges independent review.
