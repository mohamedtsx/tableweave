# F3b committed criteria cells — implementation-ready PROVISIONAL

TASK-017 / FR-13/16, scoped prerequisites toward AC-16/25. This is **authored
implementation, not runtime/readiness/privacy/React acceptance**. The user's one
final verification phase remains deferred. Main owns intake, Git, exports and
review; nothing here self-approves F1/F2/F3a/F3b or WP-09.

## Lease and frozen inputs

User-supplied worktree `/tmp/opencode/tableweave-wp09-criteria-commit`, supplied
baseline `f5d5325`; no Git command reverified or changed that identity. Main supplied
the frozen successful install (`/tmp/opencode/wp09-criteria-commit-install.log`).
Authority: main's complete `docs/planning/wp-09-criteria-commit-plan.md` in the
stacked worktree plus the explicit F3b user lease. Historical adoption REPORT
sections 5/6 were consulted as proposals, not accepted APIs.

Only new `packages/heroui/src/filters/criteria-commit.tsx` and new files here are
allocated. Existing raw tools/ports, F1/F2/P1/publication/plain/controller/native/
resource/table sources, indices/exports, packages/config/locks, docs/TASKS and all
previous maps are frozen. No agents, install, network, credentials, vendor/.repo,
shared build/emission, runtime suites, browser/server or Git work was performed.
No changing API from main's other frame/React-bridge worker was read or imported.

## Exact private API

The module is not root-exported and contains no React hook or UI component.

```ts
type CriteriaToolTarget<S> = {
  readonly owner: CriteriaFrameOwner<S>;
  readonly authority: CriteriaToolAuthority<S>;
};
const cell = createCriteriaCommitCell(kind, actualController);
const draft = cell.createLocal<MyLibraryDraft>("draft"); // empty, no app initializer
const text = cell.createLocal("text");                  // string | null
const ime = cell.createLocal("ime");                    // boolean | null
const lease = cell.connect();                          // real layout only
const actor = cell.commit(lease, genuineTarget, opaqueProps);
const { ports, origin } = cell.require(actor);
draft.write(actor, libraryDraft); draft.read(actor); draft.clear(actor);
const handle = cell.timeout(actor, milliseconds, (committed) => undefined);
cell.cancelWork(actor, handle);
cell.animationFrame(actor, (committed) => undefined);
cell.disconnect(lease);                                // mount cleanup only
```

- Kinds: `search`, `tabs`, `date`, `builder`; output ports are exactly the frozen
  F3a `Filter*Ports<S>` types. Tabs/Builder capture uses the actual origin's
  **controller definition schema**, never ND schema reference equality.
- Kind/schema-invariant actors, mount leases, local slots and work handles are
  library-issued frozen objects. Instance membership is also checked at runtime.
  Tool authorities are never asserted/cast into plain publication authorities.
- `getSnapshot()` returns only a stable readonly `{version: object, actor: actor |
  null}`. Versions change on local commits/writes/purges; unchanged reads return
  the same snapshot. An actor in a snapshot is **not permission**: every private
  use must `require` it against the genuine current frame/publication.
- `subscribe(listener)` observes version metadata only, without permission readers
  or a public private-state snapshot. Observers' exceptions are isolated; they
  cannot grant readiness. Reentrant commits fail closed.
- `createLocal` allocates an empty library-owned slot in the cell's factory.
  Generic roles are only `draft`/`session`/`receipt`; `notice`/`text` are strings,
  `ime` is boolean. Reads/writes/clears require the exact current genuine actor.
  These are not accepted controller/query mirrors, app reset ports, automatic
  persistence or a generic callback-registration system. App-owned values are
  not traversed, cloned or frozen; purge drops library references.
- Fixed cell error: code `criteria.commit.unavailable`, message
  `Committed criteria ports are unavailable.`; no raw application cause. F3a
  callback wrappers retain their existing safe `criteria.ports.unavailable` error.

## Metadata and candidate linearization

Construction captures **only** kind/controller identity: no private configuration,
controller reader, source method, publication acquisition, subscription or timer.
`connect` produces one live mount lease; no actor is issued yet. Foreign/stale
leases cannot retire a replacement. A disconnected own old lease is idempotent.

At actual layout `commit`, authority is captured as own data, then actual
`getCriteriaToolOwner` proves identity **before owner payload/private props**.
`requireCriteriaTool` checks the real current frame before configuration capture.
Unknown/copied/proxied tools, mismatched owners, foreign P bindings, controller/CD
or already-retired frames cannot read private candidate fields. An invalid first
candidate does not establish a pin.

Metadata uses per-operation own-data descriptor and inherited-presence caches;
accessors and inherited consumed keys are rejected without invoking getters:

- `controller` must be exactly the captured C.
- Toolbar `expectedContext`, builder `expectedResourceContext`: capture the three
  primitive context fields once and match genuine origin values.
- Builder `invalidationKey` is required; toolbar omission/own `undefined` is valid.
  Supplied keys must be strings or finite numbers. Within a settled same origin,
  a changed stamp is invalid, not a local reset or silent domain adoption.
- The first successful config pins the exact genuine frame owner, publisher, C,
  actual CD and origin. Builder pins its captured `evaluationMode`; toolbar
  processing mode remains under genuine F1 frame ownership, not a fake local
  mode/authority. A new owner even with the same C/P needs an explicit component
  lifetime/key. Changed context/epoch can be admitted only after actual P settles
  and genuine F1 issues a current tool. UI stamps and epochs are never equated.

F3a performs the actual private capture, retaining its alias caches, receivers,
defaults/undefined and callback fences. No renderer, formatter, validator, registry
method, transport or option-source method runs during capture. Built-in defaults
remain component-owned. Target gates during capture use the candidate operation
and genuine target, **not an actor that does not exist yet**.

A stays readable through B capture while its real frame remains authorized. Only
after complete capture, actual participant registration, old-work cancellation and
a final genuine check does L-config issue/publish B's immutable actor/ports/origin.
Old A wrappers close over A's entry, never a latest ref; they deny afterward.
Same-reference and ordinary same-domain valid updates reuse the existing exact
participant, preserve local draft/session values and retire A work without mount
cleanup. Eligible semantic baselines still belong to later tool adoption.

An abandoned/invalid **render** never calls `commit` and cannot mutate A. An actual
invalid **commit** clears actor/config/local edit readiness, without falling back
to old props. Reflection reentry invalidates the operation. Post-notification
`require` prevents returning a grant revoked by a subscriber.

## Genuine registration, purge and cleanup

After genuine tool require, capture the actual owner's P, call actual `P.issue`
with the captured origin and verify `getCriteriaPublicationBinding` identity.
Register the library-owned participant using **`P.registerParticipant(authority,
participant)`**, never a proposed `P.register` API. No actor is published before
registration succeeds. Same-domain valid configs do not reissue/release it.

Actual P purge runs callback-free local code: invalidate candidate operations,
clear current actor/config, null draft/session/receipt/notice/text/IME references,
invalidate work tokens/drop callbacks, update the version snapshot **without
notifying**, then synchronously cancel exact native handles. No app callback,
focus/render/format/validation/transport, source method or controller command is
called in this phase. External code that already owns a value cannot have its
copy erased by a library; later calls/reads remain actor fenced.

Cleanup matches its captured registration/operation/previous domain, not event
object identity (`next` can differ between purge and cleanup). It retries owned
cancellation, marks only that registration cleaned and notifies version observers;
it does not consult a permission reader. Throws/nonvoid cancellation cannot be
acknowledged. Actual P retains failed purge/cleanup debt. Persistent cancellation
failure during an invalid config also releases the exact registration into real
P's purge/debt machinery. A void release result is never treated as acknowledgement;
only the actual lifecycle callback changes the local registration phase.
Actual P `begin` can execute both purge and cleanup synchronously before returning;
the authored barrier probe observes another genuine participant's purge pass,
not a false assumption that all notifications wait for `complete`.

Disconnect nulls the exact mount and purges local edit lifetime, then asks the
actual registration to release. Stale leases/old participant cleanup cannot purge
a replacement. P/C/resource lifetime, actual selection/pending retirement and
publication epochs stay app-owned; bare C commands remain available independently
of denied UI. There is **no F2 source/field registration here**, no double purge,
and no source-only recovery actor or fake frame fallback.

## Work limitations and later adoption

Only explicit library actions schedule `timeout`/`animationFrame`; construction,
connect and commit schedule nothing. Each token captures the actor, its exact
native cancel function/handle, and synchronous library callback. Dispatch checks
that actor before/after the action; cancellation invalidates the token before
native cancellation. Late/ineffective native callbacks cannot retag A as B.
Handles expose only a deadline (`null` for rAF), not authority.

These callbacks are **library code**, not raw application transports or caller
purge callbacks. Standard native scheduler allocation semantics are assumed; this
does not sandbox app code or arbitrary replacements for browser/Node platform
APIs. Callback exceptions/nonvoid returns stop that work's following actions.
No gate is valid across an await or between arbitrary calls inside app callback
bodies. Later Search F4 must explicitly rearm B using its still-eligible deadline;
baseline checks, IME/debounce policy and actual tools remain separately allocated.

## Authored fixtures — NOT executed

- `fixtures.ts`: actual root-source exports, genuine native C/CD/P, certified
  bootstrap app owner, actual F1 frames/tools and resource request/binding. The
  existing bootstrap application fixture is borrowed, not a controller substitute.
- `cell.test.ts`/`work.test.ts`: inert construction; A/B/abandoned candidates;
  own metadata/getters; stale/foreign leases and actors; exact owners/P2; first
  commit pin; all four port types/receivers; invalid/reentrant/reflected resets;
  draft/session continuity; real purge/cleanup and cancellation debt; late work;
  source inertness and bare-controller availability. Synthetic platform clock/
  cancel faults exercise ownership failures, not fake authorities.
- `host.tsx`: stable layout mount/cleanup and separate config layout commit with
  **no per-config cleanup**. Only the stable child subscribes to versions; initial
  null readiness renders no private configuration. Host/provider render does not
  inspect target payload or private candidate props.
- `ssr.test.tsx`: authored initial null-readiness server-render boundary.
- `browser.tsx`/`browser.spec.ts`: actual React Strict/hide and transition/Suspense
  renders; a captured custom form retains DOM identity, raw input/focus/caret
  through config changes; hide resets only local edit lifetime. Test-only markup,
  no product UI/styles or new design.
- `types.ts`: actual schema/port/actor/lease typing and metadata-only snapshots.
  `negative-types.ts`: twelve independently removable counterexamples; excluded
  from the light compile. No negative program has run.
- `emitted-consumer.ts`/`check-emitted.mjs`: deferred private emitted graph using
  source barrels and the fixed actual declaring vendor graph. Generated package
  metadata/links are **own output only**, not installed/public package exports or
  packing evidence. Historical installed dist is never new API evidence.

## Actual light results and measurements

Allowed work only: authoring, scoped Biome, positive TS6 noEmit, static in-memory
syntax/type-erasure/import inspection and scope fingerprints. Initial light TS6
attempts found an unused helper and fixture API/type mismatches; corrected before
the final result. No unit/React/browser execution, negative removal, TS5.9, private
emission, packed/public consumer, CI, SSR/hydration or independent review ran.

Actual final light results:

- `node node_modules/typescript/bin/tsc -p tests/criteria-commit/tsconfig.json --pretty false`:
  **exit 0**, actual source/own positive fixtures, noEmit. Negative programs were
  excluded; unit/React/SSR/browser fixture bodies were typechecked, **not run**.
- Scoped Biome authoring/check: **exit 0**, only this new source and own fixture
  folder; no shared formatting or protected edits. Final no-write check after
  manifest generation: **25 files**, no fixes applied.
- `node tests/criteria-commit/check-boundary.mjs`: **exit 0**. In-memory
  syntax/transpile only: two runtime imports, `@tableweave/react` and
  `./criteria-ports.js`; no relative cross-package production imports or hooks.
  **11** own TS/TSX files parsed for syntax (including unexecuted negative syntax);
  **0** emitted files written. This is not an executed runtime import graph.
- Node `--check`: **exit 0** for **9** own scripts/configs. No checked script or
  config was executed by that syntax-only pass; deferred runners remain unproved.
- `node tests/criteria-commit/scope.mjs`: **exit 0**; all **828** frozen inputs
  unchanged, including **117** existing sources and historical fixture/evidence
  maps. No Git comparison or generated-output claim is implied.
- Helper SHA-256:
  `a135a5d1ef6c773bc21fc2233338a695818db8767018b797d0e3f0d9337fb3ff`.
  The manifest additionally measures **24** own fixture/evidence files; README,
  the manifest itself and any future artifacts are excluded. A final read-only
  SHA-256 comparison matched all **25** measured new source/fixture/evidence files.

- `protected-before.json`: **828** existing inputs; protected source-only map:
  **117** existing sources, derived from inventory rather than assumed totals.
  Coverage is packages/tests/docs/product and the explicitly named root handoff/
  manifest/config files in `scope.mjs`; ignored vendor/dist/.repo/credential paths
  are not scanned or represented as inspected evidence.
- Existing F1/F2/P1/F3a sources, entry deltas and all previous historical maps
  remain byte-for-byte/mode unchanged. These maps do not rebase old seals.
- `handoff-hashes.json` measures the new helper and own fixture/evidence files,
  excluding README/self/artifacts. A measurement is not an approval seal.

## Deferred final-phase commands — NOT run here

From the supplied worktree root, with main's already installed dependencies:

```sh
node tests/criteria-commit/scope.mjs
node tests/criteria-commit/check-boundary.mjs
node node_modules/@biomejs/biome/bin/biome check --vcs-enabled=false packages/heroui/src/filters/criteria-commit.tsx tests/criteria-commit
node node_modules/typescript/bin/tsc -p tests/criteria-commit/tsconfig.json --pretty false
node node_modules/typescript-5-9/bin/tsc -p tests/criteria-commit/tsconfig.json --pretty false
node tests/criteria-commit/run.mjs final-001
node tests/criteria-commit/check-negatives.mjs typescript final-001
node tests/criteria-commit/check-negatives.mjs typescript-5-9 final-001
node tests/criteria-commit/check-emitted.mjs typescript final-001
node tests/criteria-commit/check-emitted.mjs typescript-5-9 final-001
node node_modules/@playwright/test/cli.js test --config tests/criteria-commit/playwright.config.ts
```

Deferred scripts require fresh evidence labels and write only new own
`.artifacts/` outputs; no dependency installation or shared dist build. Browser
execution starts an explicit isolated loopback fixture server **only in the final
phase**, requires main's existing browser installation and does not download one.
Runners, their negative baselines and the emitted/runtime/React fixtures remain
provisional until actually exercised and reviewed. Separate genuine package/
packed, SSR/hydration, manual/device/performance/privacy and independent lanes
remain main-owned; these commands do not substitute for them.

Next step: main intake/review this isolated source plus authored fixtures, then
run/fix the approved final verification phase. Raw-tool adoption and any optional
prop/export/bridge change require a later exact lease; none is inferred here.
