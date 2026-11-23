# Agent bootstrap

Tableweave is a planned React table toolkit: TanStack behavior, a headless package
and an optional HeroUI renderer. This repository currently contains documentation
and a documentation checker, **not an executable library**.

## Load only what the task needs

1. Read [PROJECT.md](PROJECT.md) and the current [TASKS.md](TASKS.md) handoff.
2. Select the affected owner through [product/README.md](product/README.md).
3. Follow [docs/README.md](docs/README.md) to technical/design contracts and load
   the matching skill below. Traceability is a lookup, not default context.
4. If implementation is authorized and exists, inspect actual files, installed
   versions and tests. Do not infer exports or commands from proposed contracts.

## Authority and hard boundaries

- Current explicit user instructions govern the task. The Notion PRD owns product
  intent; `product/` is the maintained local representation. The HLD owns proposed
  technical/design contracts and is ready for review, not a passed feasibility test.
- Record source conflicts with URLs and affected IDs. Never weaken requirements
  to fit a dependency or an attractive visual. [Open items](product/open-questions.md)
  separates scope, engineering proof and publication inputs.
- `.repo/` is ignored, local-only and strictly read-only. Do not update its Git
  metadata, import runtime code/assets, create build dependencies on it, or inherit
  Gamila's business rules. Do not modify Gamila for consumer validation without
  separate authorization.
- Applications own fetching, authorization, backend queries, actions and persistence.
  UI hiding, selected IDs and query schemas are never backend authorization.
- Preserve stable row/field IDs, exclusive filter ownership, builder-only Clear,
  distinct Cancel operations, atomic query transitions and scope isolation.
- No default telemetry, data uploads, automatic URL/storage persistence or Export.
  Use synthetic records; keep sensitive filters, errors, auth state and tokens out
  of docs, logs, stories and evidence.
- Preserve unrelated staged/untracked work. No commits, pushes, publication,
  deployments or dependency installs merely because a workflow describes them.

## Task-sized skills

Skills are local Markdown procedures; read the matching `SKILL.md`. They supply
no new authorization. No copied vendor manuals or agent-runtime configuration is
required. Library documentation must match the actual installed release.

| Task | Skill |
| --- | --- |
| Reconcile sources, maintain docs/skills or audit coverage | [Documentation maintenance](.agents/skills/tableweave-docs-maintenance/SKILL.md) |
| Coordinate workers, claim packets, resolve dependencies or hand off | [Coordination](.agents/skills/tableweave-coordination/SKILL.md) |
| Deliver an authorized library feature or feasibility spike | [Feature delivery](.agents/skills/tableweave-feature-delivery/SKILL.md) |
| Compose HeroUI tables, filters, details or Storybook states | [UI workflow](.agents/skills/tableweave-ui-workflow/SKILL.md) |
| Select checks, review evidence, benchmark or assess release readiness | [Verification](.agents/skills/tableweave-verification/SKILL.md) |

## Verification and completion

Maintain [TASKS.md](TASKS.md) at start, meaningful state changes and handoff using
the [worker workflow](docs/agents/workflow.md). Record the task's authorization,
requirements, bounded paths, dependencies, completion criteria and exact next step.
Delegate only when the user or applicable instructions authorize it; role names in
a plan are not a request to spawn agents.

Review the result and fix in-scope defects before completion. For documentation,
use the actual [README checks](README.md#check-documentation), inspect canonical
ownership/source coverage and record limits. For future runtime work, use the
installed commands that the bootstrap task must document; never claim tests that
were not run. A story/mock/type pass does not prove SSR, persistence, browser,
assistive-technology, performance, real-consumer or publication readiness.
