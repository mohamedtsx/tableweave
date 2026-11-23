# Documentation router

Default context is [agent bootstrap](../AGENTS.md), [project map](../PROJECT.md)
and the active [task handoff](../TASKS.md). Select a product owner before a
technical contract. Load references/evidence only for the question at hand.

| Layer | Owns | Entry |
| --- | --- | --- |
| Product | Intended behavior, defaults, exclusions and acceptance | [Product map](../product/README.md) |
| Engineering | Package, state, processing and integration contracts | [Engineering map](engineering/README.md) |
| Design | Visual/interaction handoff and component workbench | [Design map](design/README.md) |
| Planning | Dependency sequence and bounded work packets | [Delivery plan](planning/delivery-plan.md) |
| Agent work | Roles, ownership, task lifecycle and handoff | [Worker workflow](agents/workflow.md) |
| Testing | Risk-based verification and acceptance methods | [Testing strategy](testing/README.md) |
| Operations | Versioning, packed consumers, publication and rollback | [Releasing](operations/releasing.md) |
| Decisions | HLD decision rationale; subsequent changes | [ADR register](adr/README.md) |
| Reference | Source provenance and adopt/adapt/reject assessments | [Reference map](reference/README.md) |
| Evidence | Dated actual observations and limits | [Evidence conventions](evidence/README.md) |
| Templates | Task, handoff, decision and evidence forms | [Template map](templates/README.md) |

## Small context paths

| Task | Required path | Conditional next |
| --- | --- | --- |
| First implementation task | [Feasibility](engineering/feasibility.md), [WP-01](planning/work-packets.md#wp-01-workspace-and-package-foundation) | Stack, package boundaries, actual dependency docs |
| Builder or Clear bug | [Operators](../product/operators.md), [shared rules](../product/shared-rules.md), [state/query](engineering/state-and-query.md) | AC-02–AC-08, async-options integration |
| Selection count or toolbar reset | FR-15 in [features](../product/features.md#fr-15-row-selection-and-actions), [state/query](engineering/state-and-query.md), [rendering](engineering/rendering.md) | AC-09–AC-11, retained-resource guards |
| Wrong stale rows or retry | [Recovery](../product/recovery.md), [resources](engineering/resources.md) | AC-14–AC-17, Start/Query example |
| Row/column move | [Reordering](engineering/reordering.md), [G-02](engineering/feasibility.md#g-02-sortable-collection-compatibility) | AC-12/AC-13, group/utility and persistence boundaries |
| Drawer or narrow/RTL layout | [Rendering](engineering/rendering.md), [design handoff](design/handoff.md) | F-18–F-20, AC-18–AC-21 |
| SSR or query transport | [Public API](engineering/public-api.md), [integrations](engineering/integrations.md), [security](engineering/security.md) | G-04, AC-22/AC-23 |
| Package/release review | [Stack](engineering/stack.md), [release gates](../product/release-gates.md), [releasing](operations/releasing.md) | G-05, performance protocol |
| Requirement/source update | [Source manifest](reference/source-manifest.md), affected local owner | Traceability, skills and acceptance changes |

## Canonical ownership

Product owns **what must happen**; engineering/design owns **how it is intended
to work**; skills own **repeatable procedures**; TASKS owns **live progress**;
evidence owns **what actually happened**. ADRs explain why. Navigation and plans
link to owners rather than establishing competing policy. Proposed API sketches
are never examples of already implemented exports.
