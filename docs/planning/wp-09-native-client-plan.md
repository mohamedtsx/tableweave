# WP-09 U2 — real client unslicing

TASK-017 / FR-12/15/16, D-10/D-24. Prepared against actual combined native sources;
**inactive until U1 independent approval and a fresh main allocation**. No native
or test worker is assigned by this document. No server-complete/resource/presentation/
facade implementation or usable whole-table unpaged claim follows.

## Proposed exclusive lease

Only packages/react/src/tanstack/{types,definition,adapter}.ts and new
tests/pagination-policy/native-client/**. Keep feature slots/hook/boundary, U1
controller, schema/filters/resources/presentation/tools/details/publication, existing
tests/root exports/config/manifests/lock/docs/Git read-only. No install/shared build/
vendor changes. Main records exact post-U1 input hashes before activation.

## Selected implementation boundary

- Add readonly NativeDefinition.paginationEnabled:boolean derived from the single
  validated controllerDefinition.schema.pagination.enabled!==false, not caller
  configuration. NativeTableView.pagination adds resolved readonly enabled:boolean.
  Preserve genuine definition/controller registration and all initial state guards.
- Client disabled uses manualFiltering=false, manualSorting=false, manualPagination=true.
  Keep the fixed feature pipeline/predicate carrier, accepted query/evaluatedAt,
  sort/visibility/selection slices and comparator behavior. Return the actual final
  unsliced model, not a parallel filtered array or huge synthetic page size.
- This intermediate step supports false policy with client input only. Reject false
  plus ordinary server mode with existing native.page before private getRowId/
  eligibility/filter/accessor work, even for empty/equal-count/full-looking pages.
  Existing valid enabled client/manual server behavior stays unchanged.
- Disabled view retains real known filtered total but pageCount=null and navigation
  booleans=false. Avoid all disabled page-count/offset math on the canonical dormant
  pair. Keep own-property clearing of stale vendor rowCount/pageCount options; no
  Infinity/-1 complete marker, state/query mutation or change to schema limits.
- previousPage/nextPage explicitly deny false policy with native.page after existing
  current/disposed/stale guards and before noop/mutation. Supported native.setPagination
  still routes to U1's early state.capability before its updater. Preserve selection
  modes/eligible rendered rows/off-page selected-ID distinction.

## Required proof and limits

Capture old paged option/row/order/navigation/selection observations before edits.
Prove real native filter→sort unslicing with173 synthetic records and more than100
matches, defaults/custom dormant size, empty/small/more-than-maxPageRows results,
two ordered sorts, built-in relative/DST and valid custom filters at accepted time.
Use the actual installed TanStack9.3.1 model, not a fake bridge/getRowModel result.

Check grouped/hidden columns, selection false/single/multiple, eligibility subset,
saved-action stale/disposed guards, denied pagination updater/private counters and
ordinary enabled paging/manual totals. False+ordinary server must reject before
record callbacks regardless of record count. Inputs/host records remain unmutated;
no cloned/frozen business objects. Existing source tests and meaningful strict
TS6/5.9/private-emitted inference/negative cases retain original behavior.

Own commands/artifacts/source/protected hashes must disclose the source boundary.
Current controls projection still assumes manualPagination equals remote mode; it
will deliberately need the later separately owned integration. This native-only
stage proves no complete-server provenance, controls readiness, browser collection,
genuine packed/SSR/facade or full AC result. Keep historical generation guards intact.
Stop for excluded source/API changes rather than silently widening the lease.
