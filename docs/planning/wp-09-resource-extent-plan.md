# WP-09 U3 — generic request extent provenance

TASK-017 / FR-06/10/12/16, partial AC-16/24/25/26. Prepared from actual combined
resource sources. **Inactive until U2 is independently accepted and main records
fresh hashes/allocation.** No resource writer is assigned. This is generic metadata
consistency, not backend completeness/authentication or native/control integration.

## Proposed exclusive lease

Only resource/{types,adapter,view}.ts and new tests/pagination-policy/resource-extent/**.
Keep hook/lifetime, native/presentation/controller/schema/execution/publication,
existing tests/exports/config/manifests/lock/docs/Git frozen. An internal resolved-
extent helper may live in view.ts for adapter/view reuse; no new public proof factory.
Reuse QueryExecutionExtent by type import only. No install/shared build/new dependency.

## Exact additive raw metadata

ResourceRequestInput and ResourceRequest gain readonly optional extent and evaluatedAt;
snapshot inherits the exact token fields. ResourceSuccess gains no override fields.

| Admitted input | Meaning |
| --- | --- |
| Both metadata members absent | Legacy page, resolved from the copied query pair; preserve old physical token/snapshot shape. |
| extent page | Exact kind/pageIndex/pageSize shape matching the copied query pair; evaluatedAt mandatory. |
| extent complete | Exact kind-only shape; evaluatedAt mandatory. No offset/limit/count inferred from dormant pair. |

Time must be finite and Date-valid; zero/negative/fractional valid instants remain
valid. Time without extent, explicit undefined metadata, extra/accessor/hidden/symbol
extent members reject. Schema policy/registry/actor eligibility stays outside this
generic adapter. Absence never means complete.

## Capture and mutation rules

- Preserve change/disposed/notifying/inactive/access/invalidation/context refusal
  behavior. For admitted work capture consumed request data once by own descriptors,
  including query/retry refs, validate those exact captured values, and only then
  advance sequence/open/retry/current/publish. Never validate then reread input.
  Do not expand this into unrelated contextCopy/invalidation/Promise-policy repairs.
- Existing retry spreads the prior token (including generation); ignore unrelated
  envelope members as before. Do not impose a blanket unknown-key rejection that
  breaks that path. Preserve legacy optional retry semantics; explicit undefined
  rejection applies to the two new metadata members, not arbitrary old fields.
- Keep the existing schema-independent wire version/pagination shape checks and
  fixed safe invalid-input Error mechanism. No new ResourceError class/error family.
  Capture/validate all new metadata before mutation; failed input leaves prior token,
  sequence, retry, snapshot and notifications unchanged.
- For exact-current fresh success capture consumed fields/page/array container once;
  never validate A then store B. Preserve initial stale/copied/placeholder refusal.
  No success extent/time override is allowed, even if labels agree. Other unrelated
  legacy extra fields stay outside this change. Copy/freeze only new envelopes and
  array containers, never business record objects or caller arrays.
- Complete success requires dense supplied records, page known and total===captured
  record count, including0. Unknown/contradictory totals reject before state mutation.
  Page/legacy remains page regardless of count or result labels. Add no complete-row
  cap or broad new legacy page-size bounds; maxPageRows is not a complete limit.
- Snapshot spreads only the real accepted current request's captured metadata.
  Retried request preserves original query/extent/time and uses a new generation.
  Application transport sees the real new token through the existing retry route.

## View behavior

Resolved extent participates in obsolescence: omitted page and matching explicit
page are semantically equal, page/complete are always different even with identical
opaque keys/query. Do not timestamp all semantic identity or reinterpret request
evaluation as a new clock. Keep snapshot/request evaluation fields exact.

Complete canNavigate=false, but otherwise preserve current usable canSelect,
canReorder and canRetry rules. Keep one last-fresh buffer, retained A's own metadata
while B loads/fails/retries, real empty replacement and existing invalidation/lease
behavior. No hook/second connection/SSR bootstrap or implicit transport is introduced.

## Required proof before review

Seal representative actual legacy tokens/snapshots/retention/retry behavior before
edits, including physical own-key shape. Test all new metadata combinations, hostile
own descriptors/aliases and capture failures, complete137/>100/0/dense records,
known-count equality and invalid-success nonmutation. Counterexamples must show a
page-origin token cannot be promoted, copied/late/placeholder/cross-adapter requests
cannot settle, and same opaque keys do not equate page with complete. Real app lying
about a truncated subset plus matching fabricated total is not detectable proof.

Re-run actual unchanged resource races and original source suites; strict TS6/5.9
source/private-emitted inference/meaningful negatives and scoped Biome. Preserve
all historical input maps; create a named new stage protection map instead. Capture
exact source/test hashes and commands in own README. No root output-generation
changes/exclusions/full-check claim, native/server-complete binding/projection,
browser/SSR/genuine packed/facade or full AC acceptance. Stop before excluded edits.

## Activation and exact inputs

Main independently accepts U2 and commits0288904 before activating this exact U3
lease. The raw optional metadata pairing/table above is selected: both absent
legacy, any explicit extent requires evaluatedAt, no time-only or undefined pair.
This runtime validation contract does not pretend raw optional types make all bad
combinations statically impossible. One worker owns only the three sources/new tests.

Pre-U3 source105 canonical map is497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790.
Initial source SHA256s:

- types.ts:1eba3f273584c16fa6eefa39cd497dcb4142dbcf44155fdda79ecdc2e62d8863
- adapter.ts:f30a63afabb116bc3a1d71952ab1e5e1912535917699ea08ce5ac6ec3b9b4bc9
- view.ts:7f3ef437d01824cb0e14a34520fa6fa67c72bf440aa85b2fb7b7cb234e529f7c

Preserve earlier producer maps; create a new102-source stage protection map rather
than rebasing U1/U2 historical guards. This does not activate any native mode,
binding/presentation, hook, public export or output-generation integration.

## Provisional implementation handoff

[Actual U3 handoff](../../tests/pagination-policy/resource-extent/README.md) records
19-input aggregated7ce78a40584c7dc9d0adfb95398cae5db8acdc7db78bac9eb9c093e53fa3153.
Main inspects the three-file API/capture diff, replays19 input hashes/102 protected
source hashes and performs one lightweight whole-React TS6 noEmit compile successfully.
Post-U3 source105 canonical map is3327ca40ba02be4f56534e4b00414fd4836362ec570e15103c97cb606b3cf6fe.
This permits provisional dependent implementation under the user's final-phase
timing, not independent approval or a final unit/type/runtime pass. Earlier344-case
results predate final authored edits; all declared deferred checks remain required.
