# Remaining delivery: one final verification phase

TASK-011/TASK-017. The user explicitly selects **one final verification phase**
after remaining implementation, superseding earlier per-stage/full-packet test
timing. Product requirements, numbered reviews, evidence integrity and no-merge
instructions remain unchanged. Previously executed approvals/results stay historical.

## Implementation phase

- Continue WP-09→WP-14 in order, then eligible WP-15 work; independent code/proof
  scopes may run in parallel. Each packet still has an explicit plan/path owner.
- Use lightweight compile/scope/API/diff checks to catch integration blockers.
  Capture a small immutable compatibility preimage where needed; preserve actual
  results. Avoid repeated exhaustive suites/type-negative compiles/browser runs.
- Author regression fixtures and test commands now; label unexecuted assertions and
  remaining checks **deferred**, not passed. Existing running atomic checks may
  finish; do not duplicate them or erase failed/partial results.
- Static/interface review may permit dependent implementation provisionally. It is
  not final delegated verification approval. Earlier plan wording requiring full
  verification before every internal substage yields to this timing decision.
- Commit implementation with truthful limits. Future packet PRs are draft/provisional
  until their required final checks pass. Never represent a red current-generation
  gate or missing external proof as an accepted pass just to advance the sequence.

## Final verification-and-fix phase

Batch required unit/type/negative/import/browser/SSR/packed/CI and available manual/
performance/consumer checks against exact reviewed revisions. Record numbered
findings per session, fix actual failures and rerun affected boundaries. Maintain
source/output/archive/provenance links and unchanged historical anchors. Verify
the individual packet/PR revisions as required; a green cumulative tree alone does
not retroactively establish every earlier packet's output identity or acceptance.
Propagate reviewed integration fixes down the stack without discarding user work;
ask before any operation requiring new authority. No PR is merged.

Only then grant final delegated approvals/mark eligible PRs ready, preserving the
maintainer's later personal review. Required unavailable gates stay blocked. The
reference runner/real consumer are currently deferred inputs; synthetic fixtures,
shared-host timings or library self-consumption cannot satisfy those gates.

## Ask modal

Use the modal for new product-policy decisions, required missing inputs, spending,
external mutations beyond existing permission, consumer modifications or publishing.
Routine in-scope engineering decisions remain delegated. This phase decision does
not authorize deployment, paid resources, manual acceptance claims or publication.

The [WP-09 deferred inventory](wp-09-deferred-verification.md) links actual authored
handoffs and historical failures without treating test code as executed evidence.
The [WP-11 inventory](wp-11-deferred-verification.md) separately tracks actual
catalog/example/framework source producers, interrupted handoffs and the real
generated-route/current-archive/browser/manual prerequisites. It grants no early
framework/runtime execution or approval of blocked WP-10/G-02.

Eligible source handoffs are now preserved through WP-14/eligible WP-15 docs. The
[first exact execution selection](final-verification-execution.md) starts the final
phase with two small independent WP-14 unit groups only; no other deferred lane is
implicitly activated by that selection.
