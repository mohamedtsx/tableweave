# Read-only Gamila assessment

Reviewed 2026-11-23 for Tableweave documentation practices. Optional local source:
`.repo/Gamila`; no runtime code/assets/business policy was copied. Local Git
object HEAD and staged original submodule object both identify
`2c7b69444480a7fbb8547db096d1628cf09ee502`. This identifies an object, not proof
that every reference working-tree file equals that commit.

## Material inspected

`AGENTS.md`, `PROJECT.md`, `TASKS.md`, `product/README.md`, `docs/README.md`,
`docs/reference/source-manifest.md`, `docs/engineering/stack.md`, reusable-table
sections of `docs/engineering/supplier-bookings-plan.md`, `docs/design/README.md`,
`docs/design/storybook.md`, `docs/evidence/README.md`, and documentation/feature/
verification skills with task-tracking/coverage-audit references. This was a
targeted documentation/source reading, not running its application/tests or a
full code/security audit. Historical evidence in Gamila proves only its own scope.

| Practice/observation | Disposition | Tableweave adaptation |
| --- | --- | --- |
| Short bootstrap/project map + task-sized routers | Adopt | Root bootstrap and focused product/technical owners; traceability is lookup |
| Canonical product/contracts/procedure/evidence ownership | Adopt | Separate PRD intent/HLD proposal/API proof from dated results |
| Source IDs, edit metadata, completeness caveats/fingerprints | Adopt | Two-page manifest and FR/D/ADR/G/F coverage, no invented missing counters |
| One live task ledger and resumable handoff | Adopt | TASKS statuses, scoped packets and worker templates; no competing progress boards |
| Triggered skills rather than huge default context | Adapt | Five small Tableweave procedures; no wholesale vendor-skill bundle |
| Reference repositories ignored/read-only | Adopt | No dependency on `.repo/` or repair during this assignment |
| TanStack model + thin HeroUI/Aria collection bridge | Adapt | Validate G-01; source notes warn collection/state/subscriptions are a real boundary, not drop-in proof |
| Stable IDs, manual server pages, authoritative counts | Adopt concept | Product defaults and known/unknown totals govern, not Gamila's fixed 20-row booking page |
| Controlled state/native per-slice callbacks and reactive v9 reads | Adapt | One transaction coordinator with no independent atom mirror/removed global callback |
| Storybook real primitives/tokens/synthetic states | Adapt | Dedicated planned app, shared fixtures; no business backend requirement and no copied commands |
| Risk-based checks and boundary-specific evidence | Adopt | Contract/component/SSR/tarball/manual/benchmark distinctions; integrated checks after worker composition |
| Exact versions from actual manifests/lockfile | Adopt procedure | Recheck compatible peers at bootstrap; reference patch versions are not our lockfile |
| Three app realms, bookings/finance/auth/database/outbox rules | Reject inheritance | Library owns none of those domains/services |
| Fixed booking page size/order, deferred bulk selection, URL-authoritative app state | Reject inheritance | Tableweave approved pagination/selection and optional-only persistence govern |
| Gamila gold/fonts/editorial/portal-specific language and primitives policy | Reject inheritance | HeroUI-aligned configurable tokens/locale, semantic markup; no copied brand or blanket HTML prohibition |

The inspected table recommendation explicitly distinguishes v9 `useTable`/
registered features/subscriptions from v8 snippets; warns partial pages cannot
establish full selection scope; and separates model/rendering/app ownership.
Those lessons reinforce G-01/G-03, not evidence they already passed in Tableweave.
Gamila's older intake may say an integration was not yet installed; later stack
docs describe mounted work. Both are dated context, not instructions to copy a
historical dependency status.

## Local metadata limitation

Plain `git -C .repo/Gamila rev-parse HEAD` failed because submodule core worktree
metadata still points at the previous `.repos/Gamila` path. Reading the object
with explicit `--git-dir` and `--work-tree` returned the revision above without
repairing configuration. Existing root staged `.gitmodules`/`.repos/Gamila` and
working `.repo/` relocation are user work. Leave them untouched; documentation
does not depend on fixing or initializing a reference checkout.
