# WP-10 command admission — authored provisional, held

**Not implementation-ready activation, source approval, G-02, or runtime proof.**
The worker's only source edits are the four new
`packages/react/src/reordering-controller/{types,controller,admission,index}.ts`
modules. All fixtures/evidence are new files below this directory. Main's supplied
base is 848c94b, not Git-reverified by this worker. No existing source, test, seal,
manifest, root export, lockfile, configuration, docs or ledger was edited. Main owns
later entry/export/docs intake; no consumer should import a proposed installed API.

## Stop / next owner

Read [BLOCKER.md](BLOCKER.md) before allocation. Actual disabled-pagination queries
must keep canonical default pageSize, but actual complete unpaged native rows can
exceed it. Unchanged Stage 1's frame parser forbids that extent. The adapter uses
the real query page fields and the real parser: it fails closed rather than inventing
a virtual page, slicing rows, weakening an assertion or modifying a protected source.
The genuine 11-row/10-default browser assertion is authored, deliberately unwaived,
not run and expected to expose the mismatch. Main must select the extent/ack contract
and separately allocate its producer compatibility change before activation.

This is a prerequisite slice, not the entire refs/handles/pager interlock or sortable
UI. No other agent's proposed names were consumed. No DnD import/dependency exists.

## Actual new source interface

`index.ts` starts with `"use client"`. Its exact value exports are:

```ts
createReorderController(D, options)
getReorderAdmissionOwner(admission)
requireReorderAdmission(admission, D, C)
ReorderAdmissionError
```

The first returns frozen `{ controller, admission }`; `controller` is the **exact**
new object returned by the single real `D.createController` invocation. There is
no C proxy, replacement `accept`, wrapper store or supported attachment of old C.
The exact genuine D is authenticated before options/getters/alleged factory methods.
The private handle/C registries prove helper installation, not backend permission.
Ordinary `assertTableController` alone proves only the existing factory provenance.
Owner lookup is provenance, not a current UI grant. A copied/proxied admission cannot
borrow methods: invoke them on the genuine handle, not as unbound functions.

Options are anchored solely by D's S/T and use `NoInfer` at dependent boundaries:

```ts
{
  controller: NativeControllerOptions<S>,
  instanceId: string,
  readCurrent(): {
    ownerEpoch: number,
    sourceVersion: number,
    revision: string | number | null,
    baseRevision: string | null,
  },
  isRowMovable?: (actualNativeRow: NativeRow<T>) => boolean,
}
```

`readCurrent` is an atomic, synchronous application **metadata-only** port. It is
not a model/latest-render-ref/page-ID supplier or allowing callback. The optional
eligibility method is an additional check only, never a substitute for real native
controls/source/frame authority. Both app ports preserve the captured outer options
object as receiver. Original C callbacks/clock keep bare receiver semantics.

Consumed outer/controller/initial containers are captured once as plain/null-prototype
own enumerable data descriptors; accessors, inherited consumed fields, unknown keys,
supplied malformed callbacks and malformed controlled arrays reject. Application
query/records/options containers are not frozen by this helper. Metadata envelopes
are separately captured once per call under pre/finally fences, including throwing
reflection; async metadata rejects. Original callback references are fixed, not a
latest-props mutable adapter. Returns/throws (including returned promises/nonvoid
values) are not replaced by undefined; existing C still owns its callback rules.

### Clocks and bounds

- `ownerEpoch` and `sourceVersion`: nonnegative safe application integers. Same-owner
  source versions cannot decrease. Same owner+version cannot silently change revision
  or baseRevision. Retirement requires a genuinely higher ownerEpoch to reattach.
- `revision`: null, finite number, or string. `1` and `"1"` stay distinct.
- `baseRevision`: null or string. App counters are **not** C revision, P epoch, frame
  versions or an `instanceId` conversion. Metadata honesty is the application's duty.
- String inputs checked here are bounded at 1,048,576 UTF-16 code units; instanceId
  must also be nonempty. Derived row IDs are capped at 100,000 before the stricter
  actual Stage 1 frame/budget/ID/placement validation. See the unpaged blocker.
- A checked safe-integer interaction fence never wraps; exhaustion closes admission.
- Fixed helper error: `ReorderAdmissionError`, code `reorder.admission.unavailable`.
  No sensitive error cause, record, source error or telemetry is emitted by it.

## Application ownership and actual commit workflow

Create the helper in application ownership, not as a claimed mount during render.
Its constructor calls the actual controller constructor (including original initial
`validateState`), but does **not** read metadata, mount, subscribe to C/P/source or
grant a table/frame. Only the internal coordinator observer is installed then.

1. The application owns the returned actual C and its normal P/resource lifecycle.
2. `useDataTable(D, actualOptions)` produces the real model in the ordinary flow.
3. A layout-lifetime acquisition calls `admission.mount()` and retains its opaque
   `ReorderAdmissionLease<S,T>`. Model publication does not flow through readCurrent.
4. After the genuine model has committed, layout calls
   `admission.commitModel(lease, actualModel)`. A neutral/uncommitted/unavailable,
   foreign/copy/proxy model is not a permitting fixture. Exact model owner, D/C/CD,
   controls capability owner, real P-issued tool/source capabilities, current frame,
   mode/domain and accepted state are checked at use. App metadata is checked too.
5. Model/source or accepted-state changes need another genuine commit. Any accepted
   C transition closes the old model snapshot; changed query/columns also fence old
   interactions. Query changes retire the prior owner epoch before app observers.
6. Layout cleanup calls `admission.disconnect(exactLease)`. Old A cleanup does not
   disconnect B. A higher honest app ownerEpoch is needed after retirement; do not
   allocate that counter during render. Strict/Suspense fixture code exercises the
   ownership distinction, but no React/runtime proof has run.

Minimal source-level shape (not an installed export or React validation claim):

```ts
const setup = createReorderController(D, {
  controller: { initial, now, onRequest, onQueryChange, onCommit },
  instanceId: applicationInstanceId,
  readCurrent() { return applicationTransactionMetadata; },
});
const C = setup.controller; // use the original dispatch/accept/reject/cleanup
const admission = setup.admission;

// Actual layout lifetime; after useDataTable's genuine model commit:
const lease = admission.mount();
admission.commitModel(lease, actualModel);
const origin = admission.capture(lease);
const begun = admission.begin(origin, { movedId, beforeId, afterId });
if (begun.status === "started") {
  // Application owns transport/backend authorization and reconciliation.
  // This file does not submit, cancel or export application data.
}
// Actual layout cleanup:
admission.disconnect(lease);
```

Call `getSnapshot`/`subscribe` through genuine receiver-preserving closures if using
`useSyncExternalStore`: `() => admission.getSnapshot()` and
`(listener) => admission.subscribe(listener)`. No React helper hook is exported here.

## Handle methods / proof roles

| Method | Actual source contract |
| --- | --- |
| `getSnapshot()` | Stable frozen snapshot between metadata changes: opaque `version`, phase `unmounted/unready/ready/disposed`, interaction boolean and the actual Stage 1 `moves` snapshot. Not a standalone allowing permission. |
| `subscribe(listener)` | Returns unsubscribe. Exceptions cannot prevent revocation. Notification is coalesced outside purge/validator callbacks; begin also delivers at its guarded boundary before returning a submission token. |
| `mount()` | Acquires the single current opaque lease; no app metadata read or model grant. |
| `commitModel(lease, model)` | Exact current lease + genuine committed model admission described above. No public registrar, allowing factory, reset setter, fake P or claimed table. |
| `disconnect(lease)` | Exact-lease synchronous private revocation. Does not dispose C/P/resource or abort/undo a backend request. |
| `capture(lease)` | Issues opaque `ReorderInteraction<S,T>`; only one finite private origin frame/ID slot survives. A newer capture revokes the preceding one. |
| `begin(interaction, placement)` | Guarded actual coordinator begin, returning its `RowMoveBeginResult`; never exposes raw coordinator.begin. IDs come from the genuine native rows, not DOM order or another row-ID pipeline. |
| `settle(operation, outcome)` | Actual Stage 1 `RowMoveSettlement`/`RowMoveEventResult`; requires the exact issued operation. `accepted` is not authoritative acknowledgement. |
| `acknowledge(operation, ack)` | Actual Stage 1 `RowMoveAcknowledgement`; application owns truthful authoritative source publication. |
| `reconcile()` | Uses real current empty-ID observation; no fabricated `require({type:"reorder",ids:[]})`. Busy/missing former rows do not themselves permit a new move. |
| `advance(reason)` | Revokes for `context/access/source/configuration`; no app port or C/P transition. Does not invent settlement/rollback/ack. |
| `requireProposal(proposal)` | Optional exact-proposal preflight. The private original-command validator still enforces direct ordinary `C.accept` when this is bypassed. |
| `dispose()` | Idempotent admission lifetime cleanup only; application separately owns C/P/resource disposal. |

Only one real `createRowMoveCoordinator` holds operation phases. There is no mirror
accepted state/query/order cache, optimistic record reorder, rollback model or hidden
backend cancellation. Receipts and opaque interaction WeakMap values contain proof
metadata; the single interaction slot owns its page-ID payload. Public operation
wire IDs can be retained by application transport; no universal memory-erasure claim
is made for them or for unchanged Stage 1 primitive/high-water metadata.

## Command receipts, callbacks and begin self-causality

Core clones the caller command. The private receipt WeakMap keys that exact argument
received by `validateCommand`, not the caller object or a copied public proposal
command. Its original fence/lease/baseline/app metadata are issued once; revalidation
on ordinary C.accept can only check that issuance, not retag it to current B. The
proposal association is installed before forwarding the original onRequest.

Every command validation resets the metadata-only current context, including
selection/details cleanup. Guarded query/columns/navigation commands advance the
interaction fence; only pagination.change/clamp conflict with begin/pending, even
for no-op navigation. Original native/core command/baseRevision/proposal checks still
apply. Fresh external query/columns changes remain possible while pending; they are
not continuation of an old gesture or authorization to mutate a backend.

Private state validation checks before and after the original application callback,
covering reducer/updater/clock and post-callback changes at the actual state seam.
Request validation also checks both sides. Constructor validation is receipt-free
and forwards the original result without a source/UI check. Installed post-commit
handlers close metadata before original onQueryChange (which runs first) and onCommit;
the same accepted revision is handled idempotently. They cannot roll back accepted C.

Before begin, the admission advances its own monotonic fence and sets a latch. The
private coordinator observer credits only the exact own null-to-submitted operation
transition from the expected pre-begin fence. A different listener/config/source/
lease/C-query event is not ignored or relabeled as that event. The boundary rechecks
after listener delivery before exposing a started token. Reentrant pager dispatch
must fail without turning every genuine own begin publication into a stale token.

## Purge and lifetime limits

A real P-issued participant is registered only at genuine model commit. Its purge
clears owned model/capability references, interaction slot and pending coordinator
work synchronously with no application read/eligibility/subscriber/transport/C
command. Participant cleanup acknowledges only that private cleanup; it does not
claim resource/backend cleanup. P notification queues later observer delivery.
Explicit disconnect/advance clears private grants immediately; the real participant
release is deferred so its P observer delivery does not run inside a validator or
source-read callback. A retained release obligation blocks regrant until completed;
it is not an invented successful cleanup. Higher app epochs cannot acknowledge old
backend effects. New genuine model commit/reconciliation is required for reopening.

Separate source/frame capability loss is rechecked at event/model admission, not a
new public granting boolean. This slice has no external C subscription and does not
claim a separately proved source-owner unmount notification bridge. Exact synchronous
loss behavior beyond the authored real-P path, retained-source A/requested-B races,
P2/equal-string epochs and cleanup-debt reentry remain final-phase obligations. Main
must reconcile the actual ref/handle/pager contract rather than infer it here.

## Evidence and boundaries

`before.json` is the immutable before-additions map (not reformatted/rebaselined).
Before source additions, `scope.mjs before` checked all145 canonical hashes/modes
against `/tmp/opencode/wp10-before-core-entry-source145.json`, whose file SHA-256 is
`31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe`.
It captured 1,255 other protected non-generated files. Main-only docs/TASKS/REVIEW
bookkeeping is excluded from that second comparison, never worker-editable. Credentials,
`.repo`, Git metadata, dependency trees and generated artifacts are not read by it.
Every later scope pass matched all145 hashes/modes and all1,255 protected inputs.
The five approved pure producer bodies, historical maps/seals and default/pure entries
remain unchanged; no historical runtime result was rerun or re-signed.

Actual successful run:

```sh
node tests/reordering/admission/light.mjs light-008
```

Raw results: `.artifacts/light-008/results.json` and separate logs. Positive installed
TypeScript 6.0.3 source/noEmit program includes the real default/root transitive source
and these new modules/positive fixtures. Negative and packed consumers are excluded.
Syntax-only Node checks, TypeScript AST source/static inspection and preservation
passed. FULL scoped Biome 2.6.8 check (formatter and lint enabled, assist off) passed:
**26 code/config files**, no fixes. Immutable map/evidence/Markdown/HTML files are not
misrepresented as formatter-checked code. There was no emitted build or runtime import
of Tableweave modules. Static inspection finds one actual D factory call and one pure
coordinator call, and no root/contracts/criteria/pure entry import of the new helper;
it is not runtime/packed ESM closure or cycle proof.

Earlier raw failures are preserved, not resealed: light-001/002 positive type errors,
light-003/004 scoped formatting, light-005 JSX candidate return annotation,
light-006/007 scoped formatting. The final light-008 success does not erase them.
Formatter-only stdin reference outputs under `.artifacts/format-references` were
inspection aids; they did not rewrite the protected files or historical maps.

`handoff-hashes.json` records the eventual four new source hashes/modes and own staged
inputs. Its aggregates are content identifiers, **not approval**. The README and that
map itself, plus raw artifacts, are excluded from the staged-input hash to avoid a
self-hash; original before-map bytes are included. `measure.mjs seal` uses exclusive
creation, never overwrites an old map. Do not automatically regenerate/rebaseline it.

Sealed and independently remeasured by the static measurement script:

- Four-source aggregate: `db7eee30cef45484a19c3fd5a90468cab9c7cffda7f8471a724a7e65e03fe179`.
- 29 own staged inputs: `5185a970b029f27d94c1c34b108f6cfcc0afd8b037cd118161ea7b5aee3b1a8b`.
- Post-handoff scope recheck: all145 original source hashes/modes and all1,255
  protected inputs unchanged. This measurement is not an independent code review.

### Authored, not executed

- Genuine helper-created C + real P/native/useDataTable fixtures, including real
  resource request/snapshot bindings, controlled/uncontrolled columns and source IDs.
- Positive own begin/pending publication; listener/metadata/eligibility/query reentry;
  original captured command final identity; pending clamp denial and old direct
  C.accept after pending releases (direct denial tested before optional preflight).
- Source/config changes at command/state/request/updater/clock seams; query-first
  closed-admission callbacks; bare receivers/returned promise rejection; Selection
  Cancel and constructor metadata silence; copied/proxied D/handle/interaction,
  raw genuine unregistered C, foreign genuine model and stale lease denial.
- Real P purge callback/read counters, indeterminate same-query server refresh and
  missing-former-row observation, accepted settlement awaiting newer authoritative
  acknowledgement, Strict/Suspense/SSR speculative construction, source cycle test.
- Excluded negative S/T/opaque handle/async-metadata source and isolated packed
  consumer/export-closure scripts. The unresolved unpaged assertion is not skipped.

This is not an exhaustive authored matrix. Dedicated actual same-D P2/equal-string
ABA fixtures, visibility-specific proposals, every nonvoid/throw/request-result
combination, cleanup-debt races, AT, performance and downstream pager/ref integration
still need allocation/review. No fabricated C/model/frame/capability is used as a
permitting producer; structural adversaries exist only in denial assertions.

### Final phase only — do not run from this handoff

After main resolves BLOCKER.md and explicitly activates final verification:

```sh
node node_modules/vitest/vitest.mjs run --config tests/reordering/admission/vitest.config.mjs
node node_modules/@playwright/test/cli.js test --config tests/reordering/admission/playwright.config.ts
node node_modules/typescript/bin/tsc -p tests/reordering/admission/negative/tsconfig.json --pretty false
```

The negative command must fail for intended diagnostics; it is not a positive build.
Browser port 6561/cache/results are local to these fixtures. No browser/server is
started now. Packed commands require main's real additive client manifest export,
actual build/pack/install in a clean isolated consumer, then copied `packed/consumer.ts`
and `packed/tsconfig.json` compiled **without source aliases** and
`node packed/exclusion.mjs /absolute/installed/@tableweave/react`. Source aliases in
the unit/browser configurations are not proof of installed exports. Dual/emitted,
SSR/runtime, packed default/contracts/criteria/pure closure, broad suites, independent
review and all final fixes remain deferred. No Git operation, PR, merge, dependency
install, backend transport, deployment, credential access, self-approval or G-02 claim.
