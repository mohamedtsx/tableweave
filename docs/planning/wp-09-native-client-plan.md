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

## Activation and exact inputs

Main accepts U1 source after independent345+67 proof and main345/guard replay,
then commits9f96deb. This exact U2 lease is now active. Pre-U2 source105 map uses
the combined canonical JSON recipe at
abba84ba882b2d6d6fa596b74f91003308ed6d249001fa2084ebdef40a8403c2.
Initial native source SHA256s:

- types.ts:a72486264cd77d8cfd80db9e1f74d57e95dcda57d9a441ba3eb2e81f99ffb2b3
- definition.ts:9f0a6ae53e0fdf33dd976d30861eef88ae54d92d60a3c58d5a0ee5e1601db3b0
- adapter.ts:f2add671658a719c98ecbc6712ba6cf2db275b90b9196c149806103e5bf949a4

One worker owns only those three sources/new native-client tests; no other runtime
writer is active. Preserve U1's original protected maps as historical evidence,
and establish a separately named102-source protection map for this intentional stage.

[Source handoff](../../tests/pagination-policy/native-client/README.md) records
review-ready actual model proof and its client-only/native-only limitations.
Independent review is required before any U3 allocation.

Final review passes302 scoped/41 independent probes/72 golden comparisons and strict
TS6/5.9/64 individually removed negatives. Main's302/guard/lint/docs replay passes;
main grants bounded client-native source approval at
b5a853ab59f11068cb0239b20a7316101612ee8c646f479f3d4a43cc15a2a257. No later owner or
output-generation gate is accepted by this disposition.
