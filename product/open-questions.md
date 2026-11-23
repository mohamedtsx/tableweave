# Open items and source dispositions

As captured on 2026-11-23, **the PRD baseline has no unresolved product-scope
decisions**. Do not reopen O-01–O-12 or invent policy merely because engineering
proof is absent. [Source metadata](../docs/reference/source-manifest.md) is not
an independent approval attestation.

## Source reconciliation

| Item | Disposition | Impact |
| --- | --- | --- |
| PRD phase text says HLD is next; supplied HLD now exists | Chronological progression, not a product contradiction. Preserve PRD completion and HLD ready-for-review status separately. | Proceed with documentation; do not claim technical approval/execution. |
| HLD describes completed architecture and also proposed APIs/unexecuted gates | Design completeness is distinct from feasibility/API freeze. | G-01–G-05 and baseline review remain. |
| Notion verification says unverified; truncation/unknown-block counters absent | Report as returned, not zero/verified. Both pages have closing content/page delimiters. | Local semantic/structural review is scoped to returned content. |

No substantive PRD/HLD requirement contradiction was identified in the returned
content. If one appears, add a stable Q-ID with both exact passages/source URLs,
affected local owners/FR/D IDs, decision owner and blocked work only. Do not
silently reconcile by weakening the PRD.

## Engineering proof, not open product policy

| Input/proof | Owner role | Exit |
| --- | --- | --- |
| HLD baseline review and first implementation authorization | Maintainer/coordinator | TASK-002 review disposition and bounded authorized task |
| Exact compatible dependency/peer/TypeScript set | Core/package worker | G-01/G-05 evidence, real lockfile/packed consumers |
| TanStack v9/React Aria composition and reactive subscriptions | Core/UI workers | G-01 |
| Sortable version/controlled DOM/focus compatibility | Reordering worker | G-02; revise adapter if needed, not product rules |
| Resource races/retention/access loss | Resource worker | G-03 |
| Start SSR/request isolation/timezone hydration | Integration worker | G-04 |
| Benchmarks, browser/manual accessibility, full accepted matrix | Verification workers | G-05 plus complete stable gates |
| Approved visual system | Designer/engineer | F-01–F-22 review against FRs, not prototype fidelity |
| Real-consumer target and access | Maintainer/integration worker | Separately authorized target and acceptance evidence |

## Publication inputs

Npm scope/package ownership and trusted-publisher identity; brand/domain checks;
copyright attribution/rightsholder for the actual MIT notice; third-party license
review; security/conduct private reporting channel; release operator, exact peers,
tested browser versions and rollback policy. None is currently claimed available.
See [operations](../docs/operations/releasing.md).

These inputs block the relevant release/operation, not unrelated documentation
or safe authorized development. No new environment approval flags or external
services are required just to start writing the library.
