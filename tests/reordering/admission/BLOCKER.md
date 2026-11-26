# Open producer contract: genuine unpaged collection versus Stage 1 page bound

**Source-traced, not runtime reproduced. No existing producer was edited.**

The new helper preserves real C query/page provenance and validates its derived
`RowReorderFrame` with the actual unchanged Stage 1 parser before supplying it to
the actual coordinator. This closes every observation-parser failure rather than
letting a cleared pending state reopen an old model. It also exposes a real
unpaged compatibility question that the helper cannot silently solve.

1. `packages/react/src/contracts/query.ts:74–79` requires disabled-pagination
   queries to keep pageIndex 0 and canonical schema default pageSize (e.g. 10).
2. `packages/react/src/tanstack/adapter.ts:558–560,591–615` disables native slicing
   when pagination is disabled and returns the actual full native row model.
   Eleven complete local rows with defaultSize 10 are therefore coherent input.
3. `packages/react/src/presentation/project.ts:477–483` permits fresh manual-order
   rows with no sorting/effective filters; it does not require pagination enabled.
4. Approved `packages/react/src/reordering/capture.ts:147–151` rejects a frame when
   its complete current-page IDs exceed stamp.pageSize. Stage 1's origin/ack
   comparisons also use pageSize (`capture.ts:209–224`).

Consequently, copying the real query page fields into the real frame produces an
11-ID/10-size rejection even though the genuine unpaged controls can allow moving.
Raising the stamp size, choosing an invented virtual-page size, slicing rows or
switching to DOM indices would change provenance/semantics without an allocated
contract. Increasing the actual query pageSize violates the disabled-query rule.
No such workaround, product restriction or assertion downgrade was applied.

`browser.spec.ts` authors the genuine 11-row unpaged requirement case through the
actual helper C/P/useDataTable/native/controls producers. It expects ready admission,
not today's fail-closed result; it is not skipped or declared passing. No browser,
unit or runtime command ran. The compiler does not establish this runtime assertion.

**Next owner: main.** Select/document the genuine unpaged reorder-frame extent and
acknowledgement semantics, then explicitly allocate the smallest necessary producer/
adapter compatibility change and its fixtures. All five approved pure bodies and
their historical hashes stay untouched here. The authored prerequisite helper is
held for this disposition, not delivered as a complete activation-ready Stage 2 or
G-02 result. No controller/native/source/publication edit is requested implicitly.
