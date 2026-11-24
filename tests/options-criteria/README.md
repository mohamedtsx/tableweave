# Provisional option-source criteria bridge (F2)

**Implementation authored; final verification and independent approval deferred.**
Authorization: main's `docs/planning/wp-09-option-criteria-plan.md` in the stacked
worktree, and this child's TASKS top. Supplied starting revision: `1a1086d` on
`work/wp09-option-criteria`. No Git commands were run to change or reverify it.
The frozen install was main-owned. Historical exact-adoption REPORT/PROPOSEDPLAN
remain static, unverified design history; the actual publisher method used here is
**registerParticipant(authority, participant)**, not that proposal's `P.register`.

## Exact source scope / API

Only existing `packages/react/src/filters/options-source.ts` changes. New modules:

- `packages/react/src/filters/options-criteria-core.ts`: dependency-free runtime
  WeakMap handshake, source capability registration/lookup and fixed error.
- `packages/react/src/filters/options-criteria.ts`: actual criteria/publication
  association checks and explicit participant registration. No frame/native/UI code.

No OptionSource/editor-types changes, root exports, accepted controller/query mirror,
controller method patches, new source methods, configuration/dependency/publication
changes. New files are source-private until main explicitly allocates discovery.

```ts
registerOptionCriteriaSource<S extends QuerySchema, Id extends ScalarId>(input: Readonly<{
  publication: CriteriaPublication<S>;
  criteria: CriteriaAuthority<NoInfer<S>>;
  fieldId: BuilderFieldId<NoInfer<S>>;
  source: OptionSource<Id>;
}>): () => void;
```

Exported from the new bridge module only: `OptionCriteriaError` with fixed
`code = "options.criteria.unavailable"`, message `Option criteria are unavailable.`
and no raw cause/payload. Existing raw source errors keep their original message.
The core's reserve/activate/rollback/purge/cleanup protocol is **internal**, not a
second public permission API or caller-provided structural reset implementation.

## Ownership, phases and reentry

1. Source identity is checked in the core WeakMap **before reading alleged source
   properties or snapshots**. Copies, proxies, custom structural sources and unknown
   objects cannot supply proof. Genuine factory source construction performs no
   callback, acquisition, subscription, fetch or publication writer admission.
2. Verify the actual criteria→publication association, exact expected P, actual
   registered origin C/CD/domain/context, fresh plain require, and actual field's
   builder ownership before entering the private source capability. Capture consumed
   own data once; invoke genuine P/controller methods with their actual receivers.
   Publication snapshots are checked around reentrant metadata calls as well.
3. Initial reserve requires a quiescent virgin or **privately recorded acknowledged
   real-owner reset**, matching current context/field and empty actual buffers.
   A populated unbound source cannot be adopted from equal keys or an empty public
   projection. Identical setContext is still a noop, not a history certificate.
   A successful real owner clear/reset (undefined callback acknowledgement) can
   establish new clean history; its void return alone cannot. Busy/noop clear,
   failed callback, legacy nonvoid callback and outstanding cleanup do not.
4. Reserve is unpublished. A failed real registerParticipant/final registration
   check rolls back only that reservation. After actual P registration, activation
   can notify **existing** source observers; reentry is checked before returning.
   If it triggered an actual purge, retain the registered debt rather than deleting
   the source claim. Registration adds zero source.connect/subscription/transport.
5. Publisher purge advances an opaque barrier and clears IDs, known labels, request,
   page, retry, open state and current view synchronously. No app callbacks, abort,
   notification or disconnect. The constructor's immutable, already-empty server
   snapshot stays the original server snapshot; previously observed app/DOM objects
   are not claimed erased. Adopted captures check after each hostile reflection,
   including thrown/invalid capture, and before writes/publication. An interrupted
   source operation returns its existing refusal shape; late tokens cannot settle.
6. Cleanup matches the registered participant/operation/previous domain, **not event
   object identity**. Actual purge.next is null; cleanup can carry a distinct frozen
   event with the originally captured next. Retry/superseding P transitions keep the
   same source ticket, target and acknowledged phases. Mutating/notifying is busy:
   throw the fixed safe error so the actual publisher keeps owed cleanup.
7. Invoke captured original onInvalidate with the legacy bare-call **undefined this**.
   Adopted cleanup requires synchronous undefined: throw/nonvoid/async is failure,
   empty/blocked, no `.then`, constructor or species probing. Raw unadopted
   invalidation keeps its existing nonvoid/thenable policy. No universal rejection
   containment is claimed for unsupported callback promises; the app must return
   synchronous undefined. No application data/error stringification or logging.
8. Invalidation and each existing notification listener have separate acknowledgement
   state. A successful phase is not repeated merely because a later phase failed.
   Adopted observers also acknowledge with undefined; throwing/nonvoid/reentrant
   observers retain debt. Removed listeners are skipped. Raw observers retain their
   original ignored-return/swallowed-error semantics. Original cohorts/receivers are
   retained only while their exact operation is owed, then released.
9. Apply next field context only after real invalidation acknowledgement. Preserve an
   explicitly newer raw source context acceptance rather than overwriting it with
   older owed cleanup. Keep the source **internally blocked after cleanup** until
   explicit new settled-domain registration. Registration never silently retags a
   mismatched source: its real owner must use existing setContext at a safe boundary.
10. Actual successful release/debt acknowledgement frees the source claim, not the
    release function's void return. Stale releases cannot erase/reactivate a new
    registration. Transition preserves the existing connection; release/unmount
    keeps active=false. Only the actual owner's explicit existing connect can
    reacquire that lifetime. Disposal stays terminal, including interrupted dispose.

The source still has one passive, application-managed connection. No automatic
P.complete, scheduler, microtask regrant, epoch setter, source reset method or
accepted-state mirror. Data work uses current publication permission; lifecycle
cleanup deliberately does **not** require the old denied authority, so required
cleanup can complete while P is blocked. Bare controller retirement remains app-owned.

Known source-reset echoes are distinguished by the **application's actual transition
record**, not a blanket library suppression flag. The fixture demonstrates both an
owned reset echo and a genuine newer same-tag/access revocation which must still
invalidate P. The bridge never treats equal context/epoch strings as ownership.

## Authored regression/type cases — NOT EXECUTED

`regression.test.ts` uses actual source factories, the actual controller and actual
publisher; no permitting publisher/native/view mock. `fixtures.ts` owns an
uncontrolled plain controller (hence no pending proposal), and binds its one-use
initial certificate to the exact initial ticket/candidate/incarnation/unchanged
constructor snapshot. Every completion still runs the real retirement callback.
This is F2 source feasibility, **not** another native/bootstrap acceptance claim.

| Matrix | Authored cases |
| --- | --- |
| O01 | Actual page/known-label/IDs/retry purge before cleanup callbacks; late success/label recovery denied; explicit new registration and stale release |
| O02 | Request/page/options/IDs/context/label reflection reentry and thrown capture; source notification/retry reentry; denial from another participant without a source purge; registration reentry |
| O03 | Nonvoid/throw/unsupported Promise and hostile then/constructor results; separate notification debt; skip acknowledged phases |
| O04 | Original cleanup target through superseding transitions, ABA, distinct purge/cleanup events, actual failed void release debt |
| O05 | No hidden acquisition, one real connect, active=false persistence, stale release, terminal/interrupted dispose |
| O06 | Unknown/copy/proxy source; field mismatch; standalone unbound authority; exact expected P; P1 disposed/P2 SAME C/CD/context/epoch1; two independent owners; reservation rollback |
| O07 | Application-owned reset echo vs genuine newer access/domain revocation, no blanket suppression |
| O08 | Empty public view with dirty source history; real owner reset; busy void-clear noop; private reservation rollback |
| Raw | Nonvoid lifecycle callback policy/undefined receiver, same-context noop, retained selected labels, immutable server snapshot, observer clear/settlement return semantics |

Positive type fixtures are included in the light TS6 program. `negative-types.ts`,
its individual-removal checker and the own emitted consumer are authored but
explicitly excluded from that light program. No negative/emit-consumer pass is claimed.

## Protected bytes and measured source identities

- `protected-before.json`: original pre-edit fingerprints/modes (615 entries,
  including the one allocated existing source).
- `protected-sources-before.json`: **104 other sources**, derived from the immutable
  before capture, not recaptured from modified sources.
- `protected-inputs-before.json`: **510 existing inputs**, including old tests,
  manifests/lock/profile/historical producer maps. Existing 105-source maps remain
  unchanged historical inputs; no rebasing or generation/current-identity update.
- `options-source.before.txt`: exact original source bytes for later review.
- `handoff-hashes.json`: individually measured new source/fixture/evidence hashes,
  excluding README/self and private emissions. These are measurements, not approval,
  output-generation identity, publication or final verification.

Measured source SHA-256 (provisional input identities only):

| Source under `packages/react/src/filters/` | SHA-256 |
| --- | --- |
| `options-source.ts` | `37e6190dd32b4b97b8d524e69e9115fdd47c64c3c63f4e85e0061bd3701b5227` |
| `options-criteria.ts` | `bdde4afc4ba2cd1f3f26e05606c68335da93c266f656180a5037a09d2369e06e` |
| `options-criteria-core.ts` | `8df071c8c4d3fca39ba7893f4b7807be527565ccde23cb1a7095fc5ca874b994` |

The handoff manifest additionally measures 18 own fixture/evidence files. README
and the manifest itself are excluded to avoid a self-referential identity.

## Checks actually run in this provisional lane

- Scoped formatter **only on allocated files** (editing, not a lint/test proof).
- Light `node node_modules/typescript/bin/tsc -p tests/options-criteria/tsconfig.json
  --pretty false`: TS6 positive source/fixtures; initial six authoring diagnostics
  corrected. **Final light TS6 run exited 0 after the last source/test edits.**
- Static syntax/import inspection `node tests/options-criteria/check-boundary.mjs`:
  core=1 module; source=4 (source/core/contracts json+errors); bridge=4
  (bridge/core/plain criteria/publication). No native/React/vendor runtime dependency
  in these static closures. This executes the parser, **not** producer runtime imports.
- Before/split/scope fingerprint scripts: **104 other sources and all 614 protected
  inputs unchanged**, including the separately grouped 510 existing non-source
  inputs. Allocated options-source.ts is the only permitted existing-file delta.
- `node --check` on the new unit runner and individual-negative checker exited 0;
  this was syntax inspection only, not execution of either deferred harness.

**Not run:** unit tests, full existing raw source regressions, TS5.9, individual
negative programs, declaration emission/consumer, runtime imports/lifetimes,
browser/SSR/hydration, packed/public consumers, CI, benchmarks or manual AT/device.
No root build, shared emission, install, browser/server, agents, network, Git,
credentials or writes outside the three leased sources/new fixture folder.

## Deferred final-phase commands (NOT run here)

Run only with main's final verification authorization, fresh own artifact label and
the same frozen installed dependencies. Do not install or invoke a root build.

```sh
node tests/options-criteria/scope.mjs
node tests/options-criteria/check-boundary.mjs
node tests/options-criteria/run.mjs final-001
node node_modules/typescript/bin/tsc -p tests/options-criteria/tsconfig.json --pretty false
node node_modules/typescript-5-9/bin/tsc -p tests/options-criteria/tsconfig.json --pretty false
node tests/options-criteria/check-negatives.mjs typescript
node tests/options-criteria/check-negatives.mjs typescript-5-9
node node_modules/typescript/bin/tsc -p tests/options-criteria/tsconfig.emit.json --pretty false
node node_modules/typescript/bin/tsc -p tests/options-criteria/tsconfig.emitted.json --pretty false
node node_modules/typescript-5-9/bin/tsc -p tests/options-criteria/tsconfig.emitted.json --pretty false
```

`run.mjs` bundles actual source with main-installed declaring dependencies only into
this fixture's `.artifacts/<fresh-label>` and runs Node units there. Its failure logs
are preserved, never reclassified as a passing producer result. The deferred
individual-negative checker runs real compiler programs and removes one directive
at a time in memory, with all other actual source/types unchanged. The emitted
consumer reads only own real declarations, not invented API stubs or public exports.
These harness commands themselves are provisional until the final phase exercises
them. Actual runtime-import/lifetime adversarial checks and existing raw-suite
replays must be selected by main in that phase; no old full-suite command is silently
run or old test modified here.

## Handoff

Implementation-ready **PROVISIONAL**, not self-approved. Main owns review, exact
source intake, entrypoint allocation and all Git/PR actions. Run the deferred checks,
review/fix source and harness defects before granting any bounded approval. This
does not adopt the four tools, paired frame/UI callback producer, facade, full
AC16/25 privacy, synchronous erasure of prior DOM/app objects, SSR, consumer or release.
