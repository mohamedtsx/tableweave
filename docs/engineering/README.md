# Engineering contracts

These are focused local representations of HLD v1.0, **completed for review**.
Most APIs remain proposed. The [private WP-02 contract](wp-02-contracts.md) records
the implemented schema/operator subset; TASKS owns its review disposition. No full
compatibility or feasibility gate is passed by those pure contracts. Requirements
take precedence over implementation shortcuts.

| Boundary | Owner | HLD source |
| --- | --- | --- |
| Package responsibilities/import direction/layout | [Architecture](architecture.md) | §§1–2 |
| Dependencies/toolchain/browser policy | [Stack](stack.md) | §3 |
| Schema, definitions, sources, controller surface | [Public API](public-api.md) | §4 |
| Implemented private schema/query/operator subset | [WP-02 contracts](wp-02-contracts.md) | §§4–6, TASK-006 |
| Controlled groups, transitions, query/operators/TanStack | [State and query](state-and-query.md) | §§5–6 |
| Start/Query/SSR/backend ports | [Integrations](integrations.md) | §7 |
| Resources/provenance/stale retention/recovery | [Resources](resources.md) | §8 |
| HeroUI table, selection, custom details | [Rendering](rendering.md) | §9 |
| Row/column sortable/visibility contracts | [Reordering](reordering.md) | §10 |
| Validation/privacy/scope isolation | [Security](security.md) | §11 |
| Fixed benchmark workloads/protocol | [Performance](performance.md) | §12 |
| Verification and release | [Testing](../testing/README.md), [releasing](../operations/releasing.md) | §13 |
| Rationale and executable proof gates | [ADR register](../adr/README.md), [feasibility](feasibility.md) | §14 |
| Requirement/design mapping | [Traceability](../../product/traceability.md), [design handoff](../design/handoff.md) | §§15–20 |
| Provenance and historical validation limits | [Source manifest](../reference/source-manifest.md) | §21 |

The [work packets](../planning/work-packets.md) assign bounded outputs and tests,
not implementation permission. Update contracts when evidence changes a design;
changes to product behavior require explicit product review against FR/D IDs.
