# Contributing to Tableweave

This repository is in the documentation-foundation stage. There is no installable
library/workspace yet; do not submit instructions claiming existing package APIs
or passing runtime tests. Start with [PROJECT](PROJECT.md), [product map](product/README.md)
and the affected [technical contract](docs/engineering/README.md).

## Propose and claim work

Check [TASKS](TASKS.md) and the [dependency plan](docs/planning/delivery-plan.md).
Use an existing bounded task or ask the maintainer/coordinator to allocate one.
Identify FR/D/AC/packet coverage, intended result, permitted files/dependencies,
checks and exclusions. Plans/roles are not permission to spawn agents, install
dependencies, publish, deploy or edit Gamila. Follow [worker workflow](docs/agents/workflow.md).

Product behavior changes require product review against the Notion PRD. HLD
architecture/API choices are reviewable proposals; revise consequential choices
with an ADR and evidence, not silent compatibility/scope downgrades. Keep docs
and acceptance aligned with implementation in the same change.

## Working conventions

- One canonical owner per concept, one live task ledger; load focused context.
- Future code: strict typed ESM, native TanStack concepts, explicit exports,
  server-safe contracts and isolated optional UI/drag dependencies.
- No copied `.repo/` code/data/assets/patches, mandatory backend/framework
  dependencies in core, secret/private records or generated build artifacts.
- Stable row/field IDs, exclusive ownership, atomic transitions and recovery are
  correctness constraints, not cosmetic preferences.
- Add tests for meaningful uncovered risk; distinguish unit/component/SSR/browser/
  packed-consumer/manual/performance evidence. Never convert mocks into live claims.
- Preserve unrelated staged/working changes. Commit/push/PR only when requested;
  use focused Conventional Commits for authorized Git publication.

## Verify and hand off

For documentation, run the actual [README checks](README.md#check-documentation)
and inspect semantic source coverage. Runtime commands will be documented by the
bootstrap task, not guessed here. Review the diff, update owning docs and
[changelog](CHANGELOG.md) for relevant consumer-facing changes, record exact
results/limits and provide a resumable task handoff. Use the PR template for
authorized reviews; do not claim acceptance from an unchecked checklist.

Read [conduct](CODE_OF_CONDUCT.md) and [security reporting](SECURITY.md). Planned
MIT licensing and actual publication/third-party inputs are documented in
[release operations](docs/operations/releasing.md#licensing-and-publication-inputs).

Templates: [bug report](.github/ISSUE_TEMPLATE/bug_report.md),
[feature proposal](.github/ISSUE_TEMPLATE/feature_request.md),
[pull request](.github/PULL_REQUEST_TEMPLATE.md).
