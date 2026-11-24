# Criteria publication — private source producer

TASK-017; FR-06/09/10/15/16; a prerequisite for portions of AC-16/25, **not integrated
AC acceptance**. Main approved the canonical
[publication plan](../../docs/planning/wp-09-criteria-publication-plan.md) before
source work. The complete actual API/semantics and commands are recorded here; no
private proposal file is required to understand or reproduce this handoff.

## Scope and dependencies

- Only new `packages/react/src/controller/criteria-publication.ts` and this folder.
- No root/package export, discovery, controller/native wrapper, accepted query or
  selection mirror, resource/source connection, React hook, fetch, clock or persistence.
- The **only runtime dependency** is unchanged `controller/criteria.ts`, SHA-256
  `80da37ffc9cbfad9b15ead39f0b24833e382adfa45d6d8f6481656d83af654db` before and after.
- This worktree's real preexisting `createTableController` source is used for runtime
  positive/proposal actors, not a workspace-public alias or tarball consumer. The
  unit dependency graph is intentionally broader than the producer runtime graph.
- Pinned tools actually resolved: Node24.22.0, TypeScript6.0.3/5.9.3, Vitest5.1.1,
  Biome2.6.8. Existing target node_modules links resolve into the preexisting
  `/home/mohamed/Desktop/tableweave/node_modules/.pnpm/` store. No installation or
  dependency-content change. Final Vitest uses native config loading and a private
  cache, not shared config bundling/build output.

## Complete module API

Runtime exports, **from the new private module only**:

| Export | Signature / result |
| --- | --- |
| `createCriteriaPublication<S>(options)` | `CriteriaPublication<S>`; infers S from the actual controller; definition/retirement use NoInfer |
| `getCriteriaPublicationBinding<S>(authority)` | Frozen exact `{publication, origin}` for an actually issued plain authority, or null; provenance only |
| `CriteriaPublicationError` | Fixed Error name, `code="criteria.publication.invalid"`, message `Invalid criteria publication operation.`; no payload/cause |

Type exports are `CriteriaPublicationNext`, `CriteriaPublicationFailure`,
`CriteriaPublicationSnapshot`, `CriteriaPublicationTicket`, `CriteriaPublicationEvent`,
`CriteriaPublicationParticipant`, `CriteriaPublicationRetirementPort`,
`CriteriaPublicationObserver`, `CriteriaPublicationOptions`,
`CriteriaPublicationBeginResult`, `CriteriaPublicationCompleteResult`,
`CriteriaPublicationCancelResult`, `CriteriaPublicationDisposeResult`,
`CriteriaPublication` and `CriteriaPublicationBinding`. All applicable types preserve
S extends QuerySchema. Tickets and snapshot versions have private type brands and
frozen opaque runtime identities; structural copies do not pass registry checks.

### Inputs and snapshots

Options: own-data `{controller, definition, retirement:{retire(event):undefined}}`.
The application captures **the actual controller.getDefinition() reference** outside
this producer. This is not the separately normalized native controllerDefinition copy.
Both owner refs remain fixed for this publication; a real owner replacement requires
disposal and a new publication, not a matching schema/version string.

Next: `{controller, definition, expected, actual}`. Contexts have nonempty string
definitionKey/scopeKey and boolean access. **No caller epoch.** Each consumed original
prototype/own descriptor is captured once per operation, including aliased contexts.
Consumed inherited/accessor fields fail without invoking getters. Unrelated fields
are ignored without enumeration; any own epoch descriptor rejects by presence.
Supported envelopes are Object.prototype/null-prototype data objects, not arrays/
functions. Opaque owner objects are not inspected/frozen. Reflection can run Proxy
traps; registered identity lookups never traverse proxy targets/properties.

Snapshots are stable frozen objects until metadata changes, with an opaque version:

| Phase | current | pending | failure |
| --- | --- | --- | --- |
| unready | null | null | null |
| blocked | null | captured CriteriaCurrent or null | safe reason or null |
| settled | captured CriteriaCurrent | null | null |
| disposed | null | null | null |

Existing CriteriaCurrent is exactly controller/definition/expected/actual/epoch;
CriteriaOrigin is controller/definition/context/epoch. Neither contains a publication
field. Phase=settled and a cached snapshot are **not event/backend permission**.

Safe failure reasons: owner-conflict, invalid-input, purge, cleanup, retirement,
reentrant, cancelled, epoch-exhausted, closing. Methods below validate their exact
registered `this` before touching payload/ports. Detached/copied/borrowed/proxy
receivers fail. Unknown/foreign ticket identities are fixed API errors; known obsolete
receipts are stale. Results are frozen and include the actual final snapshot and
`notificationFailures` (count only, no exception values).

### Methods and result forms

| Method | Result / action |
| --- | --- |
| `getSnapshot()` | Pure stable local metadata; no reset/read app state/notify/subscribe/acquire |
| `begin(next)` | `{status:"pending",ticket}` or `{status:"blocked",reason,ticket:null|receipt}`, plus result metadata |
| `complete(ticket)` | `{status:"settled"}`, `{status:"blocked",reason}` or `{status:"stale"}`, plus result metadata |
| `cancel(ticket)` | `{status:"cancelled"|"stale"}`, plus result metadata; not selection/editor Cancel |
| `dispose()` | `{status:"disposed"}` or `{status:"blocked",reason}`, plus result metadata |
| `issue(origin)` | Actual unchanged plain CriteriaAuthority object; no wrapper, controller calls, app reader or permission on issue |
| `registerParticipant(authority,{purge,cleanup?})` | Exact-record idempotent unsubscribe; registration only on its current bound allowing settled candidate |
| `subscribe({notify})` | Exact-record idempotent metadata unsubscribe; no initial notify or external subscription |

Callback functions and original port receivers are captured once. No bind-per-read or
mutable latestConfig reset delegation. Purge/cleanup/retire/notify must synchronously
return **exactly undefined**. Explicit `: undefined` annotations help when declaring
ports outside contextual typing. Opaque `() => void`, async, Promise/thenable, false
or other results are not acknowledgements. No then/constructor/species probing or
Promise adoption occurs; unsupported async work/rejections remain caller-owned.
Throwing/nonvoid observers count failures but cannot acknowledge/veto settlement.

Events are frozen `{kind:"transition"|"release"|"dispose",controller,definition,
previous,next}`. Transition previous is last settled metadata/null; purge next=null,
later cleanup/retirement next is the captured candidate/null. Release previous is
that registration's domain, next=null. Dispose previous is last settled, next=null.
Retries retain original phase events and acknowledgements.

## Admission and action semantics

One private admitted metadata writer per exact controller **per module instance**:

| Action | Ordering and postcondition |
| --- | --- |
| Constructor | Inert capture + weak per-publication registration only; no controller-wide lookup/claim. Duplicate or dropped construction cannot poison another instance |
| First begin, occupied writer | Reject locally before next reflection or any port/observer callback; no epoch/ticket/claim; actual writer unchanged |
| First begin, vacant writer | Capture valid metadata; check own attempt and writer after every trap; final callback-free absent-entry admission installs epoch1 + candidate/ticket + blocked current=null |
| Invalid/interrupted first begin | No claim/epoch/ticket/retirement/observer notification; explicit caller uses result/snapshot |
| Admitted begin | Deny/invalidate old receipts before reflection/purge/callback; burn next dedicated epoch, deactivate old participants, local purges, capture, source cleanup; still no grant |
| Same-context begin | Real reset and fresh epoch, not a no-op or mere setContext |
| Complete | Retry only owed cleanup, then required app retirement; after each call check current ticket/candidate/exact writer/closing; settle only when all synchronous acknowledgements succeed |
| Cancel pending | Invalidate candidate/ticket, remain blocked, retain writer/debt; no old-grant restoration or controller mutations |
| Never-admitted dispose | Pure terminalization, zero retirement/purge/cleanup/observer calls, no writer lookup/deletion; cannot affect active other publication |
| Admitted dispose | Deny/close, drain owned cleanup then required app retirement; failure retains claim. Full success compare/deletes its exact writer **before** terminal notify |
| Old dispose/unsubscribe | Cannot delete/clean a replacement writer or registration; disposed readers deny permanently |

Once admitted, failure/cancellation/reentry/first-completion failure retains ownership
until successful disposal. A rejected instance does not wait/subscribe/automatically
retry when the other writer releases. Admission checks no controller methods and
does not inspect backend permission. Invalid next for an already-admitted publisher
still denies/purges and burns an epoch; invalid first next does not acquire ownership.

Page/sort/page-size/request refresh/props/clock changes never automatically advance
the dedicated domain epoch. At MAX_SAFE_INTEGER, the source guard denies and retains
claim/debt without wrap or public/private test setter; only explicit disposal may
finish cleanup. This guard is source-reviewed, **not an executed 2^53 iteration test**.

## Cleanup, retirement and reentry

Required local purge owns exact library cells and invokes no app callbacks. Optional
cleanup may invoke real captured source.clear/reset/unmount/abort lifecycle work;
it is not permission for private formatter/editor/cursor/rule/fetch work. All local
purges precede source cleanups; all owed cleanup precedes app retirement. This stage's
synthetic cells are not evidence of actual tool/option buffers being cleared.

Partial failures keep exact per-phase debt. Acknowledged phases are never rearmed
on retry; a failed phase must be safely idempotent. Old registrations retire/drop
callbacks when cleanup acknowledges, so new domains explicitly register new records
before usable private buffers. Stale unsubscribe never reads a newer sink/config.
Normal successful release affects only that registration, not other tools/selection/
epoch. Failed release leaves denial/debt and cannot reopen through an old completed
ticket. Explicit begin/complete/dispose is recovery; void unsubscribe leaks no raw error.

The captured **application** retirement port must reject its actual pending receipts
first, then genuinely clear accepted selection (including real controlled acceptance
where necessary), then app-owned transient state. A no-op selection.cancel does not
retire pending query/selection/column intent. Busy controller or rejected/proposed-only
reset must throw rather than acknowledge. See `retirement.test.ts` for real source
actors, including busy/rejected paths and preservation of accepted search. The
publisher never invokes/mutates/wraps any controller operation to perform this work.
Undefined is an app assertion, not library verification of a truthful owner/backend.

Same-publication reentry interrupts/denies and stops stale callback continuation;
no recursive cleanup/grant or automatic retry. Never-admitted self-capture reentry
cannot acquire a claim; disposal during it is terminal. Another unclaimed instance's
same-controller conflict **does not** mark the real writer reentrant or cancel its
outer receipt. Operation depth is per publication, never a module-global busy guard.

Observers are explicit passive metadata registrations, not cleanup acknowledgers.
No calls before admission, including failed first begin/never-admitted dispose. An
admitted operation visits only the original active cohort once each, with no grant
payload. Reentry stops stale delivery; remaining unvisited members may read latest
blocked metadata. New registration during protected work rejects; removed records
are skipped. No recursive drain. Authority reads deny during all protected work,
including observer/release callbacks, while getSnapshot stays pure.

## Genuine authority / cross-publication proof

Issue is allowed only from an admitted exact settled or pending candidate, before
origin capture. Pending issue grants nothing until complete. Its internal reader
uses captured metadata/identity only, with no app reader/controller snapshot/cleanup.
The original plain require still checks actual isDisposed/getDefinition afterward.
Direct controller disposal can deny require without automatically purging/notifying.

After disposed P1/new P2 with identical controller/definition/context and epoch1:

- P1 readers remain denied, tickets stay foreign, and bindings never relink.
- P2 plain require with equal-valued retained P1 origin **may pass**: plain origins
  intentionally do not encode P. This compatibility is positively exercised.
- A future publication-aware receiver must call the actual inert binding lookup,
  compare its publication with its **own captured expected P**, then fresh plain
  target require and later post-reentry/pre-dispatch checks. A supplied binding object,
  origin equality, compatible reader or public require method is not that proof.
- A standalone plain authority is valid for its original API but has null publication
  binding. Supplied invalid/undefined/unbound opt-in authority never falls back.

Tests of the producer binding are not actual adapter acceptance; a disposed P1
registerParticipant rejection alone would also be explained by P1's disposed lifetime.

## Exact scoped commands (run from repository root)

These avoid root scripts that build shared outputs. No install is required:

```sh
node tests/criteria-publication/verify.mjs
```

The ordered runner writes only `.artifacts/final-checks.json` and runs these individual
commands without parallel edits/builds:

```sh
node node_modules/vitest/vitest.mjs run --configLoader native --config tests/criteria-publication/vitest.config.ts
node tests/criteria-publication/check-types.mjs
node tests/criteria-publication/check-boundary.mjs
node node_modules/@biomejs/biome/bin/biome check packages/react/src/controller/criteria-publication.ts tests/criteria-publication
node tests/criteria-publication/fingerprints.mjs
node tests/criteria-publication/measure.mjs
```

check-types runs strict source units/config and own private declaration emission
with **both** installed compilers. In each compiler/source-or-emitted mode, it removes
each of 25 negative directives independently, checking the intended diagnostic on
that line (not unresolved imports/names). Total: **100** negative/compiler/mode checks.
skipLibCheck=false; no declaration stubs. Generated fixtures are under .artifacts.

check-boundary traverses actual emitted imports: **2 runtime modules**, **5 own
declaration files**, and bare Node without window/document or added rejection handlers.
This is private own emission, **not tarball/workspace-public/packed acceptance**.

fingerprints checks the immutable original 72-file seal in `protected-inputs.json`:
all existing package/app files and immediate root configs/manifests/lock, excluding
generated dependency/dist/cache paths and explicitly excluding the new publication
source and other worker's active `contracts/execution.ts`. It does not read the
execution worker's test/artifact folder. Main-owned docs/ledger and other existing
tests are not sealed; no claim that the entire repository was unchanged is made.
The four approved pagination contract sources, details, controller/native/resource/
filter producers and exports are included. capture/seal modes were used once before
handoff; do not regenerate the historical seal merely to pass a later comparison.

measure prints/writes `.artifacts/source-test-manifest.json`: SHA-256 of sorted
`<file sha256>  <relative path>\n` lines for the new source and this folder's .ts/.mjs/
.json files. Documentation/.gitignore/.artifacts are outside that tested-code aggregate;
the final measured digest and test counts are in [EVIDENCE.md](EVIDENCE.md).

## History and honest limits

Early strict checking caught missing explicit method parameter/callback-return
annotations; these were fixed without widening the approved surface. Formatting
moved five negative directives; they were relocated to the actual error lines.
The diagnostic harness added actual TS2379 for exact-optional rejection. One real
controller fixture initially omitted required onRequest for controlled state; it
was corrected. Full-rule Biome rejected an explicitly defined then property; the
unsupported-return fixture now uses an inherited Promise prototype object and poison
returns, without disabling any lint rule. Initial Vitest runs used its default config
loader; final reproducible commands use native config loading/private cache. Earlier
partial runs are not substituted for the final post-format ordered checks.

Safe discarded construction does **not** prove modern React integration. Explicit
begin/complete/dispose still need application-safe non-render ownership. A later
committed callback/config lease starts null, gates abandoned/Strict/Suspense work and
must preserve eligible drafts across ordinary props/page/sort/request changes.
Registration need not precede React commit; it must precede usable authorized private
work/buffers. Initial static render projection is separate from event permission.

Actual option/source late tokens, real buffers/custom editors, paired controls/native
frame provenance, details dataset/definition/safe-integer mapping, SSR/hydration,
real consumers, full AC16/25/facade/unpaged/packed/G05/manual AT/device/performance/
legal/publication remain separate. No independent approval, backend authorization,
merge/release or complete-packet acceptance is claimed. Main's separate reviewer is
required before producer approval/adoption.
