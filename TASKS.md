# Tableweave tasks

This is the only live work ledger. Requirements live in `product/`, contracts in
`docs/`, procedures in `.agents/skills/`, and observations in `docs/evidence/`.
Planned work is not authorization to implement, install, publish, or modify Gamila.

## Current handoff

- **2026-11-23:** TASK-002 review and authorization are complete. The maintainer
  explicitly approved WP-01 execution; TASK-003 foundation is implemented,
  locally verified and **in review** with the maintainer.
- **Current owner instruction:** implement the approved WP-01 locally, including
  reviewed dependency installation and checks. Select exact compatible tools
  within the baseline; return incompatibilities or scope changes for review.
  No delegation, remote writes, publication or deployment is authorized; local
  commit permission is scoped by the current Git instruction below.
- **Previous Git instruction:** the approved documentation changes were committed
  as `de7f1cb`; that one-time commit permission is consumed.
- **Previous transfer instruction:** move the existing local documentation commit and
  uncommitted WP-01/review changes onto local `chore/setup` in its existing
  `/home/mohamed/Desktop/tableweave` worktree. Preserve all changed/untracked
  source files and ignored local references; no new commit, push or publication.
- **Current Git instruction:** commit the current WP-01 foundation and review
  documentation locally on `chore/setup`. This authorizes one local snapshot,
  not a push, publication, WP-01 review acceptance or WP-02 execution.
- **Transfer result:** `chore/setup` fast-forwarded to existing `de7f1cb`; all 62
  changed/untracked source files transferred with byte/mode verification before
  this handoff update. The session now works in `/home/mohamed/Desktop/tableweave`.
  At transfer time changes remained unstaged/uncommitted. Ignored dependencies, generated verification
  outputs and reference checkouts were not moved or modified; previous runtime
  evidence belongs to the original worktree, not a rerun in this directory.
  Destination documentation checks, all 17 checker probes and `git diff --check`
  passed; the temporary transfer stash was removed after verification.
- **Current documentation request:** record all three maintainer taste sources:
  direct feedback, the transactions reference, and `.repo/` as the main source
  of taste and architecture. TASK-004 is complete; the canonical guidance is in
  [references](docs/reference/README.md#maintainer-taste-and-architecture-sources).
  Apply this guidance during WP-01; `.repo/` is absent in the current worktree at
  execution start, so the recorded assessment is the available fallback.
- The original task was planning/documentation only, using the Notion PRD/HLD and
  read-only `.repo/Gamila`. WP-01 now permits bounded foundation code and installs;
  Figma editing, remote publication, npm publication and Gamila changes remain
  unauthorized.
- Both supplied Notion pages were fetched. PRD v1.0 is the requirements baseline;
  HLD v1.0 is completed **for review**, with proposed APIs and unexecuted gates.
- The repository now has private WP-01 package and smoke/check scaffolds, not
  implemented table features. The initial commit includes the
  current `.gitmodules` and `.gitignore`; the absent old `.repos/Gamila` index
  entry is not retained. `.repo/Gamila` remains ignored/local-only. Its existing
  Git metadata has a stale worktree path; do not repair or force-add the reference.
- Product/technical/design owners, five worker skills, 16 bounded packets,
  29 derived acceptance scenarios and contributor guidance are delivered.
  Source-ID/fingerprint/section/navigation checks pass; 16 documentation-checker
  probes pass. Final source review corrected row-grouping wording and benchmark
  sampling fidelity. No implementation or stable-release gate is claimed passed.
- **Next action:** maintainer reviews the TASK-003 handoff/evidence and accepts
  the foundation or requests corrections. WP-02 is next in sequence, but is not
  authorized by WP-01 approval. A local snapshot is now requested; no push.
- **Active review:** TASK-003 / WP-01 review session 1. Detailed numbered notes
  live separately in [REVIEW.md](REVIEW.md), a temporary review scratchpad, not a
  second task board. Numbering restarts in each new review session. Applied
  guidance stays in its canonical docs when notes are later cleared on request.

## Board

| ID | Outcome | Status | Owner | Depends on |
| --- | --- | --- | --- | --- |
| TASK-001 | Ready-to-start product and agent documentation | done | Current documentation coordinator | Supplied PRD/HLD; read-only reference |
| TASK-002 | Review technical baseline and authorize the first implementation slice | done | Current agent coordinates; maintainer decides | TASK-001; explicit WP-01 execution approval |
| TASK-003 | WP-01 executable workspace and package foundation | in review | Current agent; maintainer reviews | Local foundation checks passed; maintainer acceptance pending |
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
- **Status:** done; bootstrap review, plan approval and subsequent explicit WP-01
  implementation/install authorization received. The PRD has no open
  product-scope decisions; later engineering validation and publication inputs remain.
- **Initial interview authorization:** iterative clarification and local review/decision records only.
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
- **Next action:** execute the approved TASK-003; prior plan-only decisions above
  are interview history, superseded only for bounded WP-01 implementation/installs.

## TASK-003 — WP-01 workspace and package foundation

- **Status/owner/reviewer:** in review; current agent implemented and reviewed
  the local result; maintainer reviews/accepts the handoff. No delegation used.
- **Compatibility disposition:** after research, maintainer explicitly approved
  Storybook `9.1.21`/Vite `7.3.8` and `exactOptionalPropertyTypes: false` only in
  the development Storybook app. `strict: true` and `skipLibCheck: false` stay
  everywhere; packages and packed consumers retain exact optional checks.
  Component imports use official scoped subpaths. Rejected older Storybook 10
  candidates covered by public security advisories, rather than downgrading into
  a known affected dev server. This is not a product/baseline-major change.
- **Authorization:** maintainer said “I approved the wp-01 go ahead”: local
  foundation code/configuration, reviewed installs and verification under the
  approved plan. No later packet, commit, push, publication or deployment.
- **Packet/inputs:** [WP-01](docs/planning/work-packets.md#wp-01-workspace-and-package-foundation),
  TASK-002 decisions, [architecture](docs/engineering/architecture.md),
  [stack](docs/engineering/stack.md), [testing](docs/testing/README.md) and
  [packaging](docs/operations/releasing.md), plus the
  [maintainer reference guidance](docs/reference/README.md#maintainer-taste-and-architecture-sources).
  Foundation prepares future G-01/G-05
  checks but does not pass them or implement FR capabilities.
- **Revision/dependencies:** execution starts from clean `de7f1cb`; Node
  `24.22.0`, pnpm `10.13.1` are available. `.repo/` is absent from this worktree;
  use the documented assessment without claiming a fresh reference inspection.
- **Permitted paths/single writer:** root workspace manifests, lockfile,
  tool configs and generated-output ignore rules; `packages/react` and
  `packages/heroui` entry/build skeletons; minimal `apps/storybook`; bounded
  `tests` harnesses; local CI configuration; `README.md`, `TASKS.md` and scoped
  `docs/evidence/` handoff; bootstrap/engineering/testing/Storybook/release status
  wording; documentation-checker generated-directory exclusions and regression.
  Current agent owns shared foundation files. Preserve
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
- **Delivered/checks:** full private four-project pnpm foundation, clean unbundled
  ESM/declaration builds, explicit exports/directives/style boundaries, synthetic
  vendor smoke, local CI configuration and verified README commands. Exact
  versions/rejected candidates/approved settings are in
  [foundation evidence](docs/evidence/wp-01-foundation-2026-11-23.md).
  Final `pnpm check` passed: fresh frozen workspace install (lockfile unchanged),
  Biome (38 code/config files), strict source/declaration checks, four boundary
  tests, documentation checks and 17 checker probes, two inspected tarballs and
  isolated TS 5.9/6 consumers, static Storybook build and one Chromium smoke with
  pointer/keyboard/style/axe/error/external-request checks. Dev command passed
  `pnpm storybook --smoke-test --ci`. `git diff --check` passed. No remote CI run.
- **Review/limits:** reviewed source/config/diff, raw packed contents/import graphs
  and the synthetic smoke screenshot. Fixed discovered peer and harness gaps;
  recorded nonblocking vendor build warnings. All feature exports remain empty;
  no actual table, full vendor-barrel/G-01/G-05/SSR/manual AT/performance/consumer
  readiness claim. Missing local `.repo/` inspection and publication/legal inputs
  are explicit limits, not fabricated passes. Packages stay private.
- **Next action:** maintainer accepts the scoped WP-01 handoff or requests changes.
  If accepted and separately authorized, WP-02 starts from these package entries
  with schema/operator/conformance vectors; update the scaffold-only negative
  assertions as real APIs are introduced. Do not start WP-02 yet.

- **Review-note maintenance:** maintainer requested a separate, clearable notes
  file. Current agent moved the existing numbered feedback to `REVIEW.md` and
  updated only this ledger, review procedure and the stack's transient-note
  reference. Existing WP-01 work remains unchanged. `python3 scripts/check_docs.py`,
  `python3 -B scripts/test_check_docs.py` (17 probes) and `git diff --check`
  passed. Continue maintainer review; no runtime rerun or new authority implied.

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
- **Next action:** apply this guidance to future authorized work. At this task's
  original handoff WP-01 was planned; subsequent execution authority is recorded
  under TASK-003. No further clarification is needed merely to record the sources.
