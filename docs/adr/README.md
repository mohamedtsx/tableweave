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
