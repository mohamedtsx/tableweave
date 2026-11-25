# U1 explicit reorder extent — compatibility-source-ready PROVISIONAL

TASK-018 / FR-02/03/16, AC-12/16/21; selected plan:
[wp-10-unpaged-extent-plan.md](../../../docs/planning/wp-10-unpaged-extent-plan.md).
**Review19n1 remains runtime/independent UNVERIFIED, not CLOSED.** This corrects the
selected compatibility contract in source only. It is not full Stage2 delivery,
producer acceptance, G-02, an installed export, a runtime privacy claim or approval.

The original [held README](../admission/README.md), [BLOCKER](../admission/BLOCKER.md),
maps, logs, fixtures and unskipped 11-row browser assertion remain byte-exact.
U1 addresses that blocker in source without rewriting its historical evidence.
Main owns preservation/intake and the later single final verification/fix phase.

## Exact three-source delta

1. `packages/react/src/reordering/types.ts`: one existing-interface property:
   `ReorderStamp.extent?: "page" | "complete"`. No new public type name/export.
2. `packages/react/src/reordering/capture.ts`: stamp optional-field capture and
   normalization, extent-specific frame size bound, normalized origin comparison.
   All other top-level declarations, including budgets/data/array/ID capture,
   acknowledgement parsing and `sameStamp`, remain unchanged.
3. `packages/react/src/reordering-controller/admission.ts`: only the authenticated
   `readFrame` policy-consistency check and conditional complete stamp marker.
   No receipt, factory, callback, source-loss, fence or cleanup-lifetime fix is bundled.

The unchanged real `rows.ts` coordinator already parses origin/current/ack stamps
and uses `sameOrigin`/`sameStamp`; no replacement operation state machine was needed.
The pure `index.ts` remains exactly four value exports and twenty type exports.
No root entry, client helper public handle/type, manifest, dependency, configuration,
native/core/resource/P/frame/styled producer or isolated-worker code was changed.
The new optional definition reorder flags are not intaken, copied or referenced.

Static preimage diff: `.artifacts/source-delta.patch`. `static.mjs` checks unchanged
imports, every unleased capture declaration, original type declarations/properties,
and the exact two added admission fragments against the saved preimages. It also
walks the five-file pure source graph and counts the unchanged entry exports.
This is AST/text inspection, not a module execution, runtime cycle or packed proof.

## Normalization / wire contract

| Input stamp extent | Captured result / rule |
| --- | --- |
| Omitted | Legacy page extent; no own `extent` key added. |
| Own enumerable data `"page"` | Normalizes to omission, preserving legacy own-key/output shape. |
| Own enumerable data `"complete"` | Preserved as an own stamp property; pageIndex must equal 0. |
| Present undefined/null/unknown/array/accessor/inherited consumed field | Invalid, without truthiness, string conversion or getter invocation. Throwing reflection rejects normally. |

The parser allows nine names but requires **only the original eight**. Canonical
positive pageSize, pageIndex, query identity, ownerEpoch, sourceVersion and revision
are not rewritten. A numeric revision and its string spelling remain different.
Complete is metadata, never a backend permission or an application-provided grant.

Page frames retain `pageIds.length <= stamp.pageSize`. Complete frames may exceed
that dormant canonical query size, without slicing IDs or inventing a virtual size.
The existing dense/simple-array, unique/nonempty string ID, safe-integer/finite
metadata, **100,000 items** and **1,048,576 metadata-character** limits stay intact.
Complete does not bypass reflection/descriptor or shared capture budgets.

`RowMove.pageIds` and `RowReorderFrame.pageIds` keep their names and shapes: they
describe the entire current reorder extent (one displayed page, or all unsliced
current unpaged rows). No separate extent field is added to frame/move containers;
the marker is on the existing stamp, including `operation.origin`.

`sameOrigin` additionally compares normalized extent; all its original identity/page
fields are unchanged. `sameStamp` still adds exact sourceVersion and `Object.is`
revision comparison. Thus a same-owner page↔complete switch is a real origin change,
not an upgrade/retag. Existing high-water/retirement rules need a higher honest app
ownerEpoch to reopen after retirement. A complete operation needs a matching complete
current stamp and strictly newer truthful sourceVersion for terminal acknowledgement;
an omitted/page acknowledgement cannot settle it even with otherwise equal fields.

Accepted transport still waits for authoritative acknowledgement. Indeterminate
`cancel-requested` is not undo. Ack-before-transport, exact token identity and terminal
dispositions remain the unchanged coordinator protocol. There is no row/order/query
mirror, rollback, persistence, transport or inferred acknowledgement based on IDs.

## Genuine admission derivation

After the existing real model/source/authority/app-metadata checks, the helper reads
the authenticated definition's normalized
`definition.native.controllerDefinition.schema.pagination.enabled === false`.
Its actual `definition.native.paginationEnabled` and genuine
`value.view.pagination.enabled` must agree. Mismatch denies. Only that disabled
policy adds `{ extent: "complete" }`; an enabled view retains omitted page extent.

The existing exact native rows supply **all** IDs; query pageIndex/pageSize remain
canonical (11 unsliced rows can coexist with pageIndex0/defaultSize10). Existing
before/after member/source/eligibility/model/fence checks and failObservation remain
unchanged. Empty-ID reconciliation uses this same capture path, never a fabricated
`require({ type: "reorder", ids: [] })` permission.

`readCurrent()` stays the original four-field atomic APPLICATION metadata port:
`{ ownerEpoch, sourceVersion, revision, baseRevision }`. No extent/model/page-ID/
allow field or method was added. Integers are not derived from P epochs, C revision,
opaque versions or instanceId. The genuine committed-model layout workflow and
actual D-created C identity are unchanged.

Source mode alone is not policy. Full client records with pagination enabled yield
page extent. Disabled `server-complete` uses actual bound complete resource execution
and complete extent. The current protected producers explicitly reject paginated
`server-complete` (`presentation/project.ts:186–190`, criteria-frame/native equivalents).
The new fixture preserves that as denial, rather than inventing a genuine allowing
model or broadening a protected source mode. If a future producer can legitimately
page a complete remote dataset, this helper's enabled-policy branch remains page.

## Authored fixtures — none executed

- `protocol.ts`/`protocol.test.ts` use legitimate synthetic application metadata
  ports with the **actual** `createRowMoveCoordinator`, not fake criteria/frame grants.
  Cases cover legacy own keys/snapshot/wire shape; explicit page normalization;
  paged oversize denial; complete11/default10 begin; nonzero complete pageIndex;
  every old origin/stamp field; same-owner extent change and fresh higher-owner
  reopening; omitted/page/forged-token ack denial; strictly newer complete ack;
  accepted/indeterminate/cancel-requested; ack-before-response terminal dispositions;
  changed same-stamp IDs; malformed extent, own getter/inherited metadata, throwing
  proxy reflection, sparse/accessor/duplicate/empty IDs, count100000 positive move,
  count100001 rejection, exact/overflow character budget and integer/revision limits.
- `application.ts`/`harness.tsx`/`browser.spec.ts` use the read-only actual admission
  application-owner fixture, real factory C/P, resource request/snapshot bindings,
  actual `useDataTable`/native/controls frames and actual layout commit. They author
  disabled-client11, disabled-server-complete11, paged-full-client10 and unsupported
  paginated-server-complete denial. Actual native IDs are compared to wire IDs;
  canonical query fields, four app metadata keys and exact C identity are checked.
  A real app source/order publication precedes acknowledgement, not a fake source
  permission. Browser port6562 is reserved in code only; no server was started.
- `types.ts` includes the unchanged helper four-field metadata type and source APIs;
  `types.pure.ts` has a separate ES2022-only/no-DOM/no-React source program.
  `negative/types.ts` authors explicit-undefined/null/unknown extent and application
  extent-field type rejections, excluded from positive compilation and not run.

The original admission browser assertion is still unskipped and unmodified. These
authored cases and passing types do not establish their runtime outcomes. Existing
helper lifecycle/ref/pager/Strict/Suspense/SSR limitations remain separate; no fixes
to that held producer were permitted by this lease.

## Preservation and actual LIGHT evidence

Before any source edit, `scope.mjs before` verified all149 canonical source hashes
and modes against `/tmp/opencode/wp10-after-held-admission-source149.json`, file
digest `c49ff0b5a5ffae020fbdef637a037fcd5ccf038b5831a9a62fa81876469f6689`.
It exclusively created `before.json` (1,481 existing inputs) and the three exact
byte preimages in `preimages/`. They have not been replaced/reformatted/rebaselined.

LIGHT history:

1. `light-001`: positive source TS6 passed; original full-input scope failed because
   main-owned bookkeeping changed concurrently. Full raw diagnostics remain saved.
2. `light-002`: positive/scope/static/syntax passed, full scoped Biome reported
   formatting failures. The raw log remains. A formatter-only stdin reference was
   saved; edits were applied with patch, not by rewriting old inputs.
3. `light-003`: all then-authored authorized checks passed.
4. **`light-004`: final authorized checks passed**, after adding the standalone pure
   source program and the count100000 positive-move assertion.

Exact successful command:

```sh
node tests/reordering/unpaged-extent/light.mjs light-004
```

Raw command/status list and logs are under `.artifacts/light-004/`. The checks are:
installed TypeScript **6.0.3** positive/noEmit current-source program (actual root
aliases, old admission positive fixtures, new sources/tests), separate ES2022-only
pure/no-DOM/no-React positive/noEmit program, syntax-only Node checks, static AST/text
inspection, and FULL scoped Biome **2.6.8** formatter/lint on **22 files**, assist off,
no fixes applied. Immutable
maps/preimages, HTML, Markdown and artifact logs are not claimed formatter-checked.

Current scope verifies all146 unleased production hashes/modes and **1,362
non-bookkeeping old inputs**, including old fixtures/seals/maps/reorder light logs.
It keeps the original complete before-map and separately lists external main-owned
docs/TASKS/REVIEW differences rather than re-signing history. At light-004 these are
`TASKS.md`, `docs/planning/wp-10-implementation-plan.md`, and new
`docs/planning/wp-10-deferred-verification.md`; exact before/current hashes are in
`scope.log`. This worker edited none of them. The first full-input failure is not
claimed to have passed or erased; no claim that every bookkeeping file is unchanged.
All other frozen inputs and three saved preimages match. No production file outside
the explicit three-source lease changed.

`handoff-hashes.json` is a **separate U1 delta/input map**, with the three original
and current source hashes/modes, three-source aggregate and own-input aggregate.
The aggregate algorithms are in `measure.mjs`; README/map-self/raw artifacts are
excluded to avoid self-hashing, while before-map/preimages are included. Exclusive
`measure.mjs seal` never overwrites an existing map; measurement is not review or
approval. Original f0b483… pure and db7eee…/5185a9… held-helper seals remain untouched.

Recorded U1 hashes (non-executable modes preserved):

| Changed source | Current SHA-256 |
| --- | --- |
| `reordering/types.ts` | `a51239c08202c6d91eaeac3597915e78d85160b9179f80227bfb2ee6fe155ec6` |
| `reordering/capture.ts` | `f9127926064172280c259ce6565528bebe37f64dbbe91ceb20841234c983f6cb` |
| `reordering-controller/admission.ts` | `33539213c112b5ccf99bf62cb515aeb759925281e3f42863bf97576b47e135ac` |

Three-source aggregate:
`6a1a919bcc4bf9a7c181cf2cfaad5fdf984d4038a45b2fafcdb5e5b8664cd56c`.
24 own inputs:
`04dffdd181f76b99ca5bf03145b3bcd868741aa3858aa43cde52ffd84aff040f`.

## Historical replay versus current source — final phase only

Do **not** run old hardcoded-f0b/core-entry or all149-unchanged admission scope guards
against these intentionally corrected bodies, then edit their expected hashes to
get green. Replay those exact producers/guards at their preserved historical stages
(pure/entry848c94b; original held-admissione9d1721). The U1 current lane is this new
three-delta/146-source/old-file scope, not a rewrite of a previous seal.

After main explicitly activates the final verification phase:

```sh
node node_modules/vitest/vitest.mjs run --config tests/reordering/unpaged-extent/vitest.config.mjs
node node_modules/@playwright/test/cli.js test --config tests/reordering/unpaged-extent/playwright.config.ts
node node_modules/@playwright/test/cli.js test --config tests/reordering/admission/playwright.config.ts
node node_modules/typescript/bin/tsc -p tests/reordering/unpaged-extent/negative/tsconfig.json --pretty false
```

Negative compilation must produce the intended diagnostics, not be called a positive
pass. The old 11-row assertion requires genuine runtime verification, not a type pass.
Source aliases do not prove installed exports; ordinary-entry/dual/emitted/packed
programs need separate current-lane allocation with actual built/packed dependencies.
No such build/install/check ran. No runtime units, React/browser/server, SSR, cycle,
golden, negative, dual, emitted, archive, CI or independent suite was executed.
No agents, dependency install, network/backend action, `.repo`/credential access,
Git operation, PR/merge or deployment occurred. Main must preserve this handoff,
then intake isolated prerequisites in dependency order and keep review19n1 open
until its actual runtime/independent evidence exists.
