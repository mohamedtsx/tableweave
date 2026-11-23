# Source manifest and reconciliation

Acquired **2026-11-23** for TASK-001 through the Notion connector, read-only.
Authority: current user instructions → Notion PRD product intent → HLD technical/
design baseline ready for review. Focused local owners are maintained normalized
representations, not verbatim exports or implementation evidence.

## Supplied page inventory

| Source | Page ID | Returned last edited (UTC) | Returned status |
| --- | --- | --- | --- |
| [PRD](https://app.notion.com/p/mohamedtsx/Tableweave-PRD-42061b5e62648054aa06dcb0ed4ba0c8) | `42061b5e-6264-8054-aa06-dcb0ed4ba0c8` | `2026-11-22T22:38:48.389Z` | Completed v1.0 requirements baseline; verification unverified |
| [HLD](https://app.notion.com/p/mohamedtsx/Tableweave-HLD-42061b5e626480e3a52acda4a3c00527) | `42061b5e-6264-80e3-a52a-cda4a3c00527` | `2026-11-22T23:37:40.746Z` | Completed HLD v1.0, ready for review; verification unverified |

Both returned full opening/closing page/content delimiters. `truncated`,
`unknown_block_count` and `unknown_block_ids` were **not reported**, not explicit
zeroes. The PRD has 17 numbered sections, HLD 21; returned content contains no
linked child specification requiring another fetch. External vendor/prototype
links and HLD ancestor navigation are references, not an extra requirements tree.
No additional workspace pages or Notion memory were needed; nothing was written
to Notion.

Source dates state preparation/completion on 2026-11-23 while returned edit times
are the UTC instants above. Retain both facts rather than rewriting metadata.
PRD's “HLD next” phase is historical sequencing; supplied HLD now exists but its
review/feasibility gates are not complete. [Open items](../../product/open-questions.md)
records the disposition; no substantive requirements contradiction was found.

## Acquired-content fingerprints

SHA-256 over exact UTF-8 returned enhanced-Markdown **between** `<content>` and
`</content>`, excluding delimiter lines and their adjacent newlines:

| Source | SHA-256 |
| --- | --- |
| PRD | `64be5acae901090fe9356f95c36ac2ff92b2e89e5d55dba889d8b1b57f461092` |
| HLD | `a0da8e19639b779d0d0f611bb0b49cb4eb1c4ce3e363c9cf9697c9fd9aeb0672` |

These identify this intake, not provider attestation or content-hash equivalence
to normalized local files. Raw connector output was reviewed as transient intake;
it is not committed as a competing canonical snapshot. Future reconciliation
fetches sources again, records new metadata/fingerprints and compares meaning,
including tables/prose, not just counts.

## PRD section coverage

| Source section | Focused local owner |
| --- | --- |
| 1 Executive summary | [Overview](../../product/overview.md#promise-and-evidence) |
| 2 Problem/evidence | [Overview](../../product/overview.md#promise-and-evidence) |
| 3 Users/jobs | [Overview](../../product/overview.md#users-and-jobs) |
| 4 Goals/non-goals | [Overview](../../product/overview.md#goals-and-principles), [exclusions](../../product/overview.md#scope-and-exclusions) |
| 5 Principles | [Overview](../../product/overview.md#goals-and-principles) |
| 6 D-01–D-40/design-API status | [Decisions](../../product/decisions.md), [open items](../../product/open-questions.md) |
| 7 Scope/FR-01–FR-16/vocabulary/operators | [Features](../../product/features.md), [operators](../../product/operators.md) |
| 8 Cross-feature behavior/client-server | [Shared rules](../../product/shared-rules.md) |
| 9 State/recovery/precedence | [Recovery](../../product/recovery.md) |
| 10 NFRs | [Quality](../../product/quality.md) |
| 11 Open-source DX | [Release gates](../../product/release-gates.md#required-developer-experience), [release operations](../operations/releasing.md) |
| 12 Success/validation measures | [Release gates](../../product/release-gates.md), [overview](../../product/overview.md#milestones-and-success) |
| 13 Risks/mitigations | [Overview](../../product/overview.md#risks-and-mitigations) |
| 14 Closed O-01–O-12/engineering handoff | [Decisions](../../product/decisions.md), [open items](../../product/open-questions.md) |
| 15 Milestones/HLD handoff | [Overview](../../product/overview.md#milestones-and-success), [delivery plan](../planning/delivery-plan.md) |
| 16 References | [Research](research.md), [exact visual links](../design/handoff.md#authority-and-exact-references) |
| 17 Research/candidates/reference selection observations/stack alignment | [Research](research.md), [Gamila assessment](gamila-assessment.md) |

## HLD section coverage

| Source section | Focused local owner |
| --- | --- |
| 1 Summary/invariants | [Architecture](../engineering/architecture.md), [shared rules](../../product/shared-rules.md) |
| 2 Packages/layout | [Architecture](../engineering/architecture.md) |
| 3 Dependencies/compatibility | [Stack](../engineering/stack.md) |
| 4 Definitions/schema/API | [Public API](../engineering/public-api.md) |
| 5 State/transitions | [State/query](../engineering/state-and-query.md) |
| 6 Query/operators/native pipeline | [State/query](../engineering/state-and-query.md), [operators](../../product/operators.md) |
| 7 Start/Query/server/SSR | [Integrations](../engineering/integrations.md) |
| 8 Resources/retention/recovery | [Resources](../engineering/resources.md) |
| 9 Rendering/selection/details | [Rendering](../engineering/rendering.md) |
| 10 Reordering/columns | [Reordering](../engineering/reordering.md) |
| 11 Security | [Security](../engineering/security.md) |
| 12 Benchmarks | [Performance](../engineering/performance.md) |
| 13 Tests/stories/package/release | [Testing](../testing/README.md), [Storybook](../design/storybook.md), [operations](../operations/releasing.md) |
| 14 ADR-01–ADR-10/G-01–G-05 | [ADRs](../adr/README.md), [feasibility](../engineering/feasibility.md) |
| 15 FR mapping | [Traceability](../../product/traceability.md) |
| 16 Reference/authority map | [Design handoff](../design/handoff.md#authority-and-exact-references) |
| 17 Anatomy/configurations/responsive | [Design handoff](../design/handoff.md#anatomy-and-configuration) |
| 18 Components/frames F-01–F-22 | [Design handoff](../design/handoff.md#file-structure-and-component-sets), [scenes](../design/handoff.md#required-review-scenes) |
| 19 Flows/copy | [Design handoff](../design/handoff.md#flows-copy-and-handoff-acceptance) |
| 20 Design-to-engineering acceptance | [Design handoff](../design/handoff.md#flows-copy-and-handoff-acceptance) |
| 21 Sources/limitations/historical doc validation | This manifest, [research](research.md) and local [evidence](../evidence/README.md) |

## Inventory and validation limits

Source inventories: **16 FR**, **40 D**, **10 ADR**, **5 G**, **22 F**. Closed
O-01–O-12 are completion statements. Locally derived AC-01–AC-29 and WP-00–WP-15
are explicitly new planning/verification identifiers, not source requirements.
The checker validates these baseline inventories and links, not natural-language
equivalence. Independent manual review includes unnumbered constraints/defaults/
exclusions/null/date/reset/privacy/recovery and release measures.

HLD §21 reports earlier authoring checks of 9 Mermaid diagrams and 13 TS/TSX
snippets (Mermaid 11.17.2 / TypeScript 6.0.3). That is **historical source-reported
syntax validation**, not a check executed or inherited as a package pass here.
Local documentation deliberately uses prose/text diagrams and contract sketches,
not a frozen copy of every illustrative snippet. No Figma, code installation,
typechecked implementation, benchmark or real-consumer acceptance follows.
