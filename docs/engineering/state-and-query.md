# State, query and TanStack coordination

Source: HLD §§5–6; ADR-03–ADR-05. Product semantics are owned by
[shared rules](../../product/shared-rules.md) and [operators](../../product/operators.md).

## One owner per state group

| Group | Canonical owner | Boundaries |
| --- | --- | --- |
| Effective query | Controller or app-controlled query | Builder, committed search, tab/date, sort/page, locale/timezone |
| Selection | Controller or controlled stable-ID map | Independent of loaded objects; semantic filter reset policy |
| Column presentation | Controller or controlled visibility/full order | Hidden IDs, utilities and group partitions preserved |
| Details | Controller or controlled ID/open group | Not selection/index; optional off-page snapshot/resource |
| Draft edits | Local editor | Not accepted query until valid commit |
| Resource/error/freshness | Application adapter | Library never fetches/persists |
| Drag/option UI | Local ephemeral adapter state | No second authoritative query or order store |

Use a small pure transition reducer and `useSyncExternalStore`-compatible
subscription transport. Native controlled projections are derived views, not
independently writable copies. Bridge each managed slice through its documented
v9 callback. No removed native global `onStateChange` or v8 `useReactTable`
assumptions. Native store reads alone do not subscribe React; verify v9 selectors/
Subscribe leaf behavior in G-01.

The query is one **transactional control group**: filter/sort + page reset must
not emit intermediate server requests. Selection, columns and details may be
controlled separately. A controlled owner receives a complete proposed next
group plus reason/revision; expose accepted state only, not a hidden optimistic
mirror. Advanced atom ownership requires an explicit adapter preserving atomicity.
Controlled owner rejection must leave accepted state unchanged; define/test
coordination across controlled groups rather than firing partial side effects.

The [accepted private WP-03 producer](wp-03-controller.md) realizes the pure coordinator
and React subscription portion: one complete proposal waits whenever any changed
group is controlled, then accepts/rejects atomically. This is an implemented
engineering disposition accepted by the maintainer for WP-03, not native/G-01 proof.

## Transition contract

Validate capability/draft → compute one next snapshot → apply reset policies →
commit accepted state → project native slices/publish one query/update subscribers.
No reducer effects. Emit query/selection policy callbacks once per accepted
transaction. No-op semantic changes do not reset state or fetch needlessly.

| Event | Query/page | Selection | Preserve |
| --- | --- | --- | --- |
| Builder commit/remove/negate/All-Any | Recompute; page index 0 only for changed semantics | Clear on effective filter change | Other tools, sort, size, columns |
| Builder Clear | Rules empty; join retained; page 0 if changed | Filter-change policy | All other criteria/presentation |
| Search commit/tab/date | Valid accepted query; page 0 for effective transition | Clear on changed filtering/tab scope | Independent criteria/presentation |
| Sort | Commit; page 0 | Preserve IDs | Filters/columns |
| Page/page-size | Validate/clamp; size change page 0 | Preserve IDs | Filters/sort/columns |
| Selection Cancel/final deselect | No query change | Clear only IDs | Entire query/presentation |
| Visibility/order | No query change | Preserve | Capabilities, rules, identity |
| Same-query refresh | No user-state reset | Preserve unless authoritative reconciliation | Query/presentation |

Use semantic filter keys, not rule/draft IDs or object references, for change
detection. Normalize equivalent built-ins without losing separately editable UI
IDs. Each table has its own controller/IDs unless intentionally controlled together.

## Proposed versioned wire envelope

The [private WP-02 implementation](wp-02-contracts.md) now realizes wire version 1
with narrower date variants and inferred field/operator/value types. The sketch
below remains an overview; executable producer contracts and their normalization
choices are owned there. WP-03 implements the pure controller portion above;
native coordination remains unimplemented.

```ts
type JsonValue = null | boolean | number | string
  | JsonValue[] | { [key: string]: JsonValue };

type WireRule = {
  id: string; field: string; operator: string; value?: JsonValue;
};

type TableQueryV1 = {
  version: 1; schemaId: string; schemaVersion: number;
  builder: { join: 'and' | 'or'; rules: readonly WireRule[] };
  search: string; tabId: string | null; date: JsonValue | null;
  sorting: readonly { id: string; desc: boolean }[];
  pagination: { pageIndex: number; pageSize: number };
  locale: string; timeZone: string;
};
```

This broad transport sketch is **not** permission to accept arbitrary IDs/values.
Public helpers derive narrower schema-specific unions. Runtime validators enforce
schema/version, ownership, allowed fields/operators, cardinality, finite values,
tabs, sorting and limits. Definitions/renderers never cross the wire. Transport
validation is separate from application authorization.

## Composite filtering in the native pipeline

Compile `builder AND search AND tab AND date`. Only builder uses flat All/Any;
search uses OR across configured fields. Empty builder is neutral. Resolve tab
IDs against schema-owned predicates.

Do **not** map separate builder rules directly onto AND-only native column
filters: it breaks cross-field Any and same-field multiple rules. HLD chooses one
compiled global predicate in TanStack's native filtered-row stage, evaluated once
per row through a reserved hidden carrier column. Exclude the carrier from
rendered leaves, visibility/field/custom-action lists, sort, and empty-visible-data
checks. Disable ad-hoc native column filters in the managed path. G-01 must prove
the carrier/row-model/reactive bridge against pinned v9; revise the adapter if
needed without inventing another engine.

Client: core rows → composite filter → native sort → native pagination → render.
Server: manual filter/sort/page with application-supplied records/metadata; never
reprocess a partial page. No row-grouping/aggregation UI or virtualized model
added; grouped column headers remain supported.

## Operator registry and time

Descriptors carry stable ID/label key, allowed types, input cardinality
(none/one/many/range), validator/normalizer, inverse and client predicate.
Application server translators key off stable IDs. Missing client evaluation in
client mode is an error; missing server translation is validation failure, not a
silent fallback. Shared conformance vectors cover the full product operator set.

Retain symbolic relative dates; resolve using injected clock/timezone. Query keys
contain resolved boundary identity, not a new millisecond timestamp each render.
Represent a complete end calendar day as **next local calendar-day start,
exclusive**, not `start + 24 hours`. Preserve explicit instants and date-only days.

SSR serializes one initial locale/timezone/clock context. Initial active date
criteria require application-supplied timezone; otherwise resolve browser default
after hydration before date-dependent criteria apply. No browser globals in SSR.
Async option resources are separately keyed by schema/field/term/scope/page and
preserve selected IDs/labels; old responses cannot replace current searches.
