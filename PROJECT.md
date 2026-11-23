# Tableweave project map

Tableweave is a domain-neutral table toolkit for React developers, design-system
teams and application users. TanStack owns row processing; Tableweave coordinates
configuration, state transitions and recovery; optional HeroUI renders the
default experience. Applications keep network, business and persistence ownership.

**Documentation-Driven Development (DDD)** here means requirements → reviewable
contracts → bounded implementation → acceptance evidence. It does not mean
domain-driven design, nor that a specification proves a working feature.

## Current reality

- PRD v1.0: completed requirements baseline, including all FR-01–FR-16.
- HLD v1.0: completed architecture/designer handoff, ready for review; candidate
  APIs/dependencies are not generally frozen. WP-04 records bounded G-01 proof;
  WP-05 separately records bounded G-03 resource proof. Later gates remain separate.
- Local repository: accepted WP-01 foundation/WP-02 schema/operator contracts and
  WP-03 accepted-state controller/React hooks. Synthetic Storybook and
  hook fixtures/checks exist; WP-04 native/collection producer has scoped delegated
  agent G-01 approval, not personal maintainer acceptance.
  WP-05 adds plain resource generation/retention/lifecycle APIs with scoped
  delegated G-03 approval; framework SSR and full UI remain separate. No full
  table facade, published package, Figma system, benchmark or real-consumer
  integration. The [WP-03](docs/engineering/wp-03-controller.md),
  [WP-04](docs/engineering/wp-04-native.md) and [resource](docs/engineering/resources.md)
  contracts distinguish actual private producers from later whole-table work.
- [TASKS.md](TASKS.md) owns live status and current authorization. A planned packet
  never authorizes execution, installs, remote writes or publication.

## Mental model

```text
serializable schema + rendering definition
  → one accepted state/query coordinator
  → local TanStack pipeline OR application-controlled server page
  → scope/query-tagged resource view
  → headless renderer OR HeroUI table
```

Property identity is not a column position. Selected IDs are not loaded records.
Draft input is not an applied rule. Retained rows are not new-query results.
A move intent is not successful persistence. Filter ownership is configured, not
determined by whether a tool currently filters anything.

## Find the owner

| Changing | Read |
| --- | --- |
| Product scope/defaults | [Overview](product/overview.md), [decisions](product/decisions.md) |
| One capability | [Functional requirements](product/features.md), [traceability](product/traceability.md) |
| Operators, nulls, dates, drafts | [Operators](product/operators.md), [query/state contract](docs/engineering/state-and-query.md) |
| Clear/Cancel, selection, filtering/reordering interactions | [Shared rules](product/shared-rules.md) |
| Loading/stale/error/empty or access loss | [Recovery](product/recovery.md), [resources](docs/engineering/resources.md) |
| Packages, dependencies, server-safe imports | [Architecture](docs/engineering/architecture.md), [stack](docs/engineering/stack.md) |
| Start/Query, SSR and server validation | [Integration contract](docs/engineering/integrations.md), [security](docs/engineering/security.md) |
| Table composition/details or accessible reordering | [Rendering](docs/engineering/rendering.md), [reordering](docs/engineering/reordering.md) |
| Visual review or Storybook | [Design handoff](docs/design/handoff.md), [Storybook](docs/design/storybook.md) |
| Next work/dependencies | [Delivery plan](docs/planning/delivery-plan.md), [work packets](docs/planning/work-packets.md) |
| Verification/release | [Testing](docs/testing/README.md), [release gates](product/release-gates.md) |

## Working rhythm

Read only the affected owners and linked dependencies. Claim a task with an
observable outcome and file ownership. Implement only when authorized. Review
failure/race paths, verify the actual boundary, update contracts and record
scoped evidence. Hand back a resumable next action, not an unsupported “done.”

Learn the maintainer's taste from the [three reference sources](docs/reference/README.md#maintainer-taste-and-architecture-sources):
direct feedback, the transactions reference and `.repo/`, the main source of taste
and architecture. Local references stay read-only and are not runtime/build
dependencies. The [Gamila assessment](docs/reference/gamila-assessment.md) records
prior inspection and adaptation limits; consult relevant reference material for
new work rather than assuming that assessment covers its visual implementation.
Nothing needs `.repo/` to run or understand this documentation set.
