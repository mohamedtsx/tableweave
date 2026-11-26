# WP-09 renderer committed ports — provisional shared lease

TASK-017 / FR-01/04/13/16, AC-16/25. Main selects the private shell-commit report's
single extracted F3 core and separate renderer port owner after reading actual P2,
F3 and Search/Tabs host. Date owns separate isolated paths; its F3 API stays frozen.
No actual DataTable/selection/details UI yet. Final verification remains deferred.

## Scope

One shared writer owns existing filters/criteria-commit.tsx, new
filters/criteria-commit-core.ts and new table/{types,renderer-commit}.ts, plus new
tests/table-renderer-commit/**. All F1/P2/F2/F3a/host/Date/Search/Tabs/selection/
details/locale/styles/exports/config/manifests/lock/old tests/docs/Git freeze.
Main owns source exports/docs/intake. No dependency/build or public actor API.

## Single core, unchanged tool contract

Extract actual F3 participant/lease/actor/local/work machinery into one private
generic library core. Existing createCriteriaCommitCell remains an exact tool
specialization with the same types/behavior. Actual proof/typed F3a capture remain
library-owned adapters, not caller permission/reset ports. Core is not a public
registration/grant factory. Both wrappers use real P-issued registration, exact
origin ownership, safe candidate linearization, purge debt, stale cleanup and finite
local/work mechanics. No second cell engine or app callbacks during purge/cleanup.

## Renderer owner and metadata

Create a typed renderer cell from an actual issued DataTableModel, authenticated by
getDataTableModelOwner before traversal. Initial/uncommitted establishes inert
provenance only; requireDataTableModel plus genuine source authority passes before
config commit/participant registration. Pin D/C/actual-CD/frame owner/P/source mode
on first successful config commit. Source-only readiness owns state/Retry ports,
not frame/tool/row permission. Unknown/copied/proxied model/capabilities deny early.

Separate updateModel(lease,actualModel) from commit(lease,actualModel,opaqueConfig).
Metadata-only update does not retire A's callback revision or owned form state and
reads no candidate app config. Preserve continuity across same-domain query/frame/
selection/refresh updates. Each private callback freshly requires the current model,
origin and role, never stale model A just because ports A remain committed. Source/
P loss denies immediately. No fake model or structural allowing boolean.

## Typed ports

New table/types.ts defines internal renderer config/contexts/state messages against
actual headless model/Recovery and NativeCollection/SelectionAction/message ports.
Preserve S/T inference and actual rowTextValue/columnTextValue/cellTextValue types.
Include label/row-header/selection IDs, renderToolbar/renderState, onRetry, selection
actions/focus/error and message/locale ports. Details is a later accessory, not fake
NativeRow/body data. NativeCollection has no header/cell renderer prop: existing
native definition owns those callbacks; do not silently add one here.

State dictionary strings: uncommitted/unavailable/idle/loading/initialError/offline/
timeout/updating/updateFailed/emptyDataset/noMatches/unknownEmpty/noRecordOnPage/retry.
Compose DataTableMessages/Locale types over actual11-port aggregates; old locale
modules remain untouched. Defaults belong to later shell, not component imports.

Capture consumed own data once after proof with alias/descriptor caches and original
call-site receivers. Guard owned formatter/renderer/action/retry before/after and
after async completion. Actor is immutable, never latest candidate. State/Retry needs
actual source readiness/eligibility; collection/toolbar needs display/tool permission;
selection adds current event-time selection context. Fixed errors contain no raw
payloads. No universal interception of app-internal callbacks/coercion is promised.

Child tool configs are opaque references captured at parent commit, whose private
fields/callbacks belong only to child F3 actors. Never recursively capture/wrap them
with the parent actor. Future host consumes the opaque committed config only at
child commit; no candidate private spread. This lease exposes refs/types, not a new
host protocol. Selection event identity remains a later toolbar seam, not ID equality
or a public permission/reset callback accepted as genuine proof.

## Handoff

Author real F3 regression and renderer source/display/identity/metadata-only update/
candidate A/B/purge/role/Retry/receiver/two-owner/work cases. Only light TS6/syntax/
scoped formatting/scope checks now; runtime/React/browser/SSR/negative/dual/emitted/
packed/independent checks deferred. Date/F3 fixtures still typecheck without edits.
Record APIs/core extraction/unchanged signatures/preimages/protected hashes/light
results/deferred commands. Stop before excluded producer/path changes.

Activation source is e8529b0; written plan/ledger changes are main-owned. Canonical
source122 map0def42f9748a3762d2a4399d3930a8b0afd7b1ff68a86d0ee3473a3b5437e656 is
/tmp/opencode/wp09-before-renderer-commit-source122.json. Initial F3 source hash:
a135a5d1ef6c773bc21fc2233338a695818db8767018b797d0e3f0d9337fb3ff.
Protect other121 sources plus old tests/config/seals; new three-source namespaces
are intentional. Do not rebaseline historical F3/source seals for this extraction.

## Provisional implemented handoff

[Actual S1 handoff](../../tests/table-renderer-commit/README.md) records21 inputs at
5dcf331b9f230f9ff8d67838bcabacb8260aa97a0a83d9025f1389260f7edaf0. Main inspects
actual core/tool/renderer/type APIs, matches all21 hashes/121 protected source hashes
and passes one integrated positive source-fixture TS6 compile. New125-source map:
569e03e65c14411c7b274906e787f3837c457c65f49a92998d8cf28ab28a06ed.
Runtime cycle/golden/tool compatibility/React/negative/independent checks stay
deferred. This is a provisional dependency, not renderer/full-WP09 acceptance.
Main also preserves exactly the two authored immutable golden inputs under the
otherwise-ignored .artifacts directory: original-criteria-commit.tsx and its
criteria-ports.ts dependency shim. The golden source imports them directly, so a
fresh checkout needs those bytes; no generated evidence/log/cache tree is staged.
