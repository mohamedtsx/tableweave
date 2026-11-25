# Closed renderer-native lifetime — provisional source prerequisite

FR-02/03/15, AC-12/13/21/25; partial G-02 fixture authoring, **not acceptance**.
Isolated tree `/tmp/opencode/tableweave-wp10-native-lifetime`, main-supplied base
848c94b. This packet does not consume the parallel admission helper or change any
NativeCollection/ControlledCollection/DataTable/host/pager consumer. No DnD resource
implementation, root export, manifest, profile, style, generation or application
lifecycle authority is added.

## Exact source ownership and baseline

Only two existing sources change: `packages/heroui/src/filters/criteria-commit-core.ts`
and `packages/heroui/src/table/renderer-commit.ts`. The sole new production file is
`packages/heroui/src/table/native-resource-lifetime.ts` (N below). All other 143
canonical production sources, pure Stage 1, `table/types.ts`, old fixtures/seals,
configs, manifests, lockfile, TASKS and Git remain worker-frozen.

Before producer edits, `node tests/reordering/native-lifetime/scope.mjs capture`
matched all 145 byte/mode entries and the exact canonical map SHA256
`31da43d6873e3c73604244cc72142f2e62081727bf3df7e3c5d1ebf93feb0ebe` from
`/tmp/opencode/wp10-before-core-entry-source145.json`. The immutable local copy,
two exact `.preimage` files and 1,379-file regular-file baseline live in `.artifacts/`.
The baseline includes the main-supplied isolated TASKS allocation; it is not a new
worker authorization ledger. Node modules/.git/.repo and this new fixture directory
are excluded from that broad file walk. No Git operation is performed. Main owns
install/intake/metadata. The frozen existing-dependency install is main's supplied
`/tmp/opencode/wp10-native-lifetime-install.log`, not an installation by this worker.

## Actual APIs (all source-private, no ordinary export changes)

All ticket types are invariant in schema S and row T and have separate WeakMap
issuance. A declaration brand is never runtime proof. Actual N exports:

| Function/type | Actual contract |
| --- | --- |
| `NativeScopeTicket<S,T>`, `NativeRowTicket<S,T>`, `NativeLeafTicket<S,T>`, `NativeHandleTicket<S,T>` | Opaque current-incarnation slot tickets. |
| `issueNativeScope(target, rowHandleColumn?)` | Actual registered `TableRendererTarget<S,T>`; optional genuine visible NativeColumn chooses the one designated existing row-handle column for this generation. Utilities are allowed here; the configured selection column is not. Repeating the same column is idempotent; changing it within an existing generation denies. |
| `issueNativeRow(target, row)` | Actual current NativeRow identity before any alleged row property. |
| `issueNativeLeaf(target, header)` | Actual public visible nonutility/nonselection leaf NativeHeader; groups/padding/internal columns cannot masquerade as leaves. |
| `issueNativeRowHandle(target, parentRowTicket, cell)` | Actual current NativeCell with exact row, cell incarnation and designated column; one handle per row. No column ID permission predicate. |
| `issueNativeLeafHandle(target, parentLeafTicket)` | One handle for the genuine public leaf target. |
| `nativeScopeRef`, `nativeRowRef`, `nativeLeafRef`, `nativeHandleRef` | Cached React RefCallbacks over only the ticket and nullable original attachment nonce. Scope returns `RefCallback<HTMLTableElement \| HTMLDivElement>`, row `HTMLTableRowElement \| HTMLDivElement`, header `HTMLTableCellElement \| HTMLDivElement`, button `HTMLButtonElement`. Actual divs deny in this nonvirtualized slice. |
| `sealNativeRefs(target)` | Library layout-only call returning `ready`, `incomplete` or `refresh-refs`. Repeats actual current core/source/frame/member and native-parent checks. No action/authority is returned. |
| `releaseNativeAttachment(nonce: unknown): undefined` | Exact release-only WeakMap lookup; no actor/source/P/DOM/native callback read. In normal use the nonce is hidden in returned React cleanup, not exposed by a ticket. Fake/duplicate/old nonces are inert. |
| `nativeRefStatus(ticket: unknown)` | Physical metadata only: `ended/issued/candidate/sealed`. It performs no permission/private callback read and does not return DOM. `sealed` is not current source permission or backend authorization; consumers must use a fresh genuine seal/intent, not this observer value. |

The lifetime API deliberately contains **no geometry getter**, scheduling,
`attach(resource, disposer)`, app validator/reset, event-listener, style, pointer
capture or vendor-enrollment operation. Future adapter access requires a separate
closed patch. Functional move UI and pager interlock remain a later selected
renderer lease, not a product action implemented by these ref probes.

## Fixed installation, proof and lifetime

Only private `createCore(adapter, true)` selected by `createRendererCommitCore`
installs N; tool/details specializations remain false. Core freezes the unchanged
cell, creates a one-shot seed and a core-created frozen `NativeCoreLink`, and calls
`installRendererNativeLifetime(cell, seed)`. `claimRendererNativeInstall` consumes
the exact seed→cell/link entry before alleged object properties. No caller supplies
policy methods. Duplicate/fake/proxied/copied seeds/cells cannot replace an owner.
Calling the direct renderer-core constructor still cannot acquire refs: the outer
`createTableRendererCell` must subsequently register it in the actual private
`rendererCells` map. Constructor installation reads no model payload, source port,
P state, DOM/global realm, subscriber or native allocation.

Link stamps bind exact current entry/mount/operation; idle denies busy/notifying/
clearing and invalid unfinished work debt (valid live timers are not debt).
Transition mode is available only while the core invokes its private fixed
reconcile hook. There is no public callback accepting that permission mode. Module
cycles are function-only; no top-level installer/constructor/claim runs.

`inspectRendererNativeLifetime` in renderer-commit retains all public renderer
registry admission. It freshly requires real source/display/member proofs and
D/ND/CD/C/P/frame-owner/origin/mode/controls ownership. It interns weak object→token
identity only. Its transient rows/leaves/cells contain stable IDs and weak identity
tokens; no T, model, view/frame, query or accepted-order backup enters N. Invalid
source throws; a genuinely source-only model returns blocked, never fake display.
`captureNativeResourceTarget` is association-only: exact registered cell/current
snapshot actor before live source require. This lets a same-actor wait revoke
refs when ordinary renderer require is unavailable, without permitting a stale A
target to clear B. It cannot authorize a candidate or geometry on its own.

The finite generation owns one scope, current page row/public leaf slots and one
handle per target. Its seal is actual mount/domain/frame/native/member identity,
not snapshot.version, model object identity, an actor permission cache or equality
of C/strings/query. Source/frame/native replacement retires the generation; exact
removed/replaced members retire their slots. A new model wrapper with unchanged
actual identities preserves refs. Ordinary config B preserves geometry but old A
action callbacks still fail the existing renderer actor fence. Ref callbacks may
prove the current actor for unchanged geometry, never retag an old action closure
or a changed native incarnation. No private source integer is synthesized for the
separate reorder protocol.

## Commit refs, release and bounded React refresh

Issuance is finite/idempotent metadata with no DOM write; actual ref callbacks
store candidates only in React commit after fresh idle/member proof. Realm-native
prototype/getter functions are captured lazily from the ambient realm, never from
an alleged node's ownerDocument/defaultView. Native getters brand-check tr/th/
table/button, ownerDocument and prototype ancestry; proxies/prototype-only spoofs
deny. Foreign realms/virtualized divs are unsupported. No DOM search, index-derived
identity, clone/reparent or cell-as-row ref is used by production code.

Children may precede scope: candidates remain inert until seal checks actual
table→tbody/tr or thead/tr/th and designated button/cell/header parent chains.
Existing `data-column-id` is a consistency check only after actual native-member
proof, never authorization. Handle ancestry has a bounded 128-step limit. Native
node ownership is exclusive and weakly keyed; exact cleanup cannot delete a
replacement owner.

Returned cleanup or null closes that callback ticket permanently. A same-node
repeat while still attached is idempotent; a different node cannot reuse an active
ticket. Late cleanup/null only releases its original nonce and exact descendants;
even equal ID/node B cannot be erased. Null before first attachment ends the ticket
without requesting a Suspense retry. New issuance needs genuine current proof.

**Ended callback non-null replays are inert**, without uncaught React-commit
denials or silently installing B. Commit-time proof/brand/reentry failures clear
owned candidates and are contained; no application callback is executed here.
Explicit acquisition/ref-factory/seal misuse still throws `TableRendererCommitError`
outside that callback boundary. Ref release itself calls no listener, scheduler,
React setter or actor/model/source getter.

An ended previously attached slot marks `needsFreshTicket`. A later genuine seal
consumes the mark once and reports `refresh-refs`; repeat seal is incomplete, not
an infinite retry. The future real host must do a bounded local render/layout
handoff and reissue fresh callbacks, including cached collection props. A new
ticket clears the mark. The direct-compound fixture authors that local handoff,
but **no current NativeCollection/DataTable host is wired or proven to perform it**.

## Core purge/reconcile and real debt

P purge, ordinary commit failure or disconnect first retire current authority,
then N physically nulls/tombstones all owned IDs/seals/refs/slots (including never
attached candidates), before other locals/metadata/work/observers. The renderer-only
finally barrier invalidates every work callback even if metadata clearing fails.
Pure map/field clearing is not native disposal and invents no DOM debt.

Existing captured timer/rAF cancellation still owns its exact native token,
function and armed/finished state. Throw/nonvoid cancellation keeps invalid,
callback-null debt; P cleanup retries that exact debt before acknowledging cleanup.
It blocks this cell's native acquisition/publication, not another table with equal
C/IDs. Existing allocation/cancellation limitations are not expanded into a claim
about unobservable native allocation failures. N adds no native-specific work.

Successful commit reconciles after activation/current/pin and before snapshot or
observer publication. Capture does not claim refs. Metadata update reconciles
after actual activation, before metadataTouch/notify; retiring refs invalidates/
cancels old-frame renderer work through the existing single work set. Unchanged
geometry keeps valid work. Malformed updates fail closed through renderer purge;
the pre-try reentry guard revokes refs/work callbacks without clearing outer busy
state or publishing nested success. A clearing guard also prevents a captured
native cancellation from reentering connect/commit/update/schedule and resurrecting
grants during purge. Tools/details adapter policy and the exact tool-facade SKIP
branch remain unchanged; no renderer SKIP exception is added.

Disconnect finally release/notification reports revocation, **not** successful
native cleanup. A fresh lease may enroll after successful exact debt barrier and
real current P, never via old tickets/source ABA. No cleanup polling, app lifecycle
call, automatic backend retry/undo/acknowledgement is introduced. Clearing owned
references does not erase external app state, React fibers/effects or promises.

## Authoring and verification limits

`neutral.test.tsx` authors genuine D/C/P/hook-model construction, own keys/descriptors,
unregistered-core/fake-seed denial and constructor DOM independence. Browser files
use actual HeroUI/RAC compounds and genuine native view members, not wrapper rows
or static fake collection leaves. Synthetic probes check refs/identity, not G-02
drag behavior or a complete table renderer. Port6590 config is authored only.
The runner also names unchanged F3 cell/work and facade denial regressions; original
SKIP/browser and other producer suites remain separate final-phase commands.

Light evidence and exact input/handoff hashes are indexed in `.artifacts/` and the
handoff section below. Failed first TypeScript/formatter logs remain failures;
they are not rewritten into passes. No runtime/React/SSR/browser/server/negative/
dual/emitted/packed/golden/G-02/independent execution or source acceptance follows
from positive types, syntax or AST own-key comparison.

Deferred commands (final phase only):

```sh
pnpm exec vitest run --config tests/reordering/native-lifetime/vitest.config.mjs
pnpm exec playwright test --config tests/reordering/native-lifetime/playwright.config.ts
pnpm exec vitest run --config tests/table-renderer-commit/vitest.config.mjs
pnpm exec playwright test --config tests/criteria-facade-config/playwright.config.ts
```

Final-phase integration must additionally prove actual raw/omitted NativeCollection,
details/tool compatibility, source ABA/wait/Suspense/Strict cached collection refresh,
metadata failure and native-cancel reentry, SSR module evaluation, negative/dual and
packed isolation with the unchanged producers. Browser/AT/device/one-manager/no-DOM-
reparenting proof and adapter debt remain Stage 3/G-02, not this refs-only handoff.
The actual fixed renderer `clearMetadata` is a closure-local null assignment; no
genuine application port can make that assignment throw. Its defensive finally
barrier is source-review/static authoring scope here, not a fabricated throwing
app disposer. A runtime forced-throw probe would need separately selected internal
instrumentation; no public injection hook was added merely to manufacture it.

## Handoff evidence

Final positive TS6 `6.0.3` no-emit passes:

- Own `tsconfig.light.json`: `.artifacts/ts6-own-final.log`.
- Unchanged shell positive program: `.artifacts/ts6-shell-final.log`.
- Unchanged S3 positive program: `.artifacts/ts6-s3-final.log`.

Full scoped Biome formatter/lint (assist disabled only) passes 17 files with no
fixes/diagnostics in `.artifacts/biome-handoff-final.log`. Static syntax/constructor placement,
unchanged cell own-key and CommitAdapter-key AST checks cover 16 inputs; they do
not execute a module cycle or assert browser/runtime own keys passed. Scope check
passes all other143 canonical source byte/modes and the 1,379-file old regular-file
baseline: `.artifacts/scope-final.log`. Original TS/formatter failures remain in
`ts6-fixtures-first.log` and `biome-first.log` (and intermediate logs).

The stability replay is `.artifacts/static-handoff-final.log`. The immutable
**142-input** positive program/config/lock pin is
`.artifacts/positive-inputs.json`, SHA256
`4bef5d91150f8d36b8fe407af46f7af949684483a6798ad2a88009aff808ca33`.
Its negative-type file is excluded; that file contains authored, unexecuted cases.
The separate post-change **source146** map is `.artifacts/source146.json`, SHA256
`c1914a17010d9849cec03f418676ac9e3094bfdb8de2efda7ed3c32d0eafa712`.
This is a new provisional source seal, not a replacement of canonical145/history
or registration of a public generation.

| Actual production path | Final SHA256 |
| --- | --- |
| `packages/heroui/src/filters/criteria-commit-core.ts` | `16a9246d51f5a192b004e209aaf99eaa75e07aa63340212dde455fee45ae68b6` |
| `packages/heroui/src/table/renderer-commit.ts` | `94580b6b9d104e5a31cc28832316c26b9b514b38d6f37b2ff0805730a5bd3dbb` |
| `packages/heroui/src/table/native-resource-lifetime.ts` | `dc5ba1bf8532c3c3ed877c7f3cb326c4dfa8a121fde18e181dc8ed7c10c38c46` |

The final `.artifacts/implementation-map.json` covers these three production
files and this entire new fixture/evidence directory, excluding only the map
itself. It is generated after the README/logs/input stability evidence; its digest
is reported in the worker handoff rather than embedded recursively in this file.
Read-only replay commands (do not redirect new files into the sealed directory):

```sh
node tests/reordering/native-lifetime/scope.mjs
node tests/reordering/native-lifetime/light.mjs stable
node tests/reordering/native-lifetime/handoff.mjs verify
```

No source consumer/export/intake/commit is performed by this worker. Main alone
selects intake after both parallel actual handoffs. All behavioral/SSR/React/browser/
negative/dual/emitted/packed/G-02/independent checks remain deferred; this is an
**implementation-ready provisional prerequisite**, not approval or a delivered
row/column drag feature.
