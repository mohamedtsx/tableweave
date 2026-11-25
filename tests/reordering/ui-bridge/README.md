# Admission/UI bridge — HELD provisional candidate

**Do not activate consumers or call this implementation-ready.**
[BLOCKER.md](BLOCKER.md) gives the exact source-traced UI-cleanup-during-settlement
counterexample. Synchronous UI fencing currently reaches the original shared
observation fence and can purge an already-submitted backend operation even though
its real source remains live. The original helper bodies cannot be changed under
this lease merely to make that disappear. The two required browser assertions are
authored, unskipped and **unrun**. This is not a reported runtime reproduction.

Authorization: main's selected retained-source/app-owned-lease plan at supplied
base `6f157bf`; FR-02/03/06/15, AC-12/13/16/21/25. Only these existing sources changed:

- `packages/react/src/reordering-controller/admission.ts`
- `packages/react/src/reordering-controller/types.ts`
- `packages/react/src/reordering-controller/index.ts`

Everything else authored lives under `tests/reordering/ui-bridge/`. No UI wiring,
new native geometry/resource/vendor policy, DnD dependency, manifest/client-entry
change, root helper edge, app/backend implementation or offline continuation exists.
Main owns docs/TASKS/REVIEW, actual export/discovery, intake and Git. This worker did
not run Git, installs, builds, shared emission, unit/React/SSR/browser/server/negative/
emitted/packed/cycle/CI/independent checks, or access network/vendor/.repo/credentials.

## Actual private source API, not an installed export

The source client index now has **12 runtime + 13 type exports**. Its original
four runtime/nine type exports and all original admission method/snapshot/interface
keys remain unchanged. The eight additions are:

| Function | Actual role |
| --- | --- |
| `claimReorderUI(D, admission, appLease, uiOwner)` | Authenticate genuine D/actual admission/current explicit app lease, then exclusively associate a weak UI token. Same token/current lease is idempotent; a foreign token denies without stealing. Acquire only in actual commit. |
| `joinReorderModel(binding, model, actor)` | One current exact helper-committed genuine model/source/P/frame/query/definition/controller join. An actor/model B replaces A. Same current actor/model signature is idempotent. No app metadata read. |
| `requireReorderModel(join, model)` | Exact current model plus live genuine source/tool/factory proofs. Not keyed to row interaction fence; begin's own pending publication does not revoke a valid join. No app metadata read. |
| `suspendReorderUI(binding)` | Keep exclusive claim, tombstone join/navigation proofs, synchronously fence old row interactions/guarded command receipts. Repeated current suspend is inert. |
| `releaseReorderUI(binding)` | Retire only the exact claim; stale A release cannot clear B. Direct bridge code calls no app ports, C/P transition, disconnect or coordinator invalidation. **Indirect reentry conflict remains held; see blocker.** |
| `observeReorderUI(binding)` | Stable immutable `{version, joined, pending}` association metadata. No source/app/body read. Ended genuine bindings retain their immutable last observation, `joined:false`; they are not live backend subscriptions. |
| `captureReorderNavigation(join)` | Separate metadata-only join/lease/fence/baseline origin, no row capture/page-ID slot/fence advance/app read. One current origin is idempotent within that join/fence. |
| `requireReorderNavigation(origin, join, model)` | Original-issued origin, current exact join/model, fence, C revision, begin latch, pending identity/absence, actual native navigate proof and fenced application metadata at event time. It is not backend authorization. |

Four added types: invariant opaque `ReorderUIBinding<S,T>`,
`ReorderModelJoin<S,T>`, `ReorderNavigationOrigin<S,T>` and readonly
`ReorderUIMetadata`. D anchors claim S/T; binding/join/origin anchors dependent
arguments with `NoInfer`. Unknown/copied/proxied handles are rejected by private
WeakMap lookup before alleged payload reads. A structurally equal model/D/C/P or
equal criteria epoch/query strings is not an exact join.

Original runtime exports remain `createReorderController`,
`getReorderAdmissionOwner`, `requireReorderAdmission`, `ReorderAdmissionError`.
Original type exports remain `ReorderAdmission`, `ReorderAdmissionLease`,
`ReorderAdmissionOwner`, `ReorderAdmissionSnapshot`, `ReorderAdvanceReason`,
`ReorderApplicationMetadata`, `ReorderControllerOptions`,
`ReorderControllerResult`, `ReorderInteraction`.

**No installed `@tableweave/react/reordering-controller` claim is made.** Production
manifest and build/client discovery remain unchanged and main-owned. Fixtures use
actual relative source imports, not a pretend installed alias. Historical four/nine
entry seals are not rewritten to the new allowlist.

## Required ownership and usage (candidate only; blocked activation)

1. Application constructs the genuine helper once; it calls actual D.createController
   and returns that exact C. Activate `admission.mount()` once at committed application
   ownership, **outside renderer/Strict effect replay**. Neither construction nor
   mounting reads app metadata/source or claims optional UI. There is no permitting
   callback, C proxy, replacement accept or retrofit.
2. Retain actual `useDataTable` source producer above conditional/remounting UI. Its
   real layout commit preflights the genuine current model and ready source/tool/native
   facts before `admission.commitModel(appLease, model)`. A display-looking or old
   Strict capability is insufficient. Wait for a genuinely reissued/ready model;
   do not pass unavailable/source-only models to original commitModel as a spinner.
   That effect does **not** return admission.disconnect cleanup.
3. Optional UI connects/commits its actual renderer cell. Authenticate current
   cell/actor/model through `requireTableRendererTarget`, then claim/join with that
   committed model. `uiOwner:object` and actor identity are only association tags:
   headless code cannot prove a HeroUI actor. The later UI consumer must authenticate
   its real registry around **each** private callback/action. No registration policy
   or callback can grant the headless bridge authority.
4. Before config B/wait/cleanup, suspend or release A and release actual native/renderer
   attachments under their existing API. Refs are physical tickets, never application
   ownership/transport authority. B must publish a new genuine action join even when
   geometry/member identities do not change. See blocker for reentrant cleanup.
5. App retains exact correlated transport operation/notice while UI is hidden. With
   a live retained committed source it can call actual settle/acknowledge without UI.
   During source wait/Strict replay it retains the bounded notice and delivers only
   after genuine commit; no fake safe frame, optimistic order, duplicate coordinator,
   automatic resubmission, acknowledgement, rejection or epoch increment is generated.
6. Actual owner termination alone calls disconnect/dispose and existing C/P/resource
   cleanup. P/access/source loss retains original purge semantics and duties. UI
   teardown never means backend cancellation. No source-library backend cleanup is
   claimed. Whole producer destruction/new source-owner continuation is unsupported,
   even with equal D/C/P/IDs/epochs; it requires a separately selected closed protocol.

`harness.tsx` implements retained source versus conditional Strict UI and owns app
activation outside UI effects. It uses genuine D-created C/P/resource, real
useDataTable and actual registered renderer cells/actors. `probes.ts` surrounds the
actual renderer text body with genuine renderer/model checks. Structural/proxy
objects appear only as denial cases, never as allowing producers.

### Event navigation and row callbacks

A handler/clamp captures `originA = captureReorderNavigation(joinA)` only at genuine
committed handoff. It keeps exact `targetA`, `joinA`, `originA`; it cannot look up a
fresh origin inside saved A after pending→null. At event delivery:

```ts
const current = requireTableRendererTarget(targetA);
requireReorderModel(joinA, current.model);
current.model.authority.require({ type: "navigate" });
// Finish source/reentry/scalar/updater work before the final gate.
requireReorderNavigation(originA, joinA, current.model);
C.dispatch({ type: "pagination.change", update: { pageIndex, pageSize } });
```

This is flow notation, not new public convenience code (nullable authority must be
genuinely ready in the consumer). Dispatch is immediately on actual C with captured
validated plain scalars. No authority wrapper or source-read callback is inserted
after the final origin gate. Core's original command capture/direct accept remains
the enforcement boundary. Clamp attempt consumption occurs only after the final
gate. Disabled pagination captures nothing. Retry/Cancel/external query transitions
keep independent actual authority; selected IDs/UI hiding are not backend permission.

Rows keep their own `admission.capture(appLease)` slot. Observe/navigation capture
never replace it. A current model join is checked before and after actual callbacks;
the consumer checks actual native reorder authority too. After a real `begin` returns
its started token, recheck current join/actor before app `onSubmit(operation)`.
That callback notifies app transport; it does not permit, settle or mirror a move.

### Version publication and physical retention

Bridge metadata gets a new version on fence/no-op/pending ABA/join/suspend/release
changes. It is stable between changes; `joined` means physical association, not
`canNavigate`. Existing admission listeners deliver coalesced safe-exit notifications
even when the old snapshot's phase/moves/interaction fields stay equal. React consumers
must read `observeReorderUI(binding)` as their external-store snapshot, not rely on
unchanged old admission fields. New handoffs may capture new origins; an old handler
must never silently recapture. Reads themselves do not publish or advance fences.

Bridge proof records hold weakly interned identity tokens, exact claim/lease nonces
and primitive counters/metadata only. They store no actual model/view/T/native rows,
page IDs, query contents, or updater. Actual admission retains its sole current
model. Release/purge tombstones owner/binding/actor/signature/navigation links;
ended callbacks cannot clear a new claim. No second operation machine is introduced.

## Authored evidence versus remaining obligations

Authored, **not run**: private-handle/current-lease denial and zero-port unit cases;
speculative SSR construction; browser port6563 cases for metadata-only capture,
pending ABA at same C revision, own pending/current join, row-slot isolation,
actual config B, Strict UI cleanup and hidden settlement, source wait/app notice,
same-D/C/P different genuine hook owner, direct controlled accept/no preflight,
no-op bridge delivery, metadata-source reentry, real renderer body, complete11 with
default10/strict acknowledgement, and release/suspend-during-settle counterexamples.
Negative program authors wrong schema/T/lease/model/join/readonly rejection.
Packed consumer is authored with ordinary package imports, excluded from source TS.

The **full requested matrix is not complete**: P2/two-table/equal-string source ABA,
whole-producer teardown/new-owner denial, same source-hook Strict replay/fresh
capability commit, row/native gestures, native ref attachment replay, no-op size/
clamp scalar/coercion/clock/updater/state/query-first reentry and complete callback
return/receiver order need further authoring/review once main allocates the blocked
original helper seams. No report/source type pass stands in for these or original
runtime-own-key/Strict/SSR/dual/emitted/default-root/packed/G-02 independent closure.

### Checks actually executed

`node tests/reordering/ui-bridge/scope.mjs before` checked all150 canonical source
hashes/modes **before production edits**, saved three exact preimages and captured
1,577 protected old inputs. Supplied map digest:
`80ce38f6479ac13c80e925d519b9b6619921680513c15fdff0f0f4e4657bf8e7`.

`node tests/reordering/ui-bridge/light.mjs light-006` passed positive actual source
TS6/noEmit (including the actual neutral/native renderer source graph), source-only
AST/static guards, syntax checks and full scoped Biome formatter/lint on22 files.
Assist is disabled; **formatter is enabled**. No extent/native runtime or additional
separate compatibility program was run. Current command does not execute fixture
bodies, negative program, SSR, React, browser, cycles, emission or builds.

Historical own failures are retained raw:

- `.artifacts/light-001/positive.log`: initial implicit-any/nullable implementation
  TS failure; fixed by explicit bridge parameters/optional access.
- `.artifacts/light-002/biome.log`: initial lint/formatter failures; scope/static/
  positive checks passed. No failure log was rewritten.
- `.artifacts/light-003/biome.log`: remaining formatter failures; earlier checks passed.
- `.artifacts/light-004/`, `.artifacts/light-005/`, `.artifacts/light-006/`: full
  allowed LIGHT passes;006 is the final post-README/source-candidate check.

Final scope checks preserve all147 frozen production sources/modes and1,455 old
non-bookkeeping inputs, including historical old tests/seals/maps/logs and U1's
eleven-row assertions. Main-only TASKS/docs drift is printed separately in each
scope log, not rebaselined or silently excluded as worker work. `before.json` and
three preimages remain immutable. `static.mjs` verifies exact original admission
method/interface/snapshot/callback/readFrame bodies with only selected lifecycle
hooks, new12/13 allowlist and no root/default/contracts/criteria/pure helper imports.
This is **source AST evidence**, not executed public-own-key or graph/SSR proof.

`handoff-hashes.json` is a new candidate-only source3/own-input delta, never a
replacement for historical helper/U1/native maps. The one-time candidate seal is:

| Candidate item | SHA-256 |
| --- | --- |
| Source3 aggregate (admission/index/types path + NUL + hash + newline) | `272ab0a16fea0ecba0447c86110135021c3775b4e14f0d2bb86ce4041a239e13` |
| `admission.ts` after | `1164ea0743a77dcec7a6b8c7fe259a0ceb35927ea2114d922171de5cdd92068b` |
| `index.ts` after | `1482f0f9adcc8506bc9b08cd8958ed219d24ec825c48852bf09e2df4e491e70d` |
| `types.ts` after | `6aae69ef00b68c07e0d82d85a2933e1558317277f691da99a2d5f31e8df556a7` |
| Own25-input JSON aggregate | `6503dae1514e186d67b1f3065d46b9d8fe50c28270c29d98e5c904e2852e6439` |

The25-input map includes before-map/preimages/BLOCKER/fixtures/configs/scripts;
excludes this self-referential README, generated handoff map and `.artifacts/`.
Raw artifacts remain present, not rewritten or treated as source seal inputs.
Full before/after hashes/modes are in `handoff-hashes.json`; the explicit status is
`HELD-PROVISIONAL-UI-reentry-vs-source-observation-seam-blocker`, never approval.
`light-006/scope.log` separately records main-only drift in REVIEW.md, TASKS.md,
docs/engineering/reordering.md, docs/planning/wp-10-adapter-dependency-plan.md and
docs/planning/wp-10-admission-ui-bridge-plan.md. No baseline was updated to that drift.

### Deferred final-phase commands — authored only, do not run at intake

From repository root, only after the user's final verification authorization:

```sh
node node_modules/vitest/vitest.mjs run --config tests/reordering/ui-bridge/vitest.config.mjs
node node_modules/@playwright/test/cli.js test --config tests/reordering/ui-bridge/playwright.config.ts
node node_modules/typescript/bin/tsc -p tests/reordering/ui-bridge/negative/tsconfig.json --pretty false
```

Negative exit must fail at the intended foreign anchors/readonly fields, not just
fail for missing packages or unrelated diagnostics. Browser config owns strict port
6563; no server/browser was started. Treat the two blocker tests as real obligations,
not accepted red results or permission to skip/reseal them.

After main separately allocates the actual manifest/client discovery (currently
absent) and artifact pipeline, final emitted/default-root/ordinary/packed work must:

1. Use actual README build/package commands into main-owned isolated outputs; test
   both emitted module graphs for inert root/default/contracts/criteria/pure imports
   and original helper own keys versus new explicit client index12/13 allowlist.
2. Test actual client/helper creation and real C factory identity/direct accept in
   both emitted formats. Source alias loading is not installed consumer evidence.
3. Have main produce approved private tarballs, then copy `packed/consumer.ts` and
   `packed/tsconfig.json` to an isolated clean consumer with only those installed
   approved artifacts/peers. There, `node node_modules/typescript/bin/tsc -p
   tsconfig.json --pretty false` must resolve ordinary installed exports. No worker
   install/pack/build, fake package manifest or anticipated dist path is authored.
4. Execute original protected helper/U1/native suites unchanged, resolve all runtime
   defects and review source wait, cleanup/source generation separation, native
   lifetimes, SSR/Strict, public import boundaries and independent G-02 evidence.

**Next step:** main selects and leases the precise original helper generation/
observation-denial seam described in BLOCKER.md. Preserve this held source candidate,
preimages, failed logs and map. No client consumer activation, packet completion,
independent approval or Stage2-complete claim follows from this handoff.
