# Architecture decision register

Source: HLD §14. These ten decisions are selected **in the HLD ready for review**,
not independently approved/validated by this documentation task. Current
contracts live in engineering owners; this register owns rationale, not duplicate
implementation policy. Feasibility can revise a decision explicitly, never the
PRD silently.

| ID | Decision | Rationale / consequence | Contract |
| --- | --- | --- | --- |
| ADR-01 | Two npm packages, server-safe/optional UI subpaths | Headless avoids UI/styles/router/network; boundaries testable | [Architecture](../engineering/architecture.md) |
| ADR-02 | Serializable shared schema + native rendering definition | Shared IDs/ownership/operators/sort; callbacks stay local | [Public API](../engineering/public-api.md) |
| ADR-03 | One coordinator, controlled groups, native per-slice bridge | Atomic query/page/selection without competing state | [State/query](../engineering/state-and-query.md) |
| ADR-04 | One compiled composite predicate in native pipeline | Correct cross-field Any/same-field rules, not accidental AND | [State/query](../engineering/state-and-query.md#composite-filtering-in-the-native-pipeline) |
| ADR-05 | Small flat builder with registry extensions | Fits scope/commit UX without adopting a larger editor's public shape | [Operators](../../product/operators.md) |
| ADR-06 | Scope/query-tagged retained presentation buffer | Correct refresh-error/previous-results, not another fetch cache | [Resources](../engineering/resources.md) |
| ADR-07 | Controlled HeroUI/Aria table and customizable Drawer | Reuse primitives while preserving TanStack/app ownership | [Rendering](../engineering/rendering.md) |
| ADR-08 | Isolated new dnd-kit adapter, controlled previews, no competing drag manager | Unified inputs; must prove collection compatibility in G-02 | [Reordering](../engineering/reordering.md) |
| ADR-09 | Start + Query primary, optional to runtime | Consumer-stack alignment with React portability | [Integrations](../engineering/integrations.md) |
| ADR-10 | No virtualization/cursor/automatic persistence/Export in required v1 | Prevent adjacent/reference features becoming commitments | [Overview](../../product/overview.md#scope-and-exclusions) |

For a new/revised consequential decision, use the [ADR template](../templates/adr.md),
record source/FR/D IDs, alternatives, evidence/risks, review disposition and
supersession. Update the owning contract and affected acceptance/packets. Do not
mark a decision “accepted” merely because an agent wrote it.

## WP-02 implementation disposition

Maintainer explicitly approved the bounded plan and internal Valibot `1.5.0` /
Internationalized Date `3.12.4` additions in TASK-006. This realizes ADR-02/ADR-05
without replacing the serializable-descriptor/native-definition split or adding
a row-processing engine. Vendor schemas stay internal; native bridging, controller
and React/UI APIs remain proposed. Concrete wire/date/key choices and their risks
are recorded in the [private producer contract](../engineering/wp-02-contracts.md),
subject to packet review. No G-gate/publication disposition changes.

## WP-03 implementation disposition

TASK-009 realizes ADR-03's atomic controlled groups with a complete proposal and
explicit whole-transaction acknowledgement. Uncontrolled consequences do not
commit while a controlled group waits. Only controlled selection may explicitly
override a proposed clear. Stable snapshots use React's existing subscription
primitive, not a second store. The [implemented protocol](../engineering/wp-03-controller.md)
records reentrancy/error/time/definition trade-offs. The maintainer accepted WP-03
after session 1 n1–n2 corrections. No native bridge, UI, resource or G-gate
acceptance follows, and dependent execution remains separately authorized.

## WP-04 ADR-07 compatibility disposition

**2026-11-24; delegated agent engineering decision, verification pending.**
TASK-012's actual grouped collection probe preserves HeroUI/Aria ownership but
exposes current stable upstream declaration defects. Downgrading, nightlies,
skipLibCheck, disabling exact optional checks, broad declaration shims and
reimplementing HeroUI are rejected as wider or weaker alternatives.

The [bounded repair plan](../planning/wp-04-implementation-plan.md#compatibility-repair-disposition--2026-11-24)
selects an exact declaration-only RAC 1.22.1 pnpm patch and HeroUI-only Bundler
build resolution. Authoritative Aria property definitions remain; runtime source
and product requirements do not change. Direct Aria renderer peers are explicit.
Independent unpatched NodeNext public tarball consumers must still pass TS5.9/6.
This supports Tableweave's isolated public declarations, **not** a claim that raw
HeroUI/RAC imports support every strict NodeNext setting. Remove the patch when a
matching stable upstream release passes the same strict/property/runtime/packed
checks; review that version change and regenerate the lockfile deliberately.

WP-04 n1 additionally requires commit-safe candidate native models instead of a
render-mutated persistent native handle. ADR-03/04 remain one coordinator/one
TanStack engine; exact core9.3.1 public store bindings are a declared runtime
dependency matching React Table9.3.1, not an undeclared transitive import. The
[correction plan](../planning/wp-04-implementation-plan.md#native-commit-boundary-correction--2026-11-24)
and suspended-render/native-action/browser evidence must demonstrate the boundary
before approval. No extra application store, filtering engine or scope waiver.

## WP-06 ADR-07 Vite integration compatibility disposition

**2026-11-24; delegated engineering decision, verification pending.** Installed
Start declarations omit a required internal algorithm alias and two declaring-
package dependency edges, and unnecessarily reach all optional bundler types
through Router's barrel. The [bounded repair](../planning/wp-06-implementation-plan.md#strict-vite-declaration-repair-disposition--2026-11-24)
restores exact source types and selects the genuine public Vite type entry without
changing runtime versions/bytes or strict flags. Alternate-bundler installation,
unplugin overrides, ambient-any modules and hiding config checks are rejected.
Independent strict app/config and real packed Start evidence remain mandatory.
Only the Vite profile is covered; upstream and release/legal review are separate.

## WP-07 ADR-07 calendar declaration disposition

**2026-11-24; delegated engineering choice, source verification completed.** Scoped vendor
calendars unnecessarily reach the entire HeroUI3.2.8 declaration barrel through
CalendarYearPicker type references. The
[bounded repair](../planning/wp-07-implementation-plan.md#calendar-declaration-repair-disposition--2026-11-24)
uses the genuine scoped entry for the same types, leaving runtime bytes, versions
and strict flags unchanged. No raw-barrel TS6 claim, type erasure or generic
interface rewrite follows. The same issue affects ListBox's scoped entry: three
declaration-only files differ, with all528 upstream runtime/license bytes otherwise
matching. Both strict compiler versions, public/actual-packed/browser and frozen
installation checks now pass; final combined-stack delivery remains separate.

## WP-08 ADR-07 temporary runtime compatibility direction

**User-selected direction; verification and delivery pending.** The maintainer
explicitly chooses an application-side temporary patch for private/prerelease
delivery, conditional on independent review and genuine packed-consumer tests.
This extends neither WP-04's declaration-only approval nor ordinary unpatched
runtime support by implication. FR-01/06/15 and the grouped/controlled/lifetime
acceptance remain intact; no product behavior is removed to fit the dependency.

RAC1.22.1's grouped table clone copies a clean header cache without its dirty flag,
causing plain StrictMode and genuine native empty/populated failures. The registry
[current release](https://registry.npmjs.org/react-aria-components/latest) remains
1.22.1; inspected earlier stable releases share the omission. A private minimal
copy of the actual boolean preserves clean and dirty states and passes tested
current NativeCollection same-group order/visibility/current-record/Strict paths.
The [bounded experiments and construction plan](../planning/wp-08-implementation-plan.md#candidate-clone-only-profile-construction-allocation)
record causal evidence and limits; independent repair review is still required.

The proposed profile retains compound HeroUI/Aria presentation and the one native
processing owner. Documented dynamic header/cache APIs were tested privately but
retained both Strict failures. A wider public-hooks renderer is not selected.
A second vendor traversal defect affects an additional raw cached-Collection
probe; its broader repair is excluded because it is not shown necessary for this
tested public Tableweave contract. Neither custom vendor structures nor hot native
definition replacement become supported APIs through the profile.

Any eventual profile must ship explicit assets, exact byte verification and
application-owned pre-install registration; no automatic mutation or fake enabled
flag. Root patches do not propagate through archives. Keep actual unpatched public
declaration consumers separate from profiled runtime production tests, and retain
negative unpatched behavior and removal criteria. Headless remains unaffected.
Candidate construction alone approves no registration, install or package shipping.
Stable/full G-05, third-party legal/publication, manual/device/performance and
personal PR review remain separate; all PRs stay unmerged.

## WP-10 ADR-08 operation lifecycle elaboration

TASK-018, FR-02/03/06, AC-12/13/21. Main preserves the previously approved bounded
pure producer as isolated7c98628/intakea7b8627; five source hashes still match its
recorded identity. Historical source approval is not current adapter/G-02 proof.
The [actual lifecycle](../engineering/reordering.md#row-move-contract) separates
backend settlement from authoritative acknowledgement and keeps uncertain cancellation
pending. This replaces only the illustrative HLD `ok` result, retaining application
persistence/revision/authorization ownership, no rollback cache and one row processor.

A pure explicit subpath avoids importing UI/native/drag code for operation metadata.
The next vendor-free authority/ref/interlock and optional adapter stages stay held
until their actual protocols/dependencies are selected. Existing controllers cannot
be assumed retrofitted with pending/queued-proposal guards. New dnd-kit0.5.3 registry
metadata remains a candidate, not installed/API/DOM-identity evidence. No product
constraint, optional-entry isolation, manual/real-consumer gate or final-phase
verification/approval requirement is weakened by this elaboration.

## WP-10 ADR-03/08 command-origin composition selection

Main confirms existing core captures a command once and reuses that exact object
at final acceptance; final state validation and query-first observers are existing
seams. The selected [bounded helper](../planning/wp-10-command-admission-plan.md)
explicitly creates the real C through its actual factory with private command/
proposal/fence composition. This is not a wrapper, retrofit or second accepted-state
store. Pure application validators stay pure; private receipt bookkeeping performs
no command, network or accepted-state mutation. Existing core/native producers and
their acceptance semantics remain unchanged. Callback ordering, reentry, source/
lease purity, stale proposal and cleanup enforcement are unverified implementation
obligations; no runtime/G-02 or independent approval is granted by this selection.

## WP-10 ADR-08 unpaged extent compatibility selection

Held admissione9d1721 exposes a mismatch between canonical dormant pageSize and
the genuine unsliced collection. Main selects [explicit stamp extent](../planning/wp-10-unpaged-extent-plan.md)
instead of slicing/inflating query metadata or excluding required unpaged moves.
Page remains the omission/default with historical output shape; complete is explicit,
bounded and part of origin/authoritative acknowledgement equality. Application
integer epochs/revisions, exact tokens and backend authorization remain separate.
Original pure/held source seals and failures remain intact; correction runtime/
independent verification and whole-packet G-02 approval remain deferred.
