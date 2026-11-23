# Requirement traceability

Lookup, not default context. Source FR definitions live once in [features](features.md).
AC IDs are locally derived in [acceptance](acceptance.md); WP IDs are planned
packets, **not execution status**. HLD §15's FR coverage and §§18–20's scenes are
retained here with focused local paths. [TASKS](../TASKS.md) and dated evidence own
actual progress/proof.

| Requirement | Product dependencies | Engineering owner | Acceptance | Design scenes | Work packets |
| --- | --- | --- | --- | --- | --- |
| FR-01 | Overview, shared rules | [Definition](../docs/engineering/public-api.md), [bridge](../docs/engineering/rendering.md) | AC-01, AC-25, AC-26 | F-01, F-02, F-19, F-21 | WP-01–WP-04, WP-11, WP-13 |
| FR-02 | Manual order, application persistence | [Reordering](../docs/engineering/reordering.md) | AC-12, AC-21 | F-12 | WP-10, WP-12 |
| FR-03 | Column/utility/group identity | [Reordering](../docs/engineering/reordering.md#column-order-and-visibility) | AC-13, AC-21 | F-13 | WP-08, WP-10, WP-12 |
| FR-04 | Per-field opt-in/sort reset | [State/query](../docs/engineering/state-and-query.md), [rendering](../docs/engineering/rendering.md) | AC-10, AC-23, AC-24 | F-10 | WP-03, WP-04, WP-08 |
| FR-05 | Arbitrary details/actions | [Rendering](../docs/engineering/rendering.md#arbitrary-details-content) | AC-18–AC-21 | F-18, F-19, F-20 | WP-09, WP-11, WP-12 |
| FR-06 | Required/hidden-field identity | [Reordering](../docs/engineering/reordering.md#column-order-and-visibility) | AC-13, AC-20 | F-11 | WP-04, WP-08 |
| FR-07 | Operators, drafts, ownership | [State/query](../docs/engineering/state-and-query.md), [integration](../docs/engineering/integrations.md) | AC-02–AC-07 | F-03–F-06 | WP-02–WP-04, WP-07 |
| FR-08 | Exclusive owner, counts/selection | [Definition](../docs/engineering/public-api.md), [transitions](../docs/engineering/state-and-query.md) | AC-02, AC-03, AC-10 | F-02, F-09 | WP-02, WP-03, WP-07 |
| FR-09 | Declared fields/OR/debounce | [State/query](../docs/engineering/state-and-query.md), [integration](../docs/engineering/integrations.md) | AC-02, AC-06, AC-15, AC-16 | F-02, F-07–F-09 | WP-03, WP-05–WP-07 |
| FR-10 | Date ownership/bounds/day/clock | [State/query](../docs/engineering/state-and-query.md#operator-registry-and-time) | AC-02, AC-06, AC-22 | F-02, F-04, F-05, F-07 | WP-02, WP-06, WP-07 |
| FR-11 | Builder-only Clear | [Transitions](../docs/engineering/state-and-query.md#transition-contract) | AC-08–AC-10 | F-07 | WP-03, WP-07 |
| FR-12 | Valid page resets/metadata | [Integration](../docs/engineering/integrations.md), [resources](../docs/engineering/resources.md) | AC-15, AC-23, AC-24 | F-17 | WP-03, WP-05, WP-06, WP-08 |
| FR-13 | Recovery/precedence | [Resources](../docs/engineering/resources.md) | AC-07, AC-14–AC-17 | F-06, F-14–F-17, F-22 | WP-05, WP-07, WP-11, WP-12 |
| FR-14 | Headless/customization/localization | [Architecture](../docs/engineering/architecture.md), [rendering](../docs/engineering/rendering.md), [security](../docs/engineering/security.md) | AC-01, AC-04, AC-18, AC-20, AC-26 | F-19, F-20 | WP-02, WP-09, WP-11, WP-13 |
| FR-15 | Stable IDs/toolbar/lifetime/action ownership | [Transitions](../docs/engineering/state-and-query.md), [rendering](../docs/engineering/rendering.md#selection-presentation) | AC-09–AC-11, AC-15, AC-16, AC-25 | F-08, F-09, F-22 | WP-03, WP-05, WP-08, WP-12 |
| FR-16 | Component/state/interaction workbench | [Storybook](../docs/design/storybook.md) | AC-27 | F-01–F-22 | WP-00, WP-01, WP-07–WP-12 |

## Other source inventories

- D-01–D-40: [product decision register](decisions.md); closed O-01–O-12 are
  completion statements, not unresolved policy. [Section coverage](../docs/reference/source-manifest.md#prd-section-coverage)
  also retains unnumbered principles, NFRs, prose constraints and release measures.
- ADR-01–ADR-10: [architecture decisions](../docs/adr/README.md).
- G-01–G-05: [engineering proof gates](../docs/engineering/feasibility.md).
- F-01–F-22: [design scenes](../docs/design/handoff.md#required-review-scenes).
- Nonfunctional/release: [quality](quality.md), [release gates](release-gates.md),
  AC-20–AC-29, WP-11–WP-15.

When requirements change, update source disposition, canonical owner, affected
AC/technical/design contract and packet together. Do not turn a table row into a
claim that implementation or acceptance is complete.
