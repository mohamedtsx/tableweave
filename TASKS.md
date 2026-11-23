# Tableweave tasks

This is the only live work ledger. Requirements live in `product/`, contracts in
`docs/`, procedures in `.agents/skills/`, and observations in `docs/evidence/`.
Planned work is not authorization to implement, install, publish, or modify Gamila.

## Current handoff

- **2026-11-23:** TASK-001 is complete; TASK-002 bootstrap review interview is
  complete and its WP-01 plan is approved. Execution authorization is deliberately
  withheld, so TASK-002 is blocked on that permission and TASK-003 remains planned.
- **Current owner instruction:** approve the plan only. The agent may select
  exact compatible versions and ordinary tooling during separately authorized
  execution, but must wait for another instruction before coding or installing.
  No remote writes are authorized.
- **Current Git instruction:** commit the reviewed bootstrap-plan and taste-source
  documentation changes locally. This authorizes this commit only; no push,
  implementation or dependency installation is requested.
- **Current documentation request:** record all three maintainer taste sources:
  direct feedback, the transactions reference, and `.repo/` as the main source
  of taste and architecture. TASK-004 is complete; the canonical guidance is in
  [references](docs/reference/README.md#maintainer-taste-and-architecture-sources).
  WP-01 execution permission remains withheld.
- The original task was planning/documentation only, using the Notion PRD/HLD and
  read-only `.repo/Gamila`. Application code, package installation, Figma editing,
  remote publication, npm publication and Gamila changes remain unauthorized.
- Both supplied Notion pages were fetched. PRD v1.0 is the requirements baseline;
  HLD v1.0 is completed **for review**, with proposed APIs and unexecuted gates.
- The repository remains documentation-only. The initial commit includes the
  current `.gitmodules` and `.gitignore`; the absent old `.repos/Gamila` index
  entry is not retained. `.repo/Gamila` remains ignored/local-only. Its existing
  Git metadata has a stale worktree path; do not repair or force-add the reference.
- Product/technical/design owners, five worker skills, 16 bounded packets,
  29 derived acceptance scenarios and contributor guidance are delivered.
  Source-ID/fingerprint/section/navigation checks pass; 16 documentation-checker
  probes pass. Final source review corrected row-grouping wording and benchmark
  sampling fidelity. No implementation or stable-release gate is claimed passed.
- **Next action:** wait for a separate maintainer instruction authorizing local
  WP-01 implementation and dependency installation under TASK-003. No bootstrap
  interview decisions remain open; later packet decisions and engineering proof
  are explicitly deferred, not passed.

## Board

| ID | Outcome | Status | Owner | Depends on |
| --- | --- | --- | --- | --- |
| TASK-001 | Ready-to-start product and agent documentation | done | Current documentation coordinator | Supplied PRD/HLD; read-only reference |
| TASK-002 | Review technical baseline and authorize the first implementation slice | blocked | Current agent coordinates; maintainer decides | TASK-001; execution permission withheld |
| TASK-003 | WP-01 executable workspace and package foundation | planned | Current agent, execution permission pending; maintainer reviews | TASK-002 authorization |
| TASK-004 | Record maintainer taste and architecture reference sources | done | Current documentation agent | Explicit maintainer clarification |

## TASK-001 — Documentation foundation

- **Request:** turn the supplied PRD/HLD and useful Gamila practices into a
  complete local starting point for stakeholders and agent workers.
- **Deliver:** concise bootstrap; focused product/technical owners; source
  provenance; acceptance/traceability; design and Storybook handoff; feasibility
  and release gates; bounded worker packets; task/decision/evidence templates;
  reusable local skills; contributor/security guidance.
- **Done when:** sources are reconciled without scope changes; all source FR/D,
  HLD ADR/G/F IDs are routed; local links and skills are checked; current status
  and unexecuted runtime/release gates are explicit.
- **Checks:** structural/source comparison and 16 checker regression probes pass;
  semantic/source/worker-routing review recorded in
  [documentation evidence](docs/evidence/documentation-foundation-2026-11-23.md).
  Final structural/source and checker regression reruns pass. Pre-existing staged
  entries and reference setup are preserved. No runtime checks are possible or
  claimed in this documentation-only repository. This completion is documentation
  delivery, not maintainer approval of HLD choices or authorization to implement.

## TASK-002 — Baseline review and implementation authorization

- **Outcome:** maintainer reviews the HLD-derived contracts and proposed work
  sequence, assigns an execution owner, and explicitly authorizes a bounded
  bootstrap/feasibility task.
- **Status:** bootstrap review and plan approval complete; blocked only on
  deliberately withheld implementation/install permission. The PRD has no open
  product-scope decisions; later engineering validation and publication inputs remain.
- **Authorization:** iterative clarification and local review/decision records only.
  Maintainer selected **plan only for now**: finish review and present a bounded
  task; ask again before implementation or dependency installation.
- **Recorded maintainer decisions:**
  - Approve two-package architecture: headless `@tableweave/react` with server-safe
    contracts and optional `@tableweave/heroui`; applications retain fetching,
    authorization and persistence ownership.
  - Retain the candidate Node 24/pnpm 10/strict TypeScript 6/React 19/TanStack
    Table v9/HeroUI v3/Tailwind v4 baseline, subject to version/peer verification.
    Unavailable or incompatible dependencies require review, not silent swaps.
  - No implementation/install permission granted. API freeze and G-01–G-05
    remain evidence-dependent; these answers do not pass a gate.
  - Review breadth is **bootstrap readiness**, not the entire technical baseline.
    Later feature, visual and publication decisions are deferred to their packets.
  - Plan the **full WP-01** foundation, not a reduced first slice.
  - A minimal synthetic Storybook smoke scene may be planned before full visual
    design approval. No Figma work or final table UI approval is implied.
  - The future executor may choose exact compatible versions and ordinary
    build/lint/CI tooling within the baseline, recording rationale and evidence.
    Baseline changes, incompatible dependencies and scope expansion return for
    review; no forced peers or silent substitutes.
  - Approve the bounded TASK-003 plan below, with the current agent as intended
    executor after separate permission and the maintainer as handoff reviewer.
    This is plan approval only, not execution authority or full HLD/API freeze.
- **Paths:** `TASKS.md` for this interview; affected canonical contracts only if
  an approved change requires them. No runtime, `.repo/` or external writes.
- **Dependencies/revision:** TASK-001 documentation; worktree was clean at
  interview start. HLD APIs and compatibility gates remain provisional.
- **Checks/stop rule:** review decisions against canonical package/stack/packet
  owners, run README documentation checks after ledger edits, and stop to ask
  about unapproved scope or requirements conflicts. No runtime pass inferred.
- **Done when:** review disposition and authorization scope are recorded here;
  the first ready work packet is claimed with paths, checks and handoff.
- **Checks so far:** `python3 scripts/check_docs.py`,
  `python3 -B scripts/test_check_docs.py` (16 probes), and `git diff --check`
  passed after opening the interview and again for the approved plan.
  Documentation-only checks; no source
  fingerprint comparison or runtime evidence claimed.
- **Next action:** wait for explicit execution permission; do not continue asking
  about settled bootstrap choices or treat deferred later-packet inputs as blockers.

## TASK-003 — WP-01 workspace and package foundation (approved plan only)

- **Status/owner/reviewer:** planned; current agent is intended executor after
  separate permission; maintainer reviews the handoff. No delegation authorized.
- **Authorization:** planning only. Local runtime code/configuration changes,
  dependency installs and execution of the future workspace require a separate
  maintainer instruction before this task starts.
- **Packet/inputs:** [WP-01](docs/planning/work-packets.md#wp-01-workspace-and-package-foundation),
  TASK-002 decisions, [architecture](docs/engineering/architecture.md),
  [stack](docs/engineering/stack.md), [testing](docs/testing/README.md) and
  [packaging](docs/operations/releasing.md), plus the
  [maintainer reference guidance](docs/reference/README.md#maintainer-taste-and-architecture-sources).
  Foundation prepares future G-01/G-05
  checks but does not pass them or implement FR capabilities.
- **Revision/dependencies:** documentation baseline `42a656e`; this interview adds
  only ledger changes. Reinspect actual tools and worktree before execution.
  Start only after explicit local implementation and dependency-install authority.
- **Permitted future paths/single writer:** root workspace manifests, lockfile,
  tool configs and generated-output ignore rules; `packages/react` and
  `packages/heroui` entry/build skeletons; minimal `apps/storybook`; bounded
  `tests` harnesses; local CI configuration; `README.md`, `TASKS.md` and scoped
  `docs/evidence/` handoff. Current agent owns shared foundation files. Preserve
  unrelated work; changes to canonical contracts require review if consequential.
- **Deliver:** full pnpm foundation, reviewed exact toolchain/peers, ESM/export
  maps/declarations/client and server-safe entry boundaries, style side-effect
  policy, meaningful smoke/type/import checks, synthetic Storybook smoke scene,
  local packing/consumer harness and CI configuration with verified README commands.
  Empty package skeletons must not pretend to implement proposed feature APIs.
- **Acceptance:** clean reproducible install; successful build/declarations and
  meaningful positive/negative type/import checks; Storybook build and browser
  smoke; local pack and inspected tarballs/clean import consumers. Check headless
  imports exclude styled dependencies, contracts need no React runtime/DOM, client
  directives/styles survive builds, and default renderer does not pull optional
  sortable code. Record exact commands, versions, environment, results and limits.
  Preserve and rerun documentation/checker regression checks.
- **Stop rules:** dependency unavailability/incompatibility, required architecture
  changes or missing required proof stop affected acceptance and return for review.
  No forced peers, fake feature APIs, unsupported passes or weakened product rules.
- **Exclusions:** no actual table features, full example apps, Figma writes,
  `.repo/`/Gamila changes, copied reference runtime/assets, private data, external
  CI setup/runs, commits, pushes, publication or deployment. No complete G-01/G-05,
  stable readiness, manual accessibility or real-consumer claims.
- **Checks run:** none for WP-01; no executable workspace exists. Documentation
  checks apply only to this planning/ledger update, not future runtime acceptance.
- **Next action:** wait for explicit local implementation and dependency-install
  authorization, then claim execution, inspect tools and choose compatible pinned
  versions within the approved baseline. Handoff for review before WP-02 begins.

## TASK-004 — Maintainer taste and architecture sources

- **Status:** done; documentation reviewed against the explicit clarification.
- **Authorization/outcome:** maintainer explicitly requested recording all three
  taste sources: feedback, transactions reference and `.repo/`, with `.repo/`
  the main source of taste and architecture. Documentation changes only; no
  runtime, installation, reference modifications or external writes authorized.
- **Owner/paths:** current documentation agent; `TASKS.md`, `AGENTS.md`,
  `PROJECT.md`, `docs/reference/README.md`, `docs/reference/gamila-assessment.md`,
  `docs/design/handoff.md` and `docs/engineering/architecture.md`.
- **Inputs/dependencies:** current maintainer clarification; existing reference
  assessment/design handoff and approved Tableweave contracts. Existing TASKS
  edits from the earlier interview are preserved. No FR/AC scope changes.
- **Done when/checks:** all three sources and their priority are discoverable from
  bootstrap/design/architecture routes; historical inspection limits stay clear;
  read-only/no-copy/business-policy boundaries remain; README documentation,
  checker regression and diff checks pass. No new reference audit is claimed.
- **Delivered/review:** canonical three-source guidance in `docs/reference/README.md`,
  routed from bootstrap, project map, design handoff, architecture and TASK-003.
  Corrected the reference's optional-only framing and clarified adapting visual
  taste versus automatically inheriting brand/business policy. All three sources
  are recorded; generic design defaults are not a substitute. Prior inspection
  limits remain explicit. No `.repo/` files or remote sources were changed.
- **Checks:** `python3 scripts/check_docs.py` passed;
  `python3 -B scripts/test_check_docs.py` passed all 16 probes;
  `git diff --check` passed. Reviewed affected routes and diff for consistency.
  No new reference inspection, source fingerprint comparison, visual/runtime
  validation or implementation is claimed.
- **Next action:** apply this guidance to future authorized work. WP-01 remains
  planned pending separate implementation/install permission; no further taste
  clarification is required merely to record these sources.
