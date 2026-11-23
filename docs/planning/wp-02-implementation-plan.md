# WP-02 bounded implementation plan

Prepared for maintainer review under TASK-005. **Planning only:** this document
does not authorize implementation, installs, branch/PR operations or publication.
[TASKS](../../TASKS.md) owns live status; [WP-02](work-packets.md#wp-02-schema-operators-and-conformance-vectors)
owns the packet. This plan sequences existing requirements, not new product policy.

## Outcome and readiness

Deliver a typed, serializable query schema; runtime validation/normalization;
complete pure operator semantics and presets; and shared local/server-translator
conformance vectors. Provide accepted producer contracts for WP-03 and later
integration work, **not** a table component or a second row-processing engine.

WP-01 is accepted at `6bac5a6`; acceptance records are committed at `5c11d53`.
Planning began from a clean `chore/setup` worktree. Actual installed tools inspected:
TypeScript 6.0.3 / declaration cross-check 5.9.3, Vitest 5.1.1, Vite 7.3.8 and
Playwright 1.65.1. Neither `contracts` nor `filters` currently exports an API.
No WP-02 runtime check has run or passed.

### Inputs and reference use

- Product: [operators](../../product/operators.md), [shared rules](../../product/shared-rules.md),
  FR-01/FR-04/FR-07–FR-10/FR-12/FR-14 and D-04/D-10/D-11/D-13–D-16/D-19–D-24.
- Contracts: [public API](../engineering/public-api.md),
  [state/query](../engineering/state-and-query.md),
  [security](../engineering/security.md), [architecture](../engineering/architecture.md).
- Acceptance: AC-02–AC-07, AC-23 and AC-26, with the partial-coverage limits below.
- Fresh read-only reference inspection: `.repo/Gamila/PROJECT.md` and its
  engineering architecture, stack and supplier-bookings plan. Adapt browser-safe
  pure contracts, directional imports, explicit validation and thin adapters.
  Do not inherit its application transport, URL authority, fixed page policy,
  business schema, runtime code, patches or lockfile. Reference application/tests
  were not executed or audited. This local reference is now available, unlike
  the original WP-01 execution worktree.
- No new visual design is needed. The transactions reference and maintainer taste
  remain authoritative for later UI work; HeroUI component lookup starts in its
  v3 Storybook when those packets begin. No visual inspection/approval is claimed.

## Proposed dependency decision

Recommend **Valibot 1.5.0** for internal runtime validation and
**`@internationalized/date` 3.12.4** for calendar/timezone arithmetic, as explicit
`@tableweave/react` runtime dependencies after authorization.

Read-only official registry metadata confirms Valibot's MIT license, no runtime
dependencies and optional TypeScript `>=5` peer; Internationalized Date is
Apache-2.0 with `@swc/helpers`. Its version is already present in the workspace's
styled development graph, but **is not a declared core dependency**. Valibot is
not currently declared in Tableweave. Versions were independently checked, not
copied from the local reference. Reviewed the official
[Valibot introduction](https://valibot.dev/guides/introduction/) and
[Internationalized Date guide](https://react-spectrum.adobe.com/internationalized/date/index.html).

These are proposed additions, not installed/verified core compatibility. Recheck
matching release types/source, strict peers, emitted imports and license obligations
when execution is authorized. Keep vendor validation objects internal: the wire
schema is Tableweave's serializable descriptor, not a serialized Valibot schema.
Preserve native Intl and explicit clock/timezone context; add no date/i18n service.
An incompatible dependency or alternative validation approach returns for review,
not a forced peer, vendor patch or silent baseline change. Private-package and
publication/legal limits remain unchanged.

## Execution ownership and bounded paths

Proposed executor: current agent after separate authorization; reviewer: maintainer.
One writer owns shared schema, export maps, manifests, lockfile and harness changes.
No delegation is requested. Allocate the execution task only when approved.

| Path boundary | Permitted future purpose |
| --- | --- |
| `packages/react/src/contracts/**` | Serializable descriptors/wire types, inferred schema helper, validators, normalization, safe diagnostics and query identities |
| `packages/react/src/filters/**` | Operator descriptors/registry, built-ins, presets, extension contracts, pure evaluation/time helpers |
| `packages/react/src/definition/schema-types.ts` | Schema-to-row/accessor type bindings only; no full `defineTable`, native bridge or React hook |
| Existing React package entry files/manifests | Deliberate contracts/filters exports and reviewed dependency declarations; preserve server-safe entries and client root boundary |
| `tests/contracts/**` | Synthetic vectors, schema/operator/date/custom-translator tests and type fixtures |
| `tests/consumers/headless.ts`, `runtime.mjs` | Replace only obsolete empty-contract/filter assertions with meaningful public API/type/runtime tests |
| `tests/foundation/{boundaries.test.ts,packed-consumers.mjs,tsconfig.json}` and `vitest.config.ts` | Discover new tests/types and inspect real exports, runtime dependencies and emitted module contents without weakening boundary checks |
| Root `package.json`, `pnpm-lock.yaml` | Wire contract check commands/type coverage and reviewed dependency resolution; no unrelated toolchain upgrades |
| `README.md`, React package README, affected engineering owners, scoped evidence and TASKS | Document only implemented APIs, decisions, actual commands/results and producer handoff |

Filenames inside the scoped modules are provisional implementation organization,
not frozen public API. Extend the packaging allowlist only for reviewed outputs.
No changes to HeroUI implementation/stories, reference repositories, business apps,
GitHub showcase or runtime services. Do not switch/reset branches or merge PR #1
as an implicit planning step; select an isolated implementation branch when Git
operations are authorized. Accepted WP-01 artifacts, not PR merge status alone,
establish this packet's technical dependency.

## Implementation sequence and checkpoints

### 1. Define the producer contract and failing vectors

Separate serializable field/query descriptors from runtime accessors, predicates,
labels/input renderers and custom callbacks. Specify schema ID/version, stable
field IDs, semantic family, exclusive configured owner, allowed operator IDs,
tab criteria, opt-in sort allowlist, pagination/context and defensive limits.
Bind computed/nested accessors to their resulting value family without inventing
a competing column-definition framework. `defineQuerySchema` is a candidate name
from the HLD, not an existing export or a promise to freeze all HLD API sketches.

Create versioned synthetic vectors and positive/negative type cases first. Reserve
the contract revision and implement only the helper/types WP-02 can prove. Do not
stub `defineTable`, controllers, hooks, `DataTable` or future translator services.

### 2. Implement validation and versioned transport

Validate unknown input against the configured schema: schema/version, owner,
field/operator/value combinations, cardinality, tabs, sorting, finite pagination,
locale/timezone and applicable limits. Initial engineering defaults are 50 rules,
100 membership values, 512 search characters and 100 page rows; configured policy
must match the application server. Reject visibly rather than truncate or coerce.
Apply input limits before semantic canonicalization so duplicate rules cannot
bypass them. Exclude functions, renderer objects, predicates and backend fragments
from transport; reject malformed/unknown identifiers with safe codes and IDs,
not raw queries, records, credentials or stacks in diagnostics.

Stale schema/version revalidation is pure here; mounted definition transitions
belong to WP-03. Validation is not actor/record authorization. Injection-like
identifiers are rejected; legitimate text containing quotes remains data for
explicit, parameterized application translation—not executable query code.

### 3. Implement the complete operator registry and presets

Cover every family/preset in the product operator owner: text and configured
email/URL/phone; numeric/currency/percentage; scalar enum and single entity IDs;
multi-select/tags/many-valued entity IDs; nullable boolean; date/date-time; and
computed/accessor values. Descriptors declare stable IDs, label keys, supported
types, none/one/many/range cardinality, validators/normalizers, inverse and pure
client evaluator. Custom operators register explicit semantics; missing client
evaluation or requested server translation fails rather than silently falling back.

Prove inclusive numeric ranges; no arbitrary string/number/boolean coercion;
zero/false are values; default whitespace is not empty; and missing values do not
match negative non-empty comparisons. Preserve separate editable rule identities.
Inverse metadata must require replacement input when value shapes are incompatible.
An empty membership set is invalid, while the final-deselection removal intent is
a later command/UI behavior—not an empty predicate. Static/async presets use
stable IDs, not labels or only the current loaded options page; do not fetch or
erase rules when an async option is temporarily absent.

### 4. Implement date resolution and semantic identities

Keep date-only values distinct from instants and retain symbolic relative intent.
Resolve today/yesterday/tomorrow, relative weeks/months/years and configured rolling
presets using explicit clock/timezone/context. Include the full end calendar day
as next local day start, exclusive—not a fixed 24-hour addition. Cover DST in both
directions, midnight/end boundaries and invalid ranges. Pure/server-safe helpers
must not read browser globals or silently use a per-render clock; browser defaults,
hydration coordination and debounce scheduling are later integrations.

Derive semantic filter identity separately from full request/query identity:
sort/page changes affect request identity, not effective-filter identity. Equivalent
built-in predicates can canonicalize without mutating editor rule IDs or the
stored All/Any preference; empty All/Any is neutral. Custom normalization is
explicit, not guessed. Relative keys use resolved boundary identity, not a new
timestamp each render. Never add automatic storage, URL writes or key logging.
Document consequential wire/context/canonicalization choices before freezing them.

### 5. Prove local/translator conformance and package boundaries

Use the same versioned vectors with independently asserted expected record IDs,
validation outcomes, normalized wire values and date boundaries. Cover flat
cross-field Any, multiple same-field rules, empty builder neutrality, search OR
and independent-tool AND. A synthetic application translator fixture must map
stable allowlisted operator/field IDs and bind values, with no call-through to the
local predicate being used as its own oracle. Unknown translation is rejected.
This is shared conformance proof, not an ORM, database, endpoint or authorization
integration. TanStack's carrier/native pipeline remains WP-04.

Adapt the foundation tests alongside real exports:

- Vitest currently discovers **only** `tests/foundation/**/*.test.ts`; include
  contract suites and assert they are actually discovered. Add a proposed
  `test:contracts` command; it is not available before implementation.
- Current typecheck coverage omits `tests/contracts`; explicitly include their
  source/type fixtures or wire a contract tsconfig into the verified command.
- Replace contracts/filters empty-namespace assertions and the temporary
  expected-missing `defineQuerySchema` case with real positive/negative tests.
  Keep private deep-import rejection and still-unimplemented API negatives.
- Replace the blanket no-runtime-dependencies assertion with a narrow reviewed
  allowlist. Update exact tarball contents for real emitted modules; do not
  disable content inspection or permit source/tests/stories/secrets/reference files.
- Under the Node import guard, **invoke** schema validation/normalization and date
  evaluation from packed contracts/filters, not merely import their namespaces.
  Keep React/DOM/UI/network-framework exclusions and no-workspace-alias checks.
- Compile real schema-specific field/operator/value/accessor/custom-value cases
  with both pinned TS versions from tarballs. Keep `strict`, exact optional checks
  and `skipLibCheck: false` for packages/consumers; no new Storybook relaxation.

## Acceptance matrix and honest boundaries

| Scenario | WP-02 evidence | Deferred part, not a WP-02 pass |
| --- | --- | --- |
| AC-02 | Ownership conflicts/inactive-owner exclusions; stale schema/version validation | Mounted definition/controller transition |
| AC-03 | Pure All/Any composition, independent duplicate IDs, inverse/cardinality contracts | UI commands and one accepted state/callback transaction |
| AC-04 | Full family/preset values, empty/negative/numeric edges and local/translator vectors | Actual application query integration |
| AC-05 | Invalid/incomplete applied values rejected; input remains unmutated; membership/cardinality contracts | Draft confirmation/Cancel and final-deselection state transitions |
| AC-06 | Date-only/instant/DST/relative boundaries and stable resolved keys | Browser timezone adoption, debounce timer behavior, hydration/network reads |
| AC-07 | Stable async-option ID representation independent of current labels/pages | Picker UI, stale-response guards and async resource lifecycle |
| AC-23 | Unknown IDs/versions/sorts/limits rejected; safe explicit translator fixture | Real backend parameterization/authorization, sort/page execution and partial-page bridge |
| AC-26 | Packed real contract/operator type fixtures, runtime invocation and server/headless import graphs | Native cell/table contexts, Next/Start builds, styled/sortable runtime and final legal/release matrix |

## Verification, stop rules and handoff

After implementation authority and any required dependency approval, use existing
`pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm pack:check` and
`pnpm check:docs`. Wire the proposed contract selector into actual scripts before
documenting it as runnable. Final integration runs `pnpm check` so the accepted
foundation/Storybook/browser smoke remains intact; that command also performs
isolated dependency installs and needs execution/install authority. All commands
above are a **future verification plan**, not checks run during TASK-005.

Stop affected work on source conflicts, incompatible peers, unjustified wire/API
expansion, divergent local/translator semantics, nondeterministic time, unsafe
diagnostics, transitive React/DOM/UI leakage or missing required evidence. Do not
weaken product behavior, force peers, skip declarations or hide failing checks.
Unresolved engineering details need an explicit disposition, not invented product
ambiguity; missing publication rights do not block safe private contract work.

Handoff must include exact schema/wire/operator revisions and exports, fixtures,
normalization/time/error/translation contracts, dependency/TS matrix, commands and
results, tarball hashes, reviewed API examples and known limitations. Keep TASKS
as the sole live ledger. Maintainer reviews the implemented packet before WP-03
depends on its interfaces. No G-01–G-05, UI/manual accessibility, SSR, performance,
real-consumer or release pass is implied.

**Next authorization:** approve the bounded local WP-02 implementation and tests,
including the proposed Valibot/Internationalized Date core additions and reviewed
strict installation, or request plan changes. No commits, pushes, PR operations,
publication, real-consumer changes or delegation are included by default.
