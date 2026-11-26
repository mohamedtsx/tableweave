# Exact-candidate readiness protocol

This is a review protocol, **not an acceptance report or permission to execute**.
[Product release gates](../../product/release-gates.md) own requirements;
[AC-26–AC-29](../../product/acceptance.md#ac-29-authorized-consumer-and-release),
[release operations](releasing.md), [evidence conventions](../evidence/README.md)
and [TASKS](../../TASKS.md) retain their respective owners. Use the paired
[consumer protocol](consumer-acceptance.md), not a second task board.

## Claim record — TEMPLATE / NO OBSERVATIONS

Create a dated record only for an explicitly selected candidate and audience.
Empty/missing/skipped/truncated evidence is not zero failures or a pass. Use
`NOT_RUN`, `UNVERIFIED`, `BLOCKED` or `USER_DEFERRED` until an actual scoped result
and reviewer disposition exist. Name missing owners as unconfirmed, not invented.

| Field | Required record; no result supplied by this form |
| --- | --- |
| Claim and audience | Exact capability/requirement and AC/G owner; private component, limited prerelease or whole stable library; explicit exclusions. |
| Identity | Candidate revision and dirty-state/patch identity, individual packet revisions, date, selected source/config/tool/dependency/profile inputs. |
| Observation | Exact authorized target/environment, command or manual method, executor/authority, actual outcome including failures, sanitized durable artifact references. |
| Review | Reviewer/authority, scope accepted or rejected, open numbered findings, untested boundaries, superseded evidence and exact next proof. |
| Decision | Proposed NO-GO or bounded candidate recommendation; remaining blockers and separate operation permissions. No self-approval from a completed form. |

### Follow the artifact, not the passing count

Record linked identities at every transition; stop the claim at the first missing
link. A filename, descriptor or supplied approval hash does not replace conformity
checks on the actual artifact or an independently reviewed observation.

1. Reviewed source/config/lock/tool/profile inputs → actual emitted paths, modes,
   sizes and hashes. Keep source and emitted-output identities distinct.
2. Genuine archive hashes/member maps → inspected manifest/exports/declarations,
   styles and side effects, client directives, notices/license contents and allowed
   files; no source-copy pseudo-emission or `.repo`/development material leakage.
3. Fresh standalone frozen consumer lock → actual installed package/peer/profile
   files and compiler/runtime realpaths. No source aliases, workspace/hoisted module
   exemptions, ambient configuration or automatic patch/profile fallback.
4. Actual strict TS6.0.3/TS5.9.3 positive and intentional negative/rejection results,
   local imports/bundles, framework generation/build/HTTP/SSR/hydration/browser
   observations. Missing dependencies or arbitrary500 responses are not semantic
   rejection proof; compiler success is not JS/helper or browser execution.
5. Exact packet **and** cumulative CI revision/job/environment/artifacts, manual
   accessibility/supported real-device coverage, approved reference-performance
   observations and an authorized real target. Do not transfer results between
   these boundaries or invent AT/browser/hardware versions or paint timings.

Ordinary unpatched consumers are canonical. Explicit RAC runtime and Start SDK
declaration profiles require separate main selection, actual archive/asset and
installed byte/registration checks; record independent ordinary before/after
integrity where applicable. Preserve ordinary failures, profile limits and cleanup
debt. Never install/register a private repair merely to obtain green output.

## Evidence classes and current source boundary

Historical WP-01–03 maintainer acceptance and WP-04–08 scoped delegated results
retain their original revisions/limits; neither establishes a current whole-table
release. WP-09–14 source handoffs are provisional: types, syntax, hashes/seals and
authored fixtures do not prove a current archive/import/browser/AT/paint/benchmark
instance. Preserve `fc01`, historical180-versus199 results and original producer
maps/raw failures; do not regenerate, re-sign or relabel them as new-candidate proof.
Retain review22–32 findings with source-fix versus runtime-reproduction/independent
closure explicitly distinguished; never bulk-close them from a type or doc pass.

At this document's supplied `f60df08` baseline, [REVIEW32](../../REVIEW.md) records
provisional WP-14 source intake with open profile-closure and bounded-cleanup
corrections. That is not generator/statistics/driver/browser/paint/performance proof;
this protocol does not inspect active correction work or claim its closure.
Live progress stays in TASKS. Follow the [one FINAL phase](../planning/final-verification-phase.md)
and [WP-15 boundary](../planning/work-packets.md#wp-15-real-consumer-and-stable-readiness):
ordered source delivery, individual packet provenance and separate unmerged PRs.

**Keep drag/G-02 blocked.** No vendor repair/research/registration or optional adapter
activation follows. Stable still requires all FRs and both drag axes; manual moves
or incomplete-prerelease labeling do not waive that gate or authorize distribution.
Dedicated reference runner, real consumer, manual/AT and supported-device inputs
remain user-deferred; do not reopen those access/provisioning questions here.

## Literal metadata inventory — 2026-11-25

Observed by file/directory reads at the supplied preserved baseline, not registry
queries, a rights audit or a current validation run. [Open publication inputs](../../product/open-questions.md#publication-inputs)
are engineering/legal/operation inputs, not unresolved product scope.

| Source fact | Readiness boundary |
| --- | --- |
| [Root](../../package.json) and [both](../../packages/react/package.json) [packages](../../packages/heroui/package.json): private:true, UNLICENSED, version0.0.0-wp01.0; no owned LICENSE in inspected root/package-root listings. | MIT is selected in release policy, but owned-source rightsholder/attribution/notice and reviewed distribution metadata remain BLOCKED/unconfirmed. No copyright owner is guessed. |
| [RAC notice](../../packages/heroui/compat/rac-table-clone/NOTICE-RAC), its Apache license/profile assets, [HeroUI notice](../../patches/NOTICE-HEROUI) and [TanStack MIT material](../../patches/LICENSE-TANSTACK-MIT) exist. | Separate upstream/patch obligations, not full Tableweave MIT rights or legal clearance. Runtime and development tools, dependencies, examples/assets require scoped review. |
| [Security](../../SECURITY.md) and [conduct](../../CODE_OF_CONDUCT.md) state private reporting routes/operators are unconfigured. | BLOCKED publication inputs; no placeholder email, assumed enabled private advisory feature or SLA. |
| [Changesets](../../.changeset/config.json): changelog/commit:false, access:restricted, privatePackages version/tag:false. | No public version/tag/publish workflow or publisher identity is established by tool presence. |
| [CONTRIBUTING](../../CONTRIBUTING.md) says documentation-only/no workspace; [CHANGELOG](../../CHANGELOG.md) is documentation-only Unreleased/proposed APIs, unlike current private-source README/manifests. | Existing publication-facing wording is separate main-owned correction debt; do not rewrite frozen policies under a new-document lease. |

For each publication input, record fact versus required confirmation, responsible
owner, authority/reference, scope/expiry and disposition: owned MIT notice;
third-party/tool/asset obligations; brand/domain/npm namespace/package rights;
publisher/operator/repository/trusted-publisher identity and credential **scope
references only**; verified private reporting routes; coordinated semver/package
peers, exact version/tag/changelog/migration/known limits; immutable artifacts and
rollback/deprecation plan. Unknowns stay UNVERIFIED/BLOCKED; no names, availability,
accounts, secret values or publishing permissions are supplied by this protocol.

## Commands, CI and operation authority

The actual [workflow](../../.github/workflows/ci.yml) runs on push and pull_request:
frozen install, Chromium OS provisioning, then full `pnpm check`. Draft status is
neither a bypass nor evidence of success. Do not push/open a PR or change the
pipeline to manufacture a readiness result. The [PR template](../../.github/PULL_REQUEST_TEMPLATE.md)
requires actual results and limits, not checked boxes as proof.

[README commands](../../README.md#local-foundation-workflow) describe existing tools,
not authorization to run them. New harnesses are not automatically root-registered;
main must select current recipes/fresh producers and reconcile historical guards
separately. Do not blindly run destructive root build/pack/install in primary or
rewrite old generation expectations. Documentation-only structural checks do not
establish runtime or external gates. No new check registration/environment flag is implied.

A documentation handoff is protocols only, not AC-29/WP-15/stable GO. Required
missing gates remain blocked. Publish, registry queries, demo/consumer deployment,
versioning, Git/CI operations and consumer rollback each need their own explicit
current authority; a candidate recommendation or successful local trial supplies none.
