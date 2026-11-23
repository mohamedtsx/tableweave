# Dependency-ordered delivery plan

This is a proposed sequence, **not live status, staffing, a date commitment or
permission to execute**. [TASKS](../../TASKS.md) owns actual authorization/status;
[worker workflow](../agents/workflow.md) owns readiness, single-writer rules and
handoff. Every execution task references a bounded [work packet](work-packets.md).

## Starting point

Documentation foundation → maintainer reviews HLD-derived baseline and authorizes
first slice (TASK-002) → workspace bootstrap → evidence-backed feasibility →
incremental capabilities → complete stable acceptance. Source APIs remain
proposals until their gates/types/consumers prove them. Prereleases can be partial;
stable cannot omit dragging or other agreed capabilities.

## Sequence and dependencies

| Packet | Output | Depends on | Proof/decision boundary |
| --- | --- | --- | --- |
| WP-00 | Reviewed visual system/scenes and story mapping | Baseline review; explicit design target/write authority | F-01–F-22, not runtime proof |
| WP-01 | Executable workspace, package/build/test/story/pack foundation | Baseline review; install/implementation authority | Honest reproducible commands/empty-entry boundaries |
| WP-02 | Serializable schema, operators, conformance fixtures | WP-01 | Inferred types, validation, date/null/owner semantics |
| WP-03 | State/query coordinator and controlled groups | WP-02 | Atomic transitions, selection policy, no hidden mirrors |
| WP-04 | TanStack/HeroUI native collection bridge | WP-02, WP-03 | G-01; fix adapter before feature expansion |
| WP-05 | Resource adapter and retained-data/race fixtures | WP-02, WP-03 | G-03; can work independently of final UI polish |
| WP-06 | Primary Start + Query SSR example | WP-04, WP-05 | G-04; exact request/cache/hydration evidence |
| WP-07 | Builder/search/tabs/date/async option UX | WP-04, WP-05; relevant WP-00 decisions or explicitly approved provisional visuals | Operators/ownership/drafts/Clear and stories |
| WP-08 | Sorting/selection/pager/column controls | WP-04, WP-05; reviewed relevant visuals | Lifetime, known/unknown/stale metadata, utility/visibility |
| WP-09 | Custom details, locale/theme/responsive composition | WP-04, WP-05; reviewed relevant visuals | Arbitrary slots, close/focus, RTL/narrow |
| WP-10 | Optional row/column sortable adapter | WP-04, WP-05 | G-02; all required inputs/identity/recovery |
| WP-11 | Complete examples, recipes and Storybook catalog | WP-06–WP-10; relevant WP-00 coverage | Domain reuse, Vite/Next/headless, F/story map |
| WP-12 | Integrated browser and manual accessibility review | WP-11 | Supported matrix/AC-21, not axe alone |
| WP-13 | Packed consumer/type/export/peer/release-tooling verification | WP-11 | Package portion of G-05; can develop early fixtures after WP-04 |
| WP-14 | Reference benchmarks and bundle baseline | WP-11, WP-13 | Performance portion of G-05 |
| WP-15 | Authorized real-consumer validation and release readiness | WP-12–WP-14; actual consumer permission | Full stable gates; publication separate |

Dependencies mean accepted artifacts needed for **packet completion**. Preparatory
research/test vectors/consumer harness work can proceed earlier if authorized
and it does not guess unfrozen interfaces. WP-00 does not block pure contracts;
do not impose an invented all-design-complete-before-code gate. Visual departures
or provisional treatments must be reviewed before UI acceptance.

## Concurrency lanes, if authorized

- After bootstrap: design/source/test-vector work alongside core contracts.
- After contracts/coordinator: WP-04 native bridge and WP-05 resources, with
  agreed controller/resource interface and different file ownership.
- After G-01/G-03: integration, tool UX, details and sortable workers may have
  independent paths, but one writer owns shared types/manifests/lockfile.
- Package and benchmark harnesses may be prepared before feature completion;
  final passes use the integrated exact revision, not isolated earlier builds.
- Accessibility review is continuous; WP-12 integrates coverage, not the first
  time focus/keyboard behavior is considered.

The coordinator must allocate shared `DataTable`/controller/default-definition
edits rather than letting several workers overwrite them. Subagent sessions are
not authorized merely by these lane descriptions.

## Review checkpoints and stop conditions

1. **Baseline:** HLD review disposition, authorized scope, actual tools/paths.
2. **Core feasibility:** G-01/G-03; no feature expansion over broken ownership or
   collection/resource semantics. G-02 gates sortable adapter freeze, G-04 SSR.
3. **Composition:** all FRs, complete states/stories/three domains, reviewed scenes.
4. **Stable readiness:** exact packed consumers/types/browser/manual/performance/
   real-consumer/legal/publication inputs. No earlier count implies current pass.

If a dependency cannot meet PRD, stop affected expansion, record evidence and
review an adapter/version/architecture alternative. Do not drop drag, weaken
All/Any or keep private stale data to preserve a library choice. Missing npm or
private-reporting inputs block publication, not unrelated authorized development.

## Suggested first authorized task

After TASK-002, allocate TASK-003 to WP-01 with explicit local implementation and
dependency-install authority, exclusive foundation paths, no publication/no Gamila
changes, and verified README commands as output. This is a suggestion to the next
coordinator, not an already assigned/started task.
