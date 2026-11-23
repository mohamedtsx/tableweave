# Agentic delivery and coordination

This is Tableweave's working procedure, adapted from Gamila's selective-context,
single-owner, evidence-scoped approach. It is not a request to spawn agents or a
standing grant to install, publish, deploy or modify other projects.

## Roles and responsibility

Roles are responsibilities, not named staff or concurrent agents already running.
One person/agent may hold several; review critical boundaries separately when
possible. Maintainer/product decisions cannot be impersonated by an agent.

| Role | Owns | Does not decide alone |
| --- | --- | --- |
| Maintainer/product owner | Product changes, review disposition, execution/publication authorization | Unmeasured technical acceptance |
| Coordinator | Source reconciliation, dependency readiness, packet/ID/path assignment, integration/handoff | Product scope, invented passes, permission for external changes |
| Contracts/core worker | Schema/operators/types, reducer/query, native bridge | Backend authorization policy or arbitrary UI requirements |
| UI/design worker | Reviewed scenes, HeroUI composition, tools/details/stories | New features from a reference or weakened accessibility |
| Resource/integration worker | Resource guards, Start/Query/SSR, application example ports | Mandatory fetching/auth in core or real-consumer access |
| Reordering worker | Optional adapter, input/focus/identity/move protocol | Successful persistence without app acknowledgement |
| Verification/release reviewer | Risk-based checks, package/browser/manual/perf evidence, readiness report | Publication, conformance or scope changes without authority/evidence |

## Lifecycle and one live ledger

`TASKS.md` owns statuses. Use stable `TASK-NNN` IDs; do not renumber or allocate
the same ID in parallel. WP IDs identify reusable scope packets, not live task
status. No second TODO/PROGRESS board. Archive completed history only when useful,
preserving IDs/links/evidence and marking it historical, not active instruction.

Maintainer review-note labels (`n1`, `n2`, …) are **session-local** and restart
in each new review session. Keep numbered feedback in the separate
[REVIEW.md](../../REVIEW.md) scratchpad, grouped by session with its request,
disposition/checks and task context. TASKS links to it but remains the only task
board. Refer to task + session + note when ambiguous; labels are not global task
IDs or automatic packet approval. Notes may be cleared when the maintainer asks;
preserve applied decisions in canonical owners first, not solely in the temporary
scratchpad. This does not authorize discarding task/evidence history or user work.

Treat factual review reports as testable hypotheses, whoever reports them.
Independently reproduce the failure, check it against the owning contract, and
report contrary evidence when a claim is not confirmed. Maintainers and agents
can both make mistakes; neither assertion substitutes for proof. This does not
change the maintainer's authority over requirements or execution authorization.

| State | Meaning |
| --- | --- |
| planned | Queued/proposed; no execution or authorization implied |
| in progress | Identified worker actively doing authorized bounded work |
| blocked | A named dependency/input prevents this outcome; record unblock condition |
| in review | Output/checks available; reviewer disposition still required |
| done | Defined output reviewed, relevant checks passed and handoff/evidence recorded |
| canceled | Intentionally stopped/superseded; keep reason/replacement |

At start, find/add task using [task template](../templates/task.md), link packet
and FR/D/AC/gates, record actual authorization and current revision/dirty state.
Update at meaningful scope/state change and handoff. Required missing evidence
blocks completion of that outcome; a docs-only outcome can be done without
claiming its planned runtime gates passed.

## Definition of ready

Before a worker starts:

1. Observable bounded outcome; source/local owners and affected IDs selected.
2. Current authorization covers actions and targets, including installs if needed.
3. Dependencies have artifacts/accepted interface revisions, not merely “done” text.
4. Assigned worker, permitted paths, exclusions and integration/reviewer owner.
5. Explicit validation at the meaningful boundary, failure cases and stop rules.
6. Actual implementation/tools inspected; proposed APIs or missing commands not
   mistaken for mounted code. Unavailable prerequisites recorded honestly.

No estimates/dates/percentages or owners are invented. Missing product policy is
escalated; ordinary technical implementation choices are resolved within the HLD
and recorded when consequential. Publication inputs block only related actions.

## Execution and documentation loop

Read affected product → technical/design contract → installed source/tests →
implement named behavior → verify failure/interaction boundaries → review diff →
update owner/acceptance and evidence → resumable handoff. Do not load the entire
PRD, all evidence or reference projects by default. Do not implement a feature
because an adjacent folder or reference makes it convenient.

For changed state/types, inspect defaults, serialization, local/server parity,
controls, hidden fields, stale paths, callbacks, docs/examples and package exports.
Fix in-scope findings and rerun affected checks. Add durable procedures only for
verified repeatable lessons; avoid duplicate policies or untested vendor snippets.
Stop when appropriate checks pass and no unresolved in-scope issue remains.

## Parallel work, only when authorized

- Coordinator allocates IDs and exclusive file scopes. Shared schema/public API,
  lockfile, root manifests, TASKS and source/traceability indexes have **one writer**.
- Hand off a versioned contract/artifact before dependents code against it. If
  producer interface changes, stop dependent integration, communicate the delta,
  update consumers/acceptance and rerun combined checks.
- Independent source research/design/test-vector work can run while another
  packet is blocked if it needs no unapproved API or conflicting files.
- Separate worktrees only when appropriate/authorized; do not reset another
  worker's changes. Separate fixture scopes, server ports and output directories
  for parallel browser runs. No shared disposable fixture cleanup races.
- Workers return patches/artifacts and evidence; coordinator integrates/reviews,
  then reruns affected combined checks. A worker's pass is not integrated evidence.
- A path conflict stops that write; ask coordinator to allocate or serialize,
  never overwrite to make a global check pass. No blanket delegation permission.

## Definition of done and handoff

- Requested observable outcome delivered without unrelated scope expansion.
- Source intent and technical contracts agree; deviations/decisions recorded.
- Correctness, invalid/empty/stale/race/input/focus/identity risks checked as
  applicable; exact commands/versions/results/limitations recorded.
- Owning docs, traceability and examples updated if behavior/API changed.
- Diff reviewed for secrets, .repo imports, unrelated changes, fake actions,
  publication artifacts and unjustified compatibility/conformance claims.
- Task board/detail agree; unfinished work has exact next action/unblock condition.
  Use [handoff](../templates/handoff.md); evidence may live in task for tiny work
  or a dated report for substantial work. No pass fabricated from planned checks.

If blocked, report completed scope, precise blocker, smallest decision needed and
safe independent next work. If publication is separately requested, use focused
Conventional Commits and non-destructive Git operations; never infer it from this
procedure. [README](../../README.md) owns commands that actually exist.
