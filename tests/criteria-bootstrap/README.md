# Initial-domain adoption feasibility — PROVISIONAL

Tests-only application fixture for TASK-017 / FR-15/16, partial AC-16/25.
**Implementation and authored tests are provisional, not approved.** Main's final
batch verification and independent review remain required. Nothing is exported
from a library or registered in root scripts/configuration.

The controlling protocol is
[initial-domain readiness](../../docs/planning/wp-09-bootstrap-readiness.md).
The private proposal's B identifiers are case references, not acceptance claims.
The isolated worktree is `/tmp/opencode/tableweave-wp09-bootstrap-proof`, starting
HEAD `0288904d2764796909ffadfe1660949975039bba`. Main performed the frozen install;
this worker performed no install, root build, Git write or remote operation.

## Actual fixture, not a controller facade

`owner.ts` creates a request/application-lifetime `ApplicationOwner` with the real
`defineNativeTable` registration supplied by `fixtures.ts`, genuine
`createNativeController`, actual `C.getDefinition()` reference, and actual
`createCriteriaPublication`. `C` is the original frozen factory object: no Proxy,
method patch, copied runtime, native registration alias, accepted-state mirror or
new Tableweave API. Native constraints still validate constructor/accepted state.
The app supplies an already-authorized synthetic seed, **not backend permission**.

Application operations `propose`, `acceptPending` and `rejectPending` reconcile
actual returned outcomes. Receipt bookkeeping happens only after dispatch returns;
`onRequest` records counts, never proof that a proposal survived callback failure.
The pending receipt, receipt generation/origin and opaque incarnation are app
lifecycle metadata. They are not a second query/selection store or a request key.
The publisher alone allocates its epoch.

`adopt()` performs the following outside controller callbacks/mutations:

1. Positively establish app-owned accepted/pending provenance for the current
   incarnation, no predecessor/reset/notification debt, and an allowing context.
2. Capture one ephemeral actual snapshot/revision and receipt generation, then
   begin using own-data controller/definition/context fields.
3. Bind a private one-use certificate to the exact P/ticket/candidate/incarnation.
4. Complete using the actual captured retirement callback. It rechecks those
   bindings, provenance, context, snapshot and exact receipt/generation. Only this
   certified empty **obsolete-domain** obligation set acknowledges without mutation.
5. Inspect actual settlement. Cancel/revoke/new begin/reentry/failure cannot reuse
   the proof. The fixture permits only one initial attempt, not automatic retries.

No `previous === null`, epoch1, equal keys, IDs or revision0 shortcut exists.
Unknown supplied C without its actual app owner returns unavailable, without
clearing. An already-current same bundle is borrowed, never begun again.
The fixture assumes the application truly owns its mutation history; arbitrary
out-of-band writes to bare C are not silently reconstructed or certified.

`beginReset()` revokes initial proof, creates a new incarnation even for equal
context labels, and denies through P before cleanup. Retirement rejects the exact
old receipt **first**, dispatches bare-owner `selection.cancel`, accepts a genuine
controlled clear **after dispatch returns**, and checks the actual outcome and
empty accepted selection. Proposed-only, rejected, busy/disposed, nonvoid/async
cleanup and remaining debt cannot acknowledge. Extra cleanup-mode guards allow
only the required lifecycle command; native validation is not bypassed and UI
events still require their exact issued authority. No blanket publication-ready
validator blocks the bare owner cleanup route.

`plainAuthority()` uses the real plain factory with an actual issued-authority
check in its reader, so it also denies during publication port callbacks. It does
not invent callback-scope credentials. `appTransient` and local borrower buffers
are synthetic **application** obligations, not actual tool/options-buffer erasure.
Notification errors leave accepted clearing committed and explicit cleanup debt;
safe retry is idempotent, not rollback. `finalize()` drains P before disposing C.
Borrowers release exact local participants/subscriptions only.

`prepareReplacement()` checks actual schema contents and ID/version policy before
constructing a genuine new native owner. Invalid construction leaves the old
owner alive. The tests separately exercise real `replaceTableDefinition` and
demonstrate that its generic controller is not native registration.

## Authored coverage

51 intended source-unit cases: B01–B17, B24/B25 and request isolation, plus only
pure snapshot/isolation portions related to B21/B22. They include genuine multiple/
single seeds and invalid cardinality; pending query/same-filter-sort/selection/
presentation preservation followed by normal acceptance/rejection; actual loss
from an unconditional mount-reset negative control; unknown history; borrow;
old-domain/ABA; context/revocation; exact generation/reference/candidate/ticket
checks; competing writer; callback reentry/failure; relative-clock expiry; actual
reject-before-clear; guarded UI denial; participant/app cleanup debt; busy/rejected/
proposed-only/nonvoid/async outcomes; notification failure and disposal order;
schema replacement and independent server/client/request owner objects.

`types.ts` authors 23 meaningful negative lines plus positive actual-factory uses:
readonly owner/state, exact generics/schema/receipt/ticket, no caller epoch/preserve
flag/pending getter, private app provenance constructor, exact synchronous undefined
ports and incompatible commands. `check-types.mjs` authors strict TS6 + TS5.9 source
and private-emitted consumer programs with `skipLibCheck:false`, no stubs, actual
installed declaring-package resolutions, and **one all-directives-removed program
per lane** with an intended semantic error required at every line. That full matrix
is deferred, not claimed passing.

## Already executed (before final-batch steering)

All run artifacts are in this folder's ignored `.artifacts/`; none were overwritten.

| Run | Actual outcome / classification |
| --- | --- |
| `guard.mjs before` | 742 existing tracked inputs captured, including all105 runtime sources and the main-written TASKS lease |
| `naive-before` | 0/1 passed: preparation assertion incorrectly expected `{}` rather than the real null-prototype empty selection; not a producer regression |
| `naive-control-corrected` | 1/1 passed: actual selection/receipt loss observed and asserted as a bad composition negative control |
| `candidate-01` | 42/43 passed: dispose consumes the private certificate, but test expected returned denial rather than throw; test corrected |
| `types-prep-01` | TS6 strict own-source attempt failed with five errors (missing generic RowData constraint plus one generic inference); corrected in code, no matrix/TS5.9/negative/emitted pass claimed |
| `candidate-02` | 43/43 passed against the then-current source fixture; not a pass for subsequent provisional edits/eight newly authored cases |
| `light-final --light` | After steering: TS6.0.3 strict source-only check passed with zero errors; all742 existing inputs unchanged; no emission or negative-removal matrix |

There were **three nonpassing preparation commands**, two failed unit assertions
across 88 test executions (86 passed), and one failed source-type attempt. These
are retained preparation failures, not intentionally failing producer gates. The
destructive-reset control is an expected **loss** observation, not a stable gate.
No pre-change producer failure was claimed: all producer bytes were frozen.

The source-unit runner bundles real local TypeScript with the installed Vite
esbuild tool and externalizes actual declaring-package dependencies. Captured
graphs retain input/import metadata and actual installed TanStack, React, date
and Valibot resolution; they do not import resource adapter/view, hooks or UI
runtime. The earlier request-isolation test also asserted no DOM globals. This is
bare Node factory execution, **not SSR**, renderer, React Strict or hydration proof.

### Protected baseline

`.artifacts/source105.json` and `.artifacts/protected-before.json` contain the exact
per-path byte/mode records, including existing tests/manifests/lock/docs/config.

- All105 canonical runtime source map SHA256:
  `497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790`.
- 742 protected-input aggregate SHA256 (JSON serialization of sorted map):
  `e7ebab862ee61e5c48bf4d2902438a7818ce66c36bc610ee4df9f57c32c9d6ed`.
- Final lightweight source/type/scope result:
  `.artifacts/light-final/light-result.json` (TS6.0.3, zero errors,742 unchanged).
- Current five-TS-file test/fixture input aggregate SHA256:
  `2502e528f385a2e7c45482ae6fed4142d318fc670e3d14e77c8059456c0dc533`.
  The report records each input hash. This is not an execution pass for the final
  runtime cases or the deferred dual-compiler/emitted/removal matrix.

## Commands (final batch owned by main)

From this isolated repository root, with main's existing frozen install:

```sh
# Already used once for initial capture; refuses overwriting its manifest:
node tests/criteria-bootstrap/guard.mjs before
# One allowed lightweight TS6 source-only/scope check, no emit or removal matrix:
node tests/criteria-bootstrap/check-types.mjs light-final --light
# DEFERRED final unit batch; choose a fresh label (existing runs cannot overwrite):
node tests/criteria-bootstrap/run.mjs final-units negative-control.test.ts bootstrap.test.ts
# DEFERRED strict dual-compiler source/private-emitted + removed-directive proof:
node tests/criteria-bootstrap/check-types.mjs final-types
# DEFERRED full own-code/data Biome and final byte seal:
pnpm exec biome check tests/criteria-bootstrap
node tests/criteria-bootstrap/guard.mjs after
```

Only the lightweight source/type/scope check may run after the steering update.
Root docs checking was not run; the new README is intentionally unreachable until
main links/intakes it. Do not alter docs/TASKS to hide that integration boundary.
No root/shared emission is needed; emissions, caches, bundles and reports stay here.

## Deferred proof / handoff

Main should inspect/light-integrate this code, then batch independent review and
the full unit/type-negative/private-emitted/Biome/protected-input verification once
remaining implementation is ready. The latest provisional code has **not** had
its new runtime cases replayed. Type-directive removal and TS5.9 are unexecuted.

B18–B23's actual React subscription/Strict/discarded initializer/abandoned render/
Suspense/remount/hydration/native-frame/committed-UI leases remain later lanes;
construction-only and constructor-snapshot units do not satisfy those gates.
No actual tool privacy, resource transport, facade/hook/UI implementation, packed
consumer, SSR/browser, backend authorization, complete AC/packet, release,
publication, approval, commit, integration or merge claim follows.
