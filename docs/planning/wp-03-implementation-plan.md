# WP-03 bounded implementation plan

TASK-009: maintainer accepts WP-02 and authorizes **plan first, then implement**.
This plan is written/reviewed before WP-03 feature edits. [TASKS](../../TASKS.md)
owns live status. The merge-only background agent has no local file ownership.

## Outcome, inputs and exclusions

Deliver a pure accepted-state coordinator, atomic command transitions, explicit
controlled-owner proposal/accept/reject and stable subscription/React selector
hooks. Consume accepted wire/vector v1 at `f046b9f` / `a4dd2b1` rather than invent
schema/operator duplicates. WP-02 acceptance, not PR merge timing, unblocks this.

Owners: [state/query](../engineering/state-and-query.md),
[shared rules](../../product/shared-rules.md), [operators](../../product/operators.md),
[WP-03](work-packets.md#wp-03-accepted-state-and-transition-coordinator).
Cover pure portions of FR-01/FR-04/FR-07–FR-10/FR-12–FR-16 and
AC-03/AC-05/AC-08–AC-11/AC-24/AC-25/AC-26. Do not claim complete UI acceptance.

Fresh read-only reference: Gamila engineering architecture's directional imports,
explicit transaction executor/no competing commits and request-local state
ownership. Adapt those principles, not its backend, URL policy or domain code.
No visual work, Figma, HeroUI composition, row-processing engine, TanStack bridge,
resource/async picker, debounce scheduler, row persistence or SSR framework app.

Actual installed baseline: Node 24.22.0, pnpm 10.13.1, React/DOM 19.3.1,
TypeScript 6.0.3/5.9.3, Vitest 5.1.1, Playwright 1.65.1, Vite 7.3.8.
No dependency addition/upgrade is planned or authorized. Use React's installed
useSyncExternalStore API, not a new store or subscription shim. Existing commands
and package boundaries remain authoritative. Root is already a client entry;
contracts/filters remain React-free server-safe imports.

## File ownership and sequence

One writer: main agent. All paths below are bounded to this packet.

| Paths | Purpose |
| --- | --- |
| `packages/react/src/controller/**` | Types, definition/presentation policy, snapshot validation, pure transitions and controller transport |
| `packages/react/src/hooks/**`, root `src/index.ts` | Thin accepted-snapshot/query/selector hooks and deliberate root exports |
| `tests/controller/**` | Pure commands, rejection/atomicity/subscription/lifecycle/type vectors and a synthetic React fixture |
| `tests/browser/controller.spec.ts`, `playwright.config.ts` | Real React mount/selector/controlled fixture proof, not table UI acceptance |
| `tests/consumers/headless.ts`, `runtime.mjs` | Real packed controller/hook type/runtime calls; remove only obsolete root-empty/missing-controller assertions |
| `tests/foundation/{packed-consumers.mjs,boundaries.test.ts,tsconfig.json}`, `vitest.config.ts`, root scripts | Exact new emitted allowlist, discovery/type coverage and scoped check command |
| README/package README, affected engineering/ADR/evidence, PROJECT/AGENTS current-reality notes, REVIEW/TASKS and packet navigation | Document implemented subset, decisions, acceptance and honest evidence |

1. Record plan and acceptance; run docs/whitespace checks **before feature code**.
2. Add failing vectors for builder-only Clear, semantic/no-op resets, duplicate
   rule IDs, invalid/stale commands and rejected controlled transactions.
3. Implement immutable state/presentation validation and pure reducer; no callbacks
   or hidden time/network/storage in reducer. Reuse WP-02 normalization/keys/inverse.
4. Add controller proposal/commit/subscription transport with stale/cross-instance
   guards, then explicit definition replacement and lifecycle handling.
5. Add thin React hooks with cached selector reads and explicit server snapshot.
6. Evolve root/packed guards without weakening deep-import/UI/sortable boundaries;
   execute type/runtime/real-browser tests and full local verification.
7. Inspect actual outputs, fix in-scope failures, record exact evidence and return
   for maintainer review. No commit, push, new PR or later packet auto-start.

## Proposed producer contract to implement

### State and commands

A definition contains the accepted query schema, opt-in selection/details and
minimal leaf presentation metadata (stable ID, hideability, utility and reorder
group). It is not a second column/rendering framework; the future native bridge
derives this metadata from real columns. Definition is immutable per controller.

Snapshot groups: normalized query, stable-ID selection map, complete column
order/visibility and details row ID. Include revision, cached filter/request keys
and explicit evaluation clock. Freeze accepted snapshots and preserve reference
identity on no-op; subscriptions only observe committed state.

Commands: builder commit/duplicate/negate/remove/join/Clear; committed search,
tab/date/context or complete-query replacement; sort/page/size; selection update,
eligible-current-page select/deselect and Cancel; visibility/order; details open/
close; explicit clock tick and tagged known-page-count correction. Support value
or functional updates for managed native-like slices, without importing native
setters or implementing WP-04. Query input remains schema-specific and validated.

Rule/row/column IDs are not indices. Duplicate needs a new supplied editor ID;
invalid/incomplete input preserves accepted query. No draft state or editor Cancel
enters the applied-state reducer; final membership removal uses Remove explicitly.
No default global reset/fetch/persistence command.

### Transition/reset policy

- Compare candidate semantics to **cached accepted** filter keys, not old/new
  queries both resolved at the new clock (which would hide a relative-date tick).
- Effective filter change resets page 0 and selection by default; tab scope change
  also clears selection even if predicates are equivalent. Other independent
  criteria and presentation survive Builder Clear.
- Changed sorting/page size resets page 0, preserving selection unless filtering
  concurrently changes. Same semantic query or empty join preference change does
  not reset page/selection or emit an effective-query notification.
- Page navigation preserves selection; an explicit known-count clamp requires
  matching current request identity and produces at most one correction/no-op.
- Selection Cancel changes IDs only. Presentation/details commands do not silently
  advance relative time or modify query/page. Query/tick commands use injected
  clock; consumers own scheduling and shared SSR context, not per-render Date.now.
- Validate complete column permutations, utility/group boundaries and hidden
  stored slots; required columns cannot hide and visible data cannot disappear.
  Actual drag/native collection integration is later work.

### Controlled atomicity protocol (engineering disposition)

Each group has one configured owner, fixed per controller, and one initial
accepted value source (not simultaneous controlled/default mirrors). An opt-in
controlled group makes **any transition touching it** a whole-state proposal:
query + automatic page/selection consequences are proposed together. Do not
publish the uncontrolled portions while waiting for another group's acceptance.

One onRequest callback receives the complete immutable proposal/reason/base
revision; accepted reads/subscribers/query notifications stay unchanged. An
explicit accept acknowledges the whole current proposal; reject changes nothing.
Only controlled selection may explicitly override the proposed clear, validated
at acceptance. No independent per-group partial acknowledgements. Newer proposal
or accepted revision invalidates old proposals; cross-controller/forged tokens
cannot commit. Pending intent is not an optimistic accepted snapshot.

App callbacks/updaters must not reenter the same controller synchronously;
guard this with safe diagnostics. Accept after dispatch returns (or in a later
application turn). Notify once per accepted transaction; effective query callback
fires only when request identity changes. Subscriber/commit callback exceptions
cannot roll back or hide an already accepted state; report only safe failure
counts, with no default logging. Reducer remains effect-free.

### Definitions, hooks and lifecycle

An explicit replacement constructs and fully validates a new typed controller
from supplied state/context before disposing the old one. Require new schema
identity/version when its semantics change; no automatic stale rule migration,
deletion or old-query version stamping. Invalid replacement leaves old controller
usable. Successfully replacing/disposal invalidates pending intent and listeners;
old handles cannot mutate the new definition or another table.

Hooks consume an explicitly created stable controller, never recreate it or
mirror query in useState. Expose snapshot, query-before-data and generic selector
reads via useSyncExternalStore. Cache selector output with optional equality to
avoid infinite/object-result update loops. Server snapshot is stable and explicit;
React fixture/Node rendering are not G-04/Next/Start hydration acceptance.

## Acceptance and stop matrix

| Risk / partial AC | Required evidence | Deferred proof |
| --- | --- | --- |
| AC-03/05/08 | Rule identity/inverse/invalid commit; builder-only Clear; preserved join/tools/presentation | Draft/picker/focus UI and real commands in renderer |
| AC-10/11 | Filter/tab versus sort/page/size resets; current-page eligible IDs only; off-page IDs retained | Resource freshness/authorization/toolbar rendering |
| AC-24 | Tagged shrink clamp, zero/last/no-op, atomic reset and controlled rejection | Server totals/resource corrections/native pagination |
| AC-25 | Full proposal accept/reject/override/staleness/reentrancy; isolated controllers; replacement lifecycle | WP-04 native subscriptions and WP-05 resource races |
| AC-26 | Root real runtime/types/React fixture, packed TS 6/5.9, exact import/contents guards | Full SSR/native cell types/UI/sortable/release matrix |

Use README's existing build/typecheck/test/lint/pack/check commands. Wire proposed
`test:controller` and Vitest/type discovery before treating them as available.
Keep strict/exact optional/skipLibCheck:false; no Storybook relaxation. Browser
fixture has isolated port/root and synthetic IDs, no services/external data.

Stop affected implementation for product/source contradictions, partial accepted
transactions, hidden mirrors, missed required proof, unsafe diagnostic/key leakage,
dependency incompatibility or scope expansion. Record concrete evidence rather
than weaken policy. Maintainer reviews the implemented protocol before WP-04/05
depend on it. No broad AC/G-gate/publication pass or new authorization is implied.
