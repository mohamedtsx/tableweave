# WP-04 private native/collection producer

Agent-approved under delegated authority for the tested WP-04/G-01 boundary,
not personal maintainer acceptance, a complete table facade or public release.
[TASKS](../../TASKS.md) owns live progress;
[review findings](../../REVIEW.md#wp-04--delegated-agent-review-session-1) and
[evidence](../evidence/wp-04-native-2026-11-24.md) own actual corrections/checks.
WP-02/WP-03 remain accepted; their broader contracts are not retroactively passed
by adding a native producer.

## Actual native entry

The `@tableweave/react` root exports `defineNativeTable`,
`createNativeColumnHelper`, `createNativeController`, `useNativeTable` and
`NativeBridgeError`, plus typed definition/input/model/view/handle contracts.
No extra export subpath, fetching, resource/table facade, automatic persistence
or backend authorization is implied. `/contracts` and `/filters` stay React-free.

The [native producer handoff](../../packages/react/src/tanstack/README.md) owns
exact construction/type examples and restrictions. Immutable explicit-ID native
column trees derive controller presentation policies; schema sorting remains an
allowlist. Computed/aliased filtering requires explicit field accessors rather
than silently inventing native row indexes. A single hidden accessor carrier
holds the accepted composite evaluator in the actual v9 filtering model.

Client input is the complete local dataset. Server input is the actual supplied
page with known total or explicit unknown hasNextPage; filtering/sorting/paging
are all manual for that page. Selection IDs remain separate from loaded rows.
Current model/metadata props accompany state subscriptions so data-only updates
cannot rely on a state-only snapshot notification.

The narrow native handle exposes supported reads/subscriptions and per-slice
controller-routed setters; it omits whole-table resets, setOptions, base-atom
writes and derived global-filter mutation. Vendor models retain internal table
references; unsupported internal mutations are not an authorization boundary.
The candidate now constructs isolated actual-core render frames and publishes
supported handle/subscription reads only during commit. Suspended/abandoned
inputs cannot overwrite committed model references. Captured pagers read current
committed metadata, while native sort/visibility/selection toggles derive intents
from the latest accepted controller. Independent rereview and integrated proof
are recorded in the evidence. Frame reconstruction is not a reference-performance claim.

`createNativeController` requires the exact native definition and composes its
capability guard through the coordinator's optional pure synchronous validateState
port before initialization/proposals/final acceptance. It does not wrap dispatch/
accept with different semantics. A plain arbitrary WP-03 controller cannot prove
the shared registry/guard and is not attachable to this bridge.

## Collection boundary

The [isolated collection handoff](../../tests/native/collection/README.md) records
actual HeroUI3.2.8/Aria grouped DOM proof and the uneven-depth placeholder defect.
Public collection branches plus explicit padding avoid invalid nested row-group
markup and preserve HeroUI leaf/cell semantics. Padding headers must not receive
keyboard focus. This adapter does not filter/sort/page records or own accepted
selection/sorting; page selection preserves off-page IDs, while only the primary
sort has directional aria-sort and all priorities have text equivalents.

Static controlled-page browser evidence does not prove the native integration.
The styled root now exposes the bounded candidate `NativeCollection` and genuine
own/native-typed props; it requires the current view, meaningful text equivalents
and a visible row-header field. Its real native projection, strict declarations
and actual tarball consumers passed the recorded checks. It is not a final DataTable,
feature tools, details shell, virtualized collection or sortable API. Resource
freshness/action guards remain the separate application/resource integration.

## Vendor declaration compatibility

The [bounded repair](../planning/wp-04-implementation-plan.md#compatibility-repair-disposition--2026-11-24)
and [ADR-07 disposition](../adr/README.md#wp-04-adr-07-compatibility-disposition)
retain runtime versions and strict checks. A reproducible exact RAC declaration
patch removes contradictory HTML attribute inheritance; the HeroUI build alone
uses ESNext/Bundler resolution for vendor declaration paths. Tableweave's public
types must be isolated genuine own props and compile in **unpatched NodeNext**
tarball consumers under both tested TypeScript versions. Root pnpm patches do
not propagate to a downstream app importing raw vendor components.

These are private engineering choices under delegated agent authority, not
personal maintainer acceptance, a complete browser/manual-AT matrix, framework
SSR isolation, resource-race proof, performance, real-consumer or release approval.
