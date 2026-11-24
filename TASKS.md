# Tableweave tasks

This is the only live work ledger. Requirements live in `product/`, contracts in
`docs/`, procedures in `.agents/skills/`, and observations in `docs/evidence/`.
Planned work is not authorization to implement, install, publish, or modify Gamila.

## Current handoff

- **2026-11-23:** TASK-002 review and authorization are complete. The maintainer
  ended the review and explicitly accepted WP-01; TASK-003 is **done**.
- **Current owner instruction:** execute WP-04 through WP-15 in dependency order:
  plan first, implement, review with session-local n1/n2 comments, fix/verify,
  delegated agent engineering approval, commit and open a separate PR per packet.
  Multiple agents are explicitly authorized. **Do not merge any PR**; maintainer
  will personally review after delivery. Necessary dependencies are scoped/pinned
  in each plan before installation, not blanket upgrades. No publication/deploy,
  read-only reference mutation, invented human/real-consumer evidence or product
  requirement waiver. Explicit input-dependent gates remain blocked when missing.
- **Previous Git instruction:** the approved documentation changes were committed
  as `de7f1cb`; that one-time commit permission is consumed.
- **Previous transfer instruction:** move the existing local documentation commit and
  uncommitted WP-01/review changes onto local `chore/setup` in its existing
  `/home/mohamed/Desktop/tableweave` worktree. Preserve all changed/untracked
  source files and ignored local references; no new commit, push or publication.
- **Previous foundation commit:** the requested WP-01 snapshot is `6bac5a6` on
  `chore/setup`; that one-time commit permission is consumed. Acceptance now
  applies to this foundation revision.
- **Previous Git/PR instruction:** commit the acceptance documentation, push
  `chore/setup` to `origin/chore/setup`, then update existing PR #1 to `develop`
  (`https://github.com/mohamedtsx/tableweave/pull/1`) to reflect accepted WP-01.
  Preserve the PR's scope/verification caveats; no merge, release or WP-02 work.
  Completed as `5c11d53`, pushed to `origin/chore/setup`; PR #1 summary updated.
  That bounded permission is consumed; no new Git/PR action is requested.
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
- The repository now has accepted private WP-01 foundation, WP-02 schema/operators
  and WP-03 coordinator/hooks, not a mounted table library. The initial commit includes the
  current `.gitmodules` and `.gitignore`; the absent old `.repos/Gamila` index
  entry is not retained. `.repo/Gamila` remains ignored/local-only. Its existing
  Git metadata has a stale worktree path; do not repair or force-add the reference.
- Product/technical/design owners, five worker skills, 16 bounded packets,
  29 derived acceptance scenarios and contributor guidance are delivered.
  Source-ID/fingerprint/section/navigation checks pass; 16 documentation-checker
  probes pass. Final source review corrected row-grouping wording and benchmark
  sampling fidelity. No implementation or stable-release gate is claimed passed.
- **Next action:** WP-04 has delegated technical/G-01 approval and implementation
  `b165550` in [PR #4](https://github.com/mohamedtsx/tableweave/pull/4), stacked on
  still-open PR #3. Final head `bf7712e` is pushed/verified and the tree was clean.
  Resource transport `71f076c` is stacked as `e6eeabf` plus approval `2be951a` in
  [PR #5](https://github.com/mohamedtsx/tableweave/pull/5), based on open PR #4;
  combined checks pass. WP-06 actual Start corrections n1–n5 are independently
  reviewed; no residual source defect is verified. Main's full corrected guarded
  workflow/fresh actual-tarball checks pass and bounded G-04 is agent-approved
  under delegated authority. Source `a7d0863` is pushed in open
  [PR #6](https://github.com/mohamedtsx/tableweave/pull/6) against PR #5's branch;
  corrected source222c97f has two successful remote checks. A final documentation
  handoff records their exact run IDs; verify that last handoff head too. Other packets
  continue only in their bounded isolated/primary paths. No deployment/publication.
- **Review closed:** WP-01, WP-02 and WP-03 review session 1, following explicit
  maintainer acceptance of each packet. Detailed numbered notes
  live separately in [REVIEW.md](REVIEW.md), a temporary review scratchpad, not a
  second task board. Numbering restarts in each new review session. Applied
  guidance stays in its canonical docs when notes are later cleared on request.

## Board

| ID | Outcome | Status | Owner | Depends on |
| --- | --- | --- | --- | --- |
| TASK-001 | Ready-to-start product and agent documentation | done | Current documentation coordinator | Supplied PRD/HLD; read-only reference |
| TASK-002 | Review technical baseline and authorize the first implementation slice | done | Current agent coordinates; maintainer decides | TASK-001; explicit WP-01 execution approval |
| TASK-003 | WP-01 executable workspace and package foundation | done | Current agent implemented; maintainer accepted | Foundation checks and explicit maintainer acceptance |
| TASK-004 | Record maintainer taste and architecture reference sources | done | Current documentation agent | Explicit maintainer clarification |
| TASK-005 | Prepare bounded WP-02 implementation plan | done | Current planning agent; maintainer approved | Explicit plan/dependency approval |
| TASK-006 | WP-02 schema, operators and conformance vectors | done | Current agent delivered; maintainer accepted | Explicit WP-02 acceptance after n1–n3 corrections |
| TASK-007 | Commit WP-02 and create a separate PR | done | Current agent delivered/verified; maintainer reviews PR | Implementation committed/pushed; PR #2 open; PR #1 unchanged |
| TASK-008 | Merge the two open repository PRs | done | Main agent merged #1; authorized background agent merged #2 | Both checks passed; GitHub confirms both merged and zero open PRs |
| TASK-009 | Plan then implement WP-03 accepted-state coordinator | done | Main agent delivered/corrected; maintainer accepted | Explicit WP-03 acceptance after 208-test/four-browser/packed checks and n1–n2 fixes |
| TASK-010 | Commit accepted WP-03 and create a PR | done | Current agent delivered/verified; maintainer reviews PR | Implementation committed/pushed; PR #3 open to develop |
| TASK-011 | Coordinate delegated WP-04–WP-15 delivery | in progress | Main agent owns ledger/shared integration and PRs | Explicit multi-agent/plan/implement/review/approval/PR grant; no merges |
| TASK-012 | WP-04 native/collection feasibility | done | Main delivered implementation/patch handoff; maintainer reviews PR #4 | Delegated G-01 approval; 241 unit/32 Chromium/public packed checks; no merge |
| TASK-013 | WP-05 resource presentation/races | done | Main delivered combined approval/PR #5; maintainer reviews later | Scoped delegated G-03; 288 unit/43 Chromium/strict public packed checks |
| TASK-014 | WP-06 Start/Query SSR integration | in progress | Corrected source/remote checks pass; final docs-head verification | Delegated G-04; PR #6 remains OPEN/unmerged |
| TASK-015 | WP-07 filter tools/async choices | planned | Assigned after producer handoffs | WP-04/WP-05 and provisional visual disposition |
| TASK-016 | WP-08 table controls | planned | Assigned after producer handoffs | WP-04/WP-05 |
| TASK-017 | WP-09 details/localization/responsive shell | planned | Assigned after producer handoffs | WP-04/WP-05 |
| TASK-018 | WP-10 optional sortable | planned | Assigned after producer handoffs | WP-04/WP-05; G-02 |
| TASK-019 | WP-11 examples/docs/workbench | planned | Assigned after feature handoffs | WP-06–WP-10 |
| TASK-020 | WP-12 integrated browser/manual accessibility | planned | Verification owner assigned after WP-11 | Manual/support-matrix evidence cannot be fabricated |
| TASK-021 | WP-13 packed compatibility/release tooling | planned | Package owner assigned after WP-11 | No publication rights inferred |
| TASK-022 | WP-14 reproducible performance | planned | Benchmark owner assigned after WP-11/13 | Approved runner/workload required; no invented timings |
| TASK-023 | WP-15 real consumer/stable readiness | planned | Integration reviewer assigned when inputs exist | Separate actual target/access/write inputs and WP-12–14 evidence required |

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

- **Status/owner/reviewer:** done; current agent implemented and reviewed the
  local result; maintainer explicitly accepted WP-01 and ended review session 1
  on 2026-11-23. Accepted foundation revision: `6bac5a6`. No delegation used for
  WP-01. Acceptance preserves the evidence/compatibility limits below and is not
  a full technical-baseline/API freeze, feature or release-gate pass.
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
- **Next action:** with separate authorization, WP-02 starts from these accepted package entries
  with schema/operator/conformance vectors; update the scaffold-only negative
  assertions as real APIs are introduced. Do not start WP-02 yet.

- **Review-note maintenance:** maintainer requested a separate, clearable notes
  file. Current agent moved the existing numbered feedback to `REVIEW.md` and
  updated only this ledger, review procedure and the stack's transient-note
  reference. Existing WP-01 work remains unchanged. `python3 scripts/check_docs.py`,
  `python3 -B scripts/test_check_docs.py` (17 probes) and `git diff --check`
  passed when moving the notes. Review is now closed; notes are retained until
  clearing is requested. Closure changes only this ledger, `REVIEW.md` and the
  foundation evidence disposition. Closure checks passed:
  `python3 scripts/check_docs.py`, `python3 -B scripts/test_check_docs.py`
  (17 probes), and `git diff --check`. No runtime suites rerun for unchanged
  code; no new execution authority implied.

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

## TASK-005 — Bounded WP-02 implementation plan

- **Status/owner:** done; current agent prepared/reviewed the plan; maintainer
  explicitly approved local execution and both dependency additions.
- **Authorization/outcome:** prepare a plan for WP-02 schemas, operators and
  conformance vectors. Read actual contracts, relevant local references and
  mounted foundation files; document bounded paths, dependencies, acceptance,
  stop rules and the next authorization step. No runtime edits or installs.
- **Paths:** `TASKS.md` and the
  [implementation plan](docs/planning/wp-02-implementation-plan.md); add a navigation link from WP-02
  in `docs/planning/work-packets.md`. No other writes without a demonstrated
  in-scope documentation need; `.repo/` strictly read-only.
- **Inputs:** WP-02 packet, product operators/shared rules, public API/state/query/
  security contracts, AC-02–AC-07/AC-23/AC-26, accepted WP-01 files and actual
  manifests/tests. Worktree is clean at `5c11d53` before opening this task.
- **Done when:** maintainer can review an implementation-sized sequence with
  real file/command boundaries, tests mapped to requirements, downstream handoff
  and explicit exclusions/permissions. No proposed API is treated as implemented;
  no unsupported feasibility or runtime pass is claimed.
- **Delivered/findings:** five-step producer-contract/validation/operator/date/
  conformance sequence with bounded files, requirement/partial-AC mapping,
  dependency proposal, stop rules and downstream handoff. Fresh read-only Gamila
  architecture/stack/table-plan inspection was possible in this worktree; no
  runtime code or business policy copied. Inspected actual empty exports,
  runner/typecheck coverage and packed/runtime guards: all need deliberate
  updates alongside real APIs so WP-02 tests are discovered and exercised.
- **Dependencies:** propose Valibot `1.5.0` and Internationalized Date `3.12.4`
  as core runtime additions after explicit approval. Checked public registry
  metadata and official guides read-only; no installation or compatibility pass
  is claimed. Existing local TS 6/5.9, Vitest/Vite/Playwright metadata was inspected.
- **Checks:** `python3 scripts/check_docs.py` passed; `python3 -B scripts/test_check_docs.py`
  passed all 17 probes; `git diff --check` passed. Reviewed the plan against
  product/operator/shared rules and public API/state/security contracts, including
  partial AC coverage and unchanged release/feasibility limits. No runtime tests
  or source-fingerprint comparison were run for this documentation-only task.
- **Next action:** execute TASK-006 under the approved scope. TASK-005 itself
  performed no feature edits, installs, Git/PR action or publication.

## TASK-006 — WP-02 schemas, operators and conformance vectors

- **Status/owner/reviewer:** done; maintainer explicitly accepted WP-02 after the
  independently reproduced/corrected review session 1 n1–n3. Reports are hypotheses,
  not authority over product contracts. No delegation used or authorized.
- **Authorization:** maintainer approved the presented plan and two core runtime
  additions. Local implementation, strict dependency installation and scoped/full
  verification permitted; no later packet or Git/remote/publication operation.
- **Inputs/requirements:** accepted WP-01 `6bac5a6`, acceptance `5c11d53`, approved
  [WP-02 plan](docs/planning/wp-02-implementation-plan.md), WP-02 packet and its
  product/contract/AC mapping. Existing TASKS/plan/packet edits are preserved.
- **Paths/single writer:** contracts/filters/schema type bindings, their existing
  export entries/manifests; `tests/contracts`, specified foundation/consumer/type
  harnesses and runner; root scripts/lockfile; affected API/README/evidence/task
  documentation as bounded by the approved plan. No HeroUI implementation or
  `.repo/`/application changes. Work remains on the existing branch unless
  separate branch-operation authority is supplied.
- **Done when/checks:** real inferred schemas/query validation/operator/date/key
  contracts, full family/custom/shared translator vectors and real packed API
  invocation pass strict TS 6/5.9, import/contents/peer checks and the existing
  full local check. Record exact revisions/results/limits and review actual
  emitted consumers. No full AC/UI/SSR/G-gate claim from pure fixture checks.
- **Stop rules:** source/peer incompatibilities, semantic parity failures, unsafe
  diagnostics, missing required proof or scope expansion return for review; no
  forced peers, hidden declaration skips, fake exports or weakened requirements.
- **Progress:** installed the two approved dependencies with strict workspace
  peers; captured three initially failing schema vectors; implemented candidate
  wire v1/schema, operator/preset/date/evaluation/translation/inverse/identity
  surfaces and independent synthetic translator vectors. First packed consumer
  run passed real TS 6/5.9 and Node invocation without DOM/Node consumer typings.
  Valibot references Blob/File internally, so the private package build uses the
  already-installed Node typings; no vendor types leak through declarations.
   These remain private producer candidates, not accepted/frozen release APIs.
- **Initial verification (before review session 1):** `pnpm check` passed with unchanged frozen lockfile,
  lint, strict package/Storybook/harness types, **149 tests** (145 contracts + four
  foundation guards), 17 documentation probes, exact tarball allowlists, isolated
  headless/styled strict-peer installs, TS 6.0.3/5.9.3 real positive/negative
  consumers, guarded Node validation/date/evaluator invocation, Vite bundles,
  static Storybook and one Chromium pointer/keyboard/style/axe smoke. Public
  declarations inspected with no vendor/React/Node/DOM imports. `git diff --check`
  passed. Detailed revisions, hashes, corrections, warnings and limits are in
  [WP-02 evidence](docs/evidence/wp-02-contracts-2026-11-23.md).
- **Delivered:** wire/vector v1; schema-specific fields/operators/custom/date/
  accessor types; immutable unknown-input validation; all built-in families and
  presets; explicit custom/client/translator errors; pure inverse/date/predicate
  helpers; semantic versus request keys. [Producer contract](docs/engineering/wp-02-contracts.md)
  records consequential representation/normalization/time/privacy choices. No
  controller/React/UI/native/resource/SSR/backend/release implementation or gate
  acceptance is claimed. Original plan/packet edits were preserved and are now
  committed with the implementation in TASK-007.
- **Review correction scope:** `filters/evaluate.ts`, `filters/registry.ts`,
  `filters/dates.ts`, `contracts/types.ts`; contract regressions/independent
  translator fixture and packed consumer fixtures; REVIEW/TASKS and affected
  contract/evidence docs; worker workflow records the explicit factual-review
  instruction so it survives clearing review notes. No dependency/public API additions. Done when
  each confirmed reproduction fails before and passes after, literal negative
  fixtures still reject invalid IDs, packed TS 5.9/6 and applicable checks pass.
- **Review progress:** independently reproduced both n1 inputs, n2 after fixing
  test setup, and n3's two TS2322 errors. Shared ID-shape/own-index validation,
  post-timezone interval checks and optional-aware sort/tab inference now pass
  the focused ten regressions and local strict typecheck. Added packed runtime
  and broad/optional/literal type fixtures. Final `pnpm check` passed frozen
  installs, lint/types, **159 tests** (155 contracts + four foundation), 17 docs
  probes, exact packing/peer/import checks, both TS versions and Chromium smoke.
  [Evidence](docs/evidence/wp-02-contracts-2026-11-23.md#review-session-1--n1n3-corrections)
  preserves initial failures, corrected test setup, current hashes and limits.
- **Next action:** accepted producer feeds TASK-009's authorized WP-03 work.
  Acceptance is packet-scoped, not G-gate, UI, SSR or publication approval.
  At correction handoff no dependency change or Git/PR write had occurred;
  subsequent authorized Git delivery is tracked in TASK-007.

## TASK-007 — Commit WP-02 and create a new PR

- **Status/owner:** done; current agent delivered and verified the Git/PR handoff;
  maintainer reviews. This does not accept or close TASK-006/review.
- **Authorization:** explicit request: “commit and create new pr”. Create a new
  WP-02 branch, commit the known implementation/plan/review/docs/test changes,
  push it and open a new PR. No merge, force push, existing-PR edit or release.
- **Starting state:** `chore/setup` at `5c11d53`, with the preserved tracked and
  untracked WP-02 changes from TASK-005/TASK-006. Fresh remote inspection confirms
  PR #1 is still open from `chore/setup` to `develop`.
- **Paths/dependencies:** only the reviewed WP-02 source/tests/manifests/lockfile,
  plan, affected documentation and REVIEW/TASKS. Ignored outputs and `.repo/` stay
  untracked/read-only. No dependency install or runtime edits needed for delivery.
- **Branch/base:** create `feat/wp-02-contracts` from the accepted local foundation;
  stack the new PR on `chore/setup` to keep its diff limited to WP-02 while PR #1
  remains open. Do not merge or update PR #1 automatically.
- **Done when:** scoped commits exist, branch pushed, new PR is open with correct
  head/base and verification/limitations, and local/remote heads agree. Preserve
  review-pending status; record the implementation SHA and PR URL at handoff.
- **Checks:** reuse the recorded 159-test full check for unchanged runtime;
  rerun documentation/whitespace checks for Git handoff edits, inspect staged
  scope and verify clean local state/remote PR metadata after push.
- **Delivered:** implementation commit
  `f046b9f86f6ca1798bd026435edac4060f28e92a` on `feat/wp-02-contracts`, pushed with
  upstream tracking. [PR #2](https://github.com/mohamedtsx/tableweave/pull/2) is
  OPEN, non-draft, head `feat/wp-02-contracts`, base `chore/setup`. Verified PR
  head and remote branch equal the implementation SHA and the worktree is clean
  before this documentation-only completion update. PR #1 remains untouched.
- **Verification/handoff:** staged scope inspected (50 WP-02 files), documentation
  checks/17 probes and whitespace checks passed before the implementation commit.
  No runtime/test/lockfile changes since the recorded 159-test full check; PR body
  distinguishes that local evidence from remote CI and preserves all limitations.
  This completion record is delivered as a follow-up documentation commit; it
  does not change the implementation snapshot or imply maintainer acceptance.
- **Next action:** maintainer reviews PR #2. After PR #1 is eventually merged,
  retarget PR #2 to `develop` only under appropriate authority. No merge or further
  execution follows automatically from this Git-delivery request.

## TASK-008 — Merge open PRs

- **Status/owner:** done; main agent and authorized background agent executed the merge-all
  request. Current open PRs are #1 (`chore/setup` → `develop`) and #2
  (`feat/wp-02-contracts` → `chore/setup`). No other open PR was returned.
- **Scope/authority:** merge these PRs, retarget #2 to `develop` after #1 merges,
  and verify final remote state. No new implementation, bypass/force push, branch
  deletion, release or deployment. Local TASKS bookkeeping is not a new commit
  authorization; keep it uncommitted unless separately requested.
- **Starting evidence:** working tree clean on `feat/wp-02-contracts` at
  `a4dd2b1`; repository default is `develop`, merge commits are enabled and
  automatic branch deletion is disabled. #1 is clean/mergeable with two successful
  foundation checks; #2 is mergeable but its two foundation checks are running.
- **Done when:** both PRs report MERGED, `develop` contains the implementation
  ancestry, no open PR remains and checks/limits are accurately recorded.
- **Progress:** PR #1 merged as `d20f7858b0c2eb5e21faa7a4cd5ad29dd638c447`;
  fetched remote `develop` and verified foundation ancestry. PR #2 retargeted to
  `develop` through the REST API after `gh pr edit` failed on deprecated Projects
  Classic metadata (its base was checked before retrying with the API). Head
  remains `a4dd2b1`; mergeability is clean of conflicts, but its push/PR foundation
  checks are still running. Waiting via `gh pr checks --watch`; no bypass.
- **Result:** background merge agent verified expected head/base and successful
  pull-request run `45253173078` / push run `45253166314`, then normally merged
  PR #2 as `21e90d29d53dc98284b49355d245aabf5d21eead`. GitHub confirms both PRs
  MERGED, zero open PRs, and `develop`'s merge parents include PR #1's merge and
  expected `a4dd2b1` implementation ancestry. No local files/Git metadata touched
  by the worker. Background shell watcher independently reported both checks pass.
- **Next action:** no further merge work; TASK-009 proceeds locally. Merge grant
  does not authorize WP-03 remote writes or extend worker scope.

## TASK-009 — Plan then implement WP-03 coordinator

- **Status/owner:** done; main agent independently reproduced/fixed session 1
  n1–n2; maintainer explicitly accepted WP-03 and closed the review. Only earlier
  remote-merge work was delegated, not implementation.
- **Authorization:** explicit WP-02 acceptance and “plan first for WP-03 then
  start implementation”. Write/review the bounded plan before feature code; then
  execute locally with installed dependencies and scoped/full checks. No new
  dependency, commit/push/PR, reference modification or later packet authority.
- **Inputs:** accepted wire/vector v1 at `f046b9f`/`a4dd2b1`, existing TASK-008
  local bookkeeping, state/query/shared rules, WP-03 and AC-03/05/08–11/24/25.
  Local branch remains `feat/wp-02-contracts` at `a4dd2b1`; remote merge status is
  independent of the accepted artifact used by this task.
- **Paths:** [WP-03 plan](docs/planning/wp-03-implementation-plan.md); controller
  and hook modules; root exports; controller/type/packed/browser fixtures and
  discovery/config needed to execute them; affected README/contracts/evidence/
  task/review docs. No HeroUI components/native bridge/resource fetching or .repo writes.
- **Done when:** plan precedes code; pure command/reset/validation, controlled
  proposal/accept/reject, stable subscriptions/selectors/hooks and explicit
  definition replacement pass scoped and packed strict TS 6/5.9 checks, React
  fixture and full local checks; exact evidence and deferred gates recorded.
- **Stop rules:** source conflict, partial controlled commits, unsafe errors,
  hidden clocks/optimistic state, dependency change or native/UI/resource expansion
  returns for review. No skipped declarations, fake exports or weakened policy.
- **Progress:** plan written/reviewed and documentation/17 probes/whitespace
  checked before feature edits; two initial failing vectors captured. Candidate
  reducer/controller/proposal/subscription/replacement/hooks now implemented.
  Scoped controller tests, local typecheck, isolated packed TS 6/5.9/runtime and
  real React hook/browser checks passed during development. Reviewed malformed
  commands, definition identity, listener cleanup and controlled reset paths;
  extended coverage and final docs are ready for integrated verification.
- **Delivered:** immutable definition/state/presentation validation, pure commands
  and scoped resets, complete controlled proposals/accept/reject/selection override,
  stale/cross-instance guards, subscriptions/notification failure handling,
  explicit typed definition replacement/disposal and three React read hooks.
  Root is no longer a scaffold; contracts/filters retain accepted server-safe
  behavior. No dependency/peer/export-subpath or lockfile change.
- **Initial verification (before review session 1):** `pnpm check` passed fresh frozen install, lint, strict
  package/Storybook/harness types, **196 unit tests** (155 contracts + 37 controller
  + four foundation), 17 docs probes, exact 46/7-file tarball allowlists, isolated
  strict-peer/frozen installs, TS 6.0.3/5.9.3 positive/negative consumers, guarded
  contract/runtime/controller invocation, actual packed bare React server render,
  Vite bundles, static Storybook and **two Chromium tests** (existing vendor/axe
  smoke plus React StrictMode accepted-state/selector fixture). Inspected emitted
  declarations with no vendor/React/Node/DOM type leakage and reviewed changed
  source/fixtures/exports. First full run hit the host 120s limit during isolated
  styled install; rerun with 600s completed. No assertion failures were hidden.
  [Evidence](docs/evidence/wp-03-controller-2026-11-23.md) records exact hashes and limits.
- **Review scope:** `hooks/state.ts`, `controller/validation.ts`, associated
  browser/pure/packed regressions and affected protocol/evidence/review/TASKS docs.
  Preserve committed-versus-rendered selector distinction, valid initialization
  defaults, invalid-command atomic rejection and all unrelated working changes.
  No new dependency, public API, delegation or Git operation is needed.
- **Review progress:** independently reproduced n1's inline effect count 2→3 with
  unchanged controller state, and all four n2 null direct/functional cases failing
  to reject. Fixed committed selector identity reuse and omitted-only defaults.
  Final `pnpm check` passes **208 tests** (155 contracts + 49 controller + four
  foundation), strict types/lint, 17 docs probes, exact packing/import/peer checks,
  TS 6.0.3/5.9.3 and packed invalid-column runtime/server-render invocation, static
  Storybook and **four Chromium tests** (three controller plus vendor/axe smoke).
  Inspected corrected sources and declarations; no public API/type/dependency
  change. Updated artifact fingerprints are in the scoped evidence report.
- **Acceptance:** explicit “I accept WP-03” after the n1–n2 corrections. Accepted
  reviewed runtime/declarations correspond to the tested core tarball SHA-256
  `600f17bd9eedaa653d567f049e0ffbf7e9440ee419852b45df21fd477d2abf65`
  (before acceptance-only Markdown edits). At acceptance source was uncommitted
  on `a4dd2b1`; TASK-010 now records its implementation commit, not a release.
- **Next action:** authorized Git delivery is tracked in TASK-010; next-packet
  execution remains separately authorized.
  No WP-04 native bridge, WP-05 resource, UI, full SSR/G-gate or
  release acceptance is implied. WP-03/acceptance/merge bookkeeping stays local
  and uncommitted at acceptance; TASK-010 records the subsequent Git delivery.

## TASK-010 — Commit accepted WP-03 and create a PR

- **Status/owner:** done; current agent delivered and verified the bounded
  Git handoff. TASK-009 acceptance/review closure remains unchanged.
- **Authorization:** explicit “commit then create pr”. Create a new branch,
  commit accepted WP-03 source/tests/plan/review/acceptance/docs and preserved merge
  bookkeeping, push and open a PR to `develop`. No merge, force push, branch
  deletion, new implementation, next packet, publication or deployment.
- **Starting state:** local `feat/wp-02-contracts` at `a4dd2b1` with known WP-03
  tracked/untracked edits. Fetched `origin/develop` at merged `21e90d2`; its tree is
  identical to local HEAD and contains that ancestry. GitHub lists zero open PRs.
  No local or fetched remote `feat/wp-03-coordinator` branch exists.
- **Branch/paths:** create `feat/wp-03-coordinator` from `origin/develop`, carrying
  the existing work without reset/discard. Stage only the reviewed controller/
  hooks, root exports, test fixtures/config/discovery, plan, contracts, acceptance,
  evidence and ledger changes. No ignored generated output or `.repo/` files.
- **Done when:** scoped snapshot committed and pushed, PR open with correct
  head/base and honest local-check scope, remote/local heads agree and worktree
  clean. Record implementation SHA and PR URL in a documentation-only handoff.
- **Checks:** reuse recorded 208-test/four-browser full verification for unchanged
  runtime. Rerun actual documentation/17-probe and whitespace checks for handoff
  edits, inspect staged scope and verify remote PR metadata. No CI pass invented.
- **Delivered:** implementation commit
  `4f151d7629fb71fc5e4bfa29b4c774f37d3a1407` on `feat/wp-03-coordinator`, pushed
  with upstream tracking. [PR #3](https://github.com/mohamedtsx/tableweave/pull/3)
  is OPEN/non-draft with base `develop` and the expected head branch. Verified
  implementation SHA against both PR metadata and remote ref; worktree was clean
  before this documentation-only completion update.
- **Verification/handoff:** staged scope inspected (39 reviewed WP-03 files);
  documentation checks/all 17 probes and staged whitespace checks passed before
  commit. No runtime/test/dependency changes since the recorded 208-test/four-
  browser full run. PR body distinguishes local proof from remote CI, retains
  native/resource/SSR/release limits and records explicit packet acceptance.
  This final record is a follow-up documentation commit, not another feature.
- **Next action:** maintainer reviews PR #3. No merge, further Git action or
  next-packet implementation is inferred from completing this request.

## TASK-011 — Delegated WP-04–WP-15 coordination

- **Authorization:** current explicit user request covers plan → implementation →
  numbered independent/self review → correction/verification → delegated agent
  engineering approval → commit/push/new PR for each packet. It explicitly allows
  agents and explicitly forbids merging PRs. Human personal review is later.
- **Approval meaning:** label every disposition **agent-approved under delegated
  authority**, never “maintainer personally reviewed/accepted”. No approval may
  invent a gate pass, replace manual/real-consumer evidence, waive product scope
  or override a demonstrated technical failure. Block required missing proof.
- **Ownership:** main agent exclusively owns TASKS/REVIEW, shared entrypoints,
  manifests/lockfile, integration and Git/PR writes. Workers receive disjoint paths
  or worktrees; read-only research agents cannot edit or install/build.
- **Dependency/PR policy:** accepted WP-03 is `4f151d7` plus `b2974fc` handoff.
  PR #3 remains open. Create WP-04 from that branch, then stack subsequent packet
  PRs without merges/rebases that discard history. Each PR states its dependency,
  exact implemented scope/checks/limits and delegated-not-human approval.
- **Stop boundaries:** no `.repo/` mutation or consumer modification without a
  concrete writable target; no real data/services/secrets, npm publication,
  deployment, legal/publisher assumption, fake manual AT/Safari/runner proof.
- **Next action:** complete actual-release G-01 research, write the bounded WP-04
  plan before code, allocate nonoverlapping implementation and review workers.

## TASK-012 — WP-04 native/collection feasibility

- **Status:** in progress; main agent coordinates. Read-only v9/v3 research is
  complete; native worker owns `packages/react/src/tanstack/**` and `tests/native/**`
  except `collection`; collection worker owns `packages/heroui/src/table/**` and
  `tests/native/collection/**`. Main owns all shared paths/build/Git integration.
  Installed HeroUI stock leaf columns do not expose grouped construction; the
  collection worker must prove a public collection-branch adapter, including
  uneven-depth/utility columns. A flat fallback cannot pass G-01.
  Implementation workers have now handed back corrected candidates; main owns
  integration/follow-up fixes and two independent reviewers are read-only. Native
  correction uses declared exact core9.3.1 commit frames; main added coordinator
  preacceptance constraints and visibility/group action regressions. Original
  native n1–n3 and sorting/row n4 independently pass; group-visibility follow-up
  and collection n6 are in final rereview. No packet approval yet.
- **Scope/requirements:** WP-04, G-01, AC-01/03/13/23/25; actual native per-slice
  control, composite predicate carrier, local filter/sort/page vs manual server,
  grouped HeroUI collection and subscribed stable-ID leaves.
- **Paths:** `packages/react/src/tanstack`, minimal `packages/heroui/src/table`,
  exact root exports, isolated native/browser/type/consumer fixtures and bounded
  runner/pack/config changes; plan/protocol/evidence/review/task docs.
- **Done when:** actual installed v9/v3 evidence, pure/native/real-browser/ARIA/
  packed checks pass and an independent numbered review is resolved. Candidate
  bridge must not expand over G-01 failure or fake v8/global state callbacks.
- **Next action:** synthesize read-only API research into the plan and precise
  producer interface, then assign implementation paths before writing feature code.
  The [bounded plan](docs/planning/wp-04-implementation-plan.md) is written before
  feature edits. Work is on `feat/wp-04-native-bridge` from accepted `b2974fc`,
  preserving PR #3. Supplementary prototype read was Figma-session/read-only;
  no design artifacts or source/reference runtime files were imported.
  Native candidate is root-integrated/preliminary-packed; independent review
  reproduced four defects now assigned back to the native worker. Collection
  worker integrates real native models after nine static Chromium probes; main
  applied the planned strict declaration repair (same runtime versions) and
  verified exact patch-only changes/frozen reapplication. G-01 remains unpassed.
  Independent collection review added WP-04 n6: Home/End focused hidden padding;
  worker reproduced/fixed both exact cases and passes 14 static Chromium checks.
  Main runs complete workflow after standardizing ignored artifact paths; final
  independent rereview and real renderer/public packed evidence remain required.
  Collection n6 now independently resolves (14 static/96-chord matrix/ten extra
  probes). Reviewer identified a one-commit-late test-only filtered-ID diagnostic;
  main corrected it to an after-commit read with data/state dependencies (n7).
  **Technical outcome:** agent-approved under delegated authority for tested
  WP-04/G-01, not personal maintainer acceptance. `pnpm check` passes 241 unit,
  32 Chromium, strict public unpatched TS6.0.3/5.9.3, real renderer/native tarballs,
  reachable declaration/import/CSS/sortable guards and 18 docs probes. Both
  independent reviewers recommend scoped correction approval with no outstanding
  verified defect. Main also inspected the real generated accessibility tree.
  Evidence/source fingerprints/archive hashes are recorded. Next: final docs/
  whitespace checks, commit/push and PR to `feat/wp-03-coordinator`; no merge.
  **Git delivery:** implementation `b165550` committed/pushed on
  `feat/wp-04-native-bridge`; [PR #4](https://github.com/mohamedtsx/tableweave/pull/4)
  is open to `feat/wp-03-coordinator`. Initial staging omitted the already-tested
  `patches/` directory; this follow-up includes the exact reviewed patch/license/
  notes referenced by the lockfile, with no runtime/source-byte change. Final
  docs/whitespace passed (77 Markdown/490 local links/18 probes). Verify final
  pushed head/PR state, then stack resource commit `71f076c`; never merge PRs.
  Final local/remote/PR #4 head verified equal at
  `bf7712eed7c29203172e168c4c0bfa4ed102b021`; PR remains OPEN and working tree
  was clean before the WP-05 branch was created. No merge.
  GitHub later reports both `foundation` checks SUCCESS on PR #4 head `bf7712e`;
  state remains OPEN. Remote CI success does not authorize merging it.

## TASK-013 — WP-05 independent resource producer

- **Status:** plan/implementation in progress in isolated
  `/tmp/opencode/tableweave-wp05`, branch `feat/wp-05-resource`, from accepted
  `b2974fc`. This packet depends on WP-02/WP-03, not G-01; no feature expansion over
  the still-unproven collection bridge is implied. PR delivery follows WP-04.
- **Owner/paths:** resource worker writes its plan before feature code, then only
  `packages/react/src/resource/**` and `tests/resource/**`; main handles exports,
  shared configuration, independent review, ledger and Git/PR delivery. Existing
  vendor node_modules may be symlinked; no new dependencies/installs authorized.
- **Requirements:** WP-05/G-03, AC-14–AC-17; tagged request/scope/query identity,
  bounded last fresh presented snapshot including empty, truthful page provenance,
  guarded uncancellable late responses, Retry current request, safe public errors,
  synchronous access-loss suppression and lifecycle cleanup. App owns fetching,
  permission decisions, option-label cleanup and persistence.
- **Done when:** actual strict types and deterministic race/React lifecycle tests
  pass, independent numbered review fixes are verified and exact limits recorded.
  No Query cache, resource buffer persistence or placeholder promotion.
- **Next action:** worker produces plan + tested isolated producer; main reviews
  and integrates after WP-04 handoff without merging PRs.
  Independent review reproduced Suspense hide being mistaken for unmount; worker
  added failing ready/pending regressions and corrected effect lifetime. Fresh-
  copy independent rereview passes 47 unit/11 browser, nine independent races,
  three corrected-original/revocation checks and both TS versions; recommends
  scoped producer approval with no residual verified defect. Main has integrated
  isolated exports/discovery/packed probes and is running the full workflow.
  Initial integrated run found a runner-only React resolution gap; fixed with
  genuine installed-package aliases, not workspace Tableweave source aliases.
  Full isolated `pnpm check` now passes: 255 unit, 15 Chromium, both unpatched
  NodeNext packed TS versions, runtime/bundle guards and 17 baseline docs probes.
  Main records **agent-approved under delegated authority** for the tested
  resource/G-03 producer boundary (not personal maintainer review or combined
  native proof). Isolated transport commit `71f076c` is ready; no push/PR yet.
  Next: finish WP-04, create the final WP-05 stack branch, cherry-pick the reviewed
  resource commit, reconcile shared integration paths and rerun combined checks
  before its separate PR. Dependency symlinks were explicitly excluded from Git.
  **Stack integration:** created `feat/wp-05-resources` from complete WP-04
  `bf7712e`, cherry-picked transport as `e6eeabf`, preserving both native/resource
  root APIs, test discovery, renderer/strict declaration/type/bundle guards and
  all browser runners. Eight expected shared-path conflicts were reconciled by
  combining both sides, not dropping producer APIs/checks. Lint/whitespace and
  conflict-marker checks passed. Combined `pnpm check` now passes **288 unit/
  43 Chromium**, both unpatched public TS6/5.9 native/resource/real-renderer
  consumers, all declaration/import/CSS/sortable guards and 18 documentation
  probes. Main extends scoped delegated WP-05/G-03 approval to this combined
  handoff; fingerprints match the reviewed resource code. Final docs/checks,
  handoff commit/push and PR to `feat/wp-04-native-bridge` are next. No PR yet.
  Final postapproval Markdown/whitespace passed: 80 Markdown /508 local links and
  all 18 checker probes. Runtime suite preceded only these Markdown status edits.
  **Git delivery:** code `e6eeabf`, combined approval `2be951a`, pushed on
  `feat/wp-05-resources`; [PR #5](https://github.com/mohamedtsx/tableweave/pull/5)
  is OPEN to `feat/wp-04-native-bridge`. This handoff records its actual URL and
  completion; final pushed-head equality is checked after this Markdown commit.
  No merges, publication, deployments or extra consumer/reference changes.

## TASK-014 — WP-06 actual Start/Query SSR integration

- **Status:** bounded plan approved under delegated engineering authority before
  source/install, in isolated `/tmp/opencode/tableweave-wp06` on
  `work/wp-06-start-query` from `e6eeabf`. Both producers have scoped technical
  approval; main finishes combined WP-05 checks/Git delivery in parallel. Final
  WP-06 stack/acceptance waits for that combined handoff. No shared module links.
- **Read-only research:** compatible Start/Router/Query/SSR integration profile
  identified on 2026-11-24 without installs: Start 1.168.61, Router 1.170.42,
  router-core 1.171.35, Query/query-core 5.108.4 and react-router-ssr-query 1.167.3
  with accepted Vite 7.3.8/plugin5.2.0. Current Start1.169.7 needs Vite8; do not
  silently upgrade root/Storybook or force peers. These are candidates, not passes.
- **Install scope:** main independently rechecked all six exact registry versions/
  peer/engine metadata. App manifest pins those, existing React/DOM19.3.1/Table9.3.1,
  Vite7.3.8/plugin5.2.0, TS6.0.3/React types19.3.0/Node types24.19.2/Playwright1.65.1.
  Only app integration dependencies; no core Query/router/Start import. Metadata
  is not a security audit or installed compatibility pass. Main owns isolated
  install/lock/shared config; worker will own app source and `tests/start/**`.
- **Requirements/paths:** WP-06/G-04/AC-22–24; request-local clients, one hydration
  owner, real HTML-before-JS, two-scope and same-key canary, stable bootstrap,
  actual isomorphic abort/RPC, validation/manual-page/resource/race/metadata
  integration and real packed consumer. Port6013, isolated artifacts. Default
  resource server snapshot is empty, so explicit authorized bootstrap proof is
  required; no pretend SSR-data pass. No real auth/backend/consumer write.
- **Next action:** install the planned profile in the isolated worktree, inspect
  strict peers/build-script diagnostics, then assign app implementation. No forced
  peers/strictness suppression or blanket tooling/runtime upgrade. Publication,
  deployment, manual AT/device/performance/legal acceptance remain separate.
  **Install/assignment result:** isolated strict install passed (five projects,
  366 packages), only the existing glob deprecation warning; no forced peers or
  unreviewed build-script exemption. App worker now owns the assigned app/tests
  paths and may run isolated builds/SSR/browser proof on6013. Main retains all
  manifests/lock/shared checks/docs and Git; root integration happens after the
  producer PR handoff. WP-07 has a separate read-only planning agent, no runtime
   implementation assigned yet.
  **Current candidate:** WP-05 final handoff is incorporated (`9c62b31` carries
  `3e4aaa8`). Actual Start app/production host and shared/root/actual-tarball
  runners are implemented. Exact declaration/dependency repair passes unchanged
  strict TS6/5.9 without runtime version/byte changes. Initial13+13 source/packed
  scenarios missed verified review findings; no approval followed those passes.
  n2–n4 are independently corrected. New bootstrap denial n5 is now returned with
  before-failing evidence and27 dev/27 production/both TS checks reported passing;
  independent rereview and refreshed full/root/actual-tarball workflow remain.
  [Evidence](docs/evidence/wp-06-start-2026-11-24.md) and
  [review](REVIEW.md#wp-06--delegated-agent-review-session-1) record exact limits.
  Main owns shared integration/Git; no G-04 acceptance, release/deploy or merge.
  Independent n5 rereview resolves the last source defect (27+27 and two extra
  probes per mode, exact25-file hash). The30-minute full run passes all earlier
  stages including43 baseline/54 source/27 packed-development browser cases, then
  times out in the final packed-production suite after one pass. No assertion
  failure/full-pass claim. Main verifies/stops only that owned6013 server, adds
  explicit consumer type dependencies/resolution confinement (Start721 files per
  compiler already pass), and starts the complete guarded run with45-minute
  host/CI headroom. Behavior deadlines/retries and strict settings stay unchanged.
  **Final integration:** corrected guarded pnpm check passes289 units,43 baseline
  Chromium,27+27 actual source Start and27+27 actual tarball Start cases. Both
  compiler versions and confined declaration installs pass;25 source and packed
  files match independent review hash. n1–n6 resolved; bounded private WP-06/G-04
  is **agent-approved under delegated authority**, not personal maintainer/real-
  consumer/AT/performance/release acceptance. Next: commit, stack on actual PR #5,
  push/open separate PR and verify remote checks. No merge/publication/deploy.
  **Git handoff:** source transport `f3507c1` was stacked as `a7d0863` on the actual
  reviewed PR #5 head `3e4aaa8`. Pre-stack and stacked trees are byte-identical;
  base ancestry verified. Pushed `feat/wp-06-start-query`; open PR #6 targets
  `feat/wp-05-resources`. GitHub confirms OPEN and auto-merge disabled. Both
  foundation checks are running at this handoff; main will verify their result.
  No PR merge or further source changes are inferred from creating the PR.
  **Remote n7:** both cc88f21 checks fail before app typecheck because clean CI has
  no ignored generated router. Main independently reproduces from source without
  that file, then adds actual framework build-before-tsc and excludes/asserts the
  file absent in packed preparation. No runtime app-source or strictness change.
  Fresh source/actual-packed/remote correction proof is now required; no green CI
  or completed packet-delivery claim. PR #6 remains OPEN/unmerged.
  Fresh cold source and root typechecks now pass, and fresh genuine pack:start
  passes27 dev/27 production with both strict compiler/721-file confinement guards.
  Standalone app starts without generated routes and creates them via actual
  framework build. Independent narrow n7 review is active before corrected push;
  final remote workflow still required. No runtime25-file or archive change.
  Independent cold n7 review now resolves the finding: real generation/strict
  TS6+5.9, real packed preparer exclusion/ENOENT and CI ordering verified,25-file
  source/archive hashes unchanged. Main approves the narrow correction under
  delegated technical authority. Next commit/push to existing PR #6, then verify
  its final remote checks. No merge or new packet approval is implied.
  **Corrected remote result:** source222c97f's push/PR foundation jobs both pass,
  runs45315481726 and45315488925. PR #6 remains OPEN, auto-merge null, exact head
  222c97f4390ee32668d2c5a6908b878dc475516e. This final documentation-only handoff
  preserves those results; main verifies its final pushed head/checks separately.
