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
