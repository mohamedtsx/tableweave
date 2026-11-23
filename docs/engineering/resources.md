# Resource identity, recovery and retained results

Source: HLD §8; ADR-06. Implements [recovery](../../product/recovery.md) without
becoming a fetch cache. WP-05 now supplies the private producer below; its review/
acceptance state belongs to TASKS. The HLD envelope remains illustrative rather
than an importable type or complete table facade.

## Implemented private producer

Root exports `createResourceAdapter<T,Q>`, `useTableweaveResource` and
`projectResourceView`, with `ResourceContext`, `ResourceRequest`, `ResourceSuccess`,
`ResourceSnapshot`, `ResourceView`, `PageInfo`, invalidation/error and adapter types.
Exact use/constraints and executable fixtures are in the
[WP-05 plan](../planning/wp-05-implementation-plan.md) and
[integration notes](../../tests/resource/README.md).

The context tags definition/scope/access. Application `begin` supplies an already
accepted wire query, query/request keys and optional Retry port; each call creates
an opaque identity-checked generation token. `succeed` only promotes fresh data
for the exact current token; placeholders, prior generations and other contexts
cannot enter the single last-fresh buffer. `fail` maps allowlisted error codes to
fixed safe messages without inspecting arbitrary error payloads. `retry` creates
a new current generation and invokes the application port; it does not fetch.

The view separates requested query from the actual displayed snapshot/page and
derives busy/stale/obsolete/action guards. New selection/reorder cannot target
obsolete-query rows; recovery/selection Cancel remain separate. Known totals and
unknown next-page flags are application facts, never inferred from page length.
Fresh empty results replace old rows permanently. Queries/array containers/
metadata are immutable copies; row values remain application-owned immutable
references, not deep-cloned/frozen business objects.

`setContext`, clear, access loss and disposal invalidate tokens before invoking
the synchronous application port for clearing selection/details/option labels/
transient operations. The adapter stores none of those application states and
cannot authorize access. Callback exceptions/thenables are safely rejected and
block new requests until an explicit successful clear. Request-side access loss
is terminal until explicit context restoration; stale allowed hook props and
late responses cannot revive it.

One hook owns one adapter lifetime. It purely suppresses incompatible private
data during render, commits context in layout, and connects/disconnects lifetime
in passive effects. Suspense hide/reveal is not real unmount and must not erase
same-scope rows or cancel the app's still-mounted request effect. Real unmount/
StrictMode passive cleanup clears before the same component's later application
passive cleanup; this is not a promise to clear before arbitrary layout callbacks.
Applications explicitly invalidate authorization/scope, including while hidden.
The stable server snapshot is initially empty, not loader dehydration or WP-06
framework SSR proof. No automatic storage, fetch cache or Query dependency.

## Proposed envelope

```ts
type Snapshot<T> = {
  scopeKey: string; queryKey: string;
  query: TableQueryV1;
  records: readonly T[]; page: PageInfo;
  emptyKind: 'dataset' | 'filtered' | 'unknown';
  receivedAt: string;
};

type Resource<T> = { scopeKey: string; requestKey: string } & (
  | { kind: 'pending'; previous?: Snapshot<T> }
  | { kind: 'ready'; snapshot: Snapshot<T>; refreshing: boolean }
  | { kind: 'failure'; error: { message: string };
      previous?: Snapshot<T>; retry?: () => void | Promise<unknown> }
);
```

`TableQueryV1` belongs to [state/query](state-and-query.md); `PageInfo` to
[public API](public-api.md). `receivedAt` records provenance, not cache identity.
The snapshot carries the actual displayed page/query, not the newly requested
one. Client mode derives empty cause from complete input/local row model; server
mode uses application context, including `unknown`.

## View precedence and safe affordances

| Condition | View | Guard/recovery |
| --- | --- | --- |
| Pending, no snapshot | Column-aligned initial skeleton | No false empty, new selection or reorder target |
| Failure, no snapshot | Initial error body | Public-safe message; Retry only if supplied |
| Pending with previous | Previous rows or neutral updating-empty view | Explicit previous-results busy notice; no new selection/reorder on obsolete query |
| Failure with previous | Retained results + non-blocking warning | Retry **current requested query**; preserve Cancel/recovery |
| Ready with records | Rows, optional same-query background busy | No automatic state reset; action context includes busy/stale |
| Ready, zero, dataset | No records yet | Optional supplied Create/Import only |
| Ready, zero, filtered | No matches | Relevant tool-specific recovery only |
| Ready, zero, unknown | No records available for this view | No invented cause |
| Invalid draft/options unavailable | Local editor/picker feedback | Do not replace table/discard valid rules |

## Acceptance and presentation buffer

Keep at most the last **accepted fresh presented snapshot** for the same table
definition and authorization scope. This is a bounded UI buffer, not a parallel
Query cache. Update it on every accepted success, **including fresh empty
results**. Never keep old rows over a fresh successful empty response.

Never promote placeholder data, a late obsolete-key response or other-scope data
into the buffer. Clear on unmount, scope/definition transition or authorization
change; no storage persistence. Access revocation also clears selected IDs,
details, option labels and transient operations immediately. Permission failure
is not ordinary “keep stale rows” recovery.

When query B is requested but snapshot A is shown, show A's actual page/range
plus “Updating/Update failed; previous records shown.” Do not put B's range over
A's rows. Disable navigation depending on unknown B metadata. Existing selected
IDs may remain by policy, but new selection/reorder must not target obsolete
rows. Recovery/selection Cancel must stay reachable.

Query `keepPreviousData` can disappear from the observer on changed-key failure;
it alone does not satisfy refresh-error retention. The adapter must preserve the
last accepted snapshot separately, guarded by request generation/scope/key even
when abort is unavailable. Safe errors contain no raw record/query/stack payloads.

## Required race fixtures

Ready A → request B → fail B → Retry B → accepted empty B; old A never returns.
Also B before late A; uncancellable late response; empty prior snapshot; same-key
refetch failure; scope switch/access loss while pending; stale page metadata;
unmount/remount; option-label recovery. G-03 owns executable proof.
