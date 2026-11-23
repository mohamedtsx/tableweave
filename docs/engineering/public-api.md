# Definition and public integration contracts

Source: HLD §4; ADR-02. **All Tableweave names/types here are proposed contracts,
not available exports.** Feasibility and type tests precede public API freezing.

## Schema versus rendering definition

The serializable shared schema contains schema ID/version, stable field IDs,
semantic types, one configured filter owner per property, allowed operators,
sort allowlist, tab predicates and defensive limits. No accessors, React nodes,
functions, arbitrary predicates, SQL fragments or secrets cross the wire.

The typed rendering definition references that schema and adds native TanStack
v9 columns, accessors, labels, formatting, presentation and callbacks. Computed/
nested values require typed accessors; simple data keys resolve directly. Filter
fields need not be visible columns. Sort schema allowlists are authoritative for
the bridge; native options can restrict but not silently enable forbidden sorting.

For the transactions example, Description can belong to search, Status to tabs,
BookedAt to date, and Amount/Reference to builder. Even on All/empty search,
Status/Description/BookedAt are excluded from builder. Other configurations may
assign those same properties to builder instead; competing owners are invalid.

## Source and page metadata

```ts
// Proposed contract sketch; not compilable package imports.
type PageInfo =
  | { kind: 'known'; total: number }
  | { kind: 'unknown'; hasNextPage: boolean };

type TableSource<T> =
  | { mode: 'client'; records: readonly T[] }
  | { mode: 'server'; resource: Resource<T> };
```

`Resource<T>` is defined in [resources](resources.md). Client records are the
complete local input. Server records are a page: never filter/sort/paginate them
again as the whole dataset. Known totals mean matching records for the effective
query, not necessarily the global dataset. Unknown totals require `hasNextPage`;
do not guess from a full/short page. Stable unique row IDs are strings; reject
duplicates and avoid array indices.

## Proposed surface and ownership

- `defineQuerySchema`: runtime-validatable, inferred field/operator/value schema
  safe in application request handlers.
- `defineTable<T>`: schema + `getRowId` + native columns + explicitly enabled
  tools/defaults/labels. Defaults match D-10/D-11/D-24, not the fully configured demo.
- `useTableweaveState` / `useTableweaveQuery`: create accepted state and request
  plan before data, avoiding “table needed to fetch table data” cycles.
- `useTableweaveResource`: adapt plain application data/status/identity/retry;
  no mandatory Query result type.
- `useTableweave`: stable controller, readonly snapshots/selectors, commands,
  resource view and native table; headless consumers render freely.
- `DataTable` and `sortablePlugin`: optional styled composition and explicit
  sortable entry, with custom details/toolbar/recovery/action slots.

Proposed reason vocabulary includes `builder.commit`, `builder.clear`,
`search.commit`, `tabs.change`, `date.commit`, `sorting.change`,
`pagination.change`, `selection.cancel`, `columns.visibility`, `columns.reorder`.
Finalize complete event typing with transitions, including row moves, not by
assuming the HLD's illustrative union is an exhaustive implemented API.

Reserve native data/state ownership, managed callbacks, row identity and manual
processing flags. Supported native column/features/options remain escape hatches
without overriding invariants. Native per-slice setters route through the bridge;
raw base-atom writes or whole-table reset cannot bypass controlled coordination.

Definitions are immutable for a mounted identity. Schema/owner changes require
an explicit version transition, revalidation and stale-state rejection; do not
silently migrate/delete rules. Controlled/default group ownership is exclusive.

## Required type evidence

Check inferred row/field types, computed accessor results, native cell/header/row
contexts, custom operator value types, client/server discriminated unions,
readonly state, invalid owner/operator combinations and server-safe entry imports.
Consumer examples must compile from tarballs without workspace aliases or casts
that hide a broken common contract. Publish API syntax only after these checks.
