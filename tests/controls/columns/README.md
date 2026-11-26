# WP-08 sorting / column-chooser producer handoff

Scope: authorized source producer in `packages/heroui/src/columns/**`,
`packages/heroui/src/sorting/**` and this test directory only, on port **6467**.
Main owns TASKS, integration, root exports/styles, emitted package builds, actual
packing, independent review and approval. No installs, shared source edits,
delegation, Git writes, publication or deployment were performed by this worker.

## Exact API

- `columns/index.ts`: `ColumnChooser`, `defaultColumnChooserMessages`;
  types `ColumnChooserProps<S,T>`, `ColumnChooserMessages`,
  `ColumnControlsTarget<S,T>`, `ColumnControlOptions`, `ControlMutationNotice`.
- `sorting/index.ts`: `Sorting`, `defaultSortingMessages`;
  types `SortingProps<S,T>`, `SortingMessages`.
- Both components require `{definition, view, authority, presentation}`: actual
  `NativeDefinition<S,T>`, current subscribed `NativeTableView<S,T>`, genuine
  `ControlsAuthority<S,T>`, and this render's `projectControls` presentation.
  `S extends QuerySchema`, `T extends object`. No second subscription/state owner.
- Optional own props: `labels: Readonly<Record<string,string>>` for public leaf
  labels; `messages` (complete dictionary); `isDisabled`, `disabledReason`, `id`,
  `className`, `onResult`. String headers otherwise supply labels; complex headers
  fall back to the stable public ID. IDs are not display positions.
- `onResult(notice)` observes only `submitted | committed | noop | rejected |
  unavailable`. `submitted` means a controlled **proposal**, never acceptance.
  Later acceptance/rejection belongs to the controller/application, not a second
  observer subscription. Observer throws/rejections are contained. Generic
  `unavailable` exposes no underlying errors/records/context.
- CSS lives in `packages/heroui/src/columns/controls.css`; fixture imports it
  directly. **Main must integrate it into the real style entry/packaging**.
  No automatic stylesheet import or root export edits were made here.

## Behavior and boundary

Each mutation checks actual root `getControlsAuthorityOwner(authority)` and compares
**both** exact definition and controller refs before `require(sort/columns)`.
The same sequence runs again inside the existing functional controller updater.
Factory identity is not authorization. Query reference/value equality is never
used as owner proof. Copied/inherited/proxy authorities cannot acquire provenance.

Render reads the supplied accepted view and presentation, **not** the commit-phase
event authority. This permits initial rendering before application layout effects
commit the event port. Presentation is display availability only, not event proof;
fresh event require remains mandatory. An old authority after a scope change must
be replaced by the application for that new scope; an old callback still denies.

Sorting offers explicit single ascending/descending, remove-one, and separately
named additive ascending/descending when table/schema/native multi-sort permit.
Updates consume the reducer's latest sorting. Hidden sorts retain true priority;
the complete accepted priority list has a polite atomic live region. Unsupported
data fields show real disabled controls/reasons. **No `aria-sort`, header action,
row processing or table semantics are invented by these controls**. Actual header
primary/secondary ARIA remains the collection renderer owner's responsibility.

Chooser enumerates complete accepted public policy order, including hidden data
leaves; it looks up only those native IDs, never all/private native IDs. Groups,
utilities and internal carrier/padding never appear. Required/final-visible
restrictions have replaceable reasons and event-time enforcement. Preferred row
header may hide. Visibility changes only the existing visibility slice, preserving
full order/hidden slots/query/sorts/selection; the reducer owns query resets.

Props/options/messages are captured once before validation. Labels are copied
metadata only; application records are neither cloned nor frozen. No fetching,
resource connection/cache ownership, persistence, telemetry, Export or drag APIs.

## Verification commands and evidence

Run from `/tmp/opencode/tableweave-wp08` using existing exact local dependencies:

```sh
pnpm exec vitest run --config tests/controls/columns/vitest.config.ts
node tests/controls/columns/check-types.mjs
pnpm exec playwright test --config tests/controls/columns/playwright.config.ts
```

`vendor-node_modules` is an **uncommitted local-only symlink** to the already
installed Storybook vendors. No dependency install or synthetic vendor declaration
was used. Source checks use Bundler resolution against real vendor types; both own
emitted declaration consumers use strict NodeNext. All keep `skipLibCheck:false`,
exact optional properties and positive/negative public prop assertions. This is
**not** actual tarball/public-root consumer proof.

Current source unit coverage: 30 tests, including identical-query/schema genuine
A-authority/B-target rejection, exact-definition mismatch, same-definition foreign
controller, copied/inherited/proxy authority denial, scope/access/controller/dispose
guards, in-updater reauthorization, same-turn external accepted sort/visibility,
controlled reject/delay/accept without false notifications, native/schema permitted
sorting, hidden priorities, required/final-visible, public order and slice retention,
metadata capture and throwing/async observer isolation.

Browser coverage: explicit and additive priorities/hidden primary, unsupported and
single-sort fields, actual old DOM same-turn callbacks, visibility-only retention,
final-visible races, controlled sorting/visibility, same-owner server loading and
failure, current access/scope/foreign target denial, independent tables, pointer
labels, Enter/Space/Tab/Escape/focus restoration, light/dark/Arabic RTL, widths
320/390/768/1024/1440, expanded text, axe and non-text unchecked-checkbox boundary
contrast of at least 3:1. Arabic `I18nProvider` locale matches accepted query locale
`ar-EG`. Source-browser screenshots/results/traces and own declarations are under
`.artifacts/`. Screenshots were visually inspected, not human/AT acceptance.

Initial harness defects (RAC prefix alias and JSX transform; hidden-input pointer
targeting; incorrect assumptions about uncommitted client-context changes and
native hook controller switching) were fixed, not suppressed with force clicks,
skips, vendor changes or relaxed compiler options. A first type command exceeded
120s after four phases; an earlier 300s rerun completed all five phases. A later
concurrent 300s rerun timed out after four phases; the subsequent 600s-headroom run
completed all five without changing compiler options or tests.

## Explicit limits / main next action

- The simple fixture deliberately does **not** import the concurrently changing
  shared collection renderer. Actual header ARIA, preferred-row-header fallback and
  integrated selection/normal-toolbar switching need main/renderer composition.
- Native warns `sortFn 'text' (auto) for column 'name' is not registered`.
  A follow-up actual UI probe **passes** descending ASCII text order `Beta, Alpha`
  despite that warning; the hidden-primary browser case also asserts actual row
  ordering in both directions. Thus this is an observed warning, **not a verified
  native defect**. Main can assess the warning/fallback; no broader language/numeric
  collation guarantee or native fix is claimed here.
- Main must wire exact root exports and CSS, rerun full checks, inspect actual
  emitted/packed consumers and arrange independent review before scoped approval.
  No approval, full release gate, SSR, real consumer, manual assistive-technology,
  actual Safari/mobile or performance claim follows from this source fixture.
- Read-only reference inputs: current maintainer/plan instructions, transaction
  reference content and recorded Gamila assessment (`.repo/` absent here). Official
  Storybook catalog was reachable; MCP main-site documentation fetches failed.
  Matching installed HeroUI **3.2.8** packaged docs/types/source informed compound
  Button/Popover/Checkbox anatomy. No Figma or reference writes/assets were used.

## Final source handoff — 2026-11-24

- Unit command above: **30/30 pass**. Complete source-browser command above:
  **17/17 Chromium pass**, including actual hidden-primary row order in both
  directions. No skips. Browser report: `.artifacts/results.json`.
- Type command above: **five compiler invocations pass** — source TS **6.0.3**
  and **5.9.3**, TS6 own declaration emission, and own emitted public declaration
  NodeNext consumers under both versions. Emitted public declarations were also
  read directly: only own/React/Tableweave types, no HeroUI/RAC prop leakage.
- Scoped `pnpm exec biome check` passes **20 files**, with no fixes pending.
  Scoped `git diff --check` passes. This is not the main combined/full workflow.
- Environment observed: Node **24.22.0**, React/React DOM **19.3.1**, TanStack React
  Table **9.3.1**, HeroUI React/styles **3.2.8**, React Aria Components **1.22.1**,
  Vitest **5.1.1**, Playwright **1.65.1**. Existing declaration-patched dependencies
  were used unchanged; no install or dependency patch was performed here.

Source files authored (all new, no existing implementation overwritten):

```text
packages/heroui/src/columns/column-chooser.tsx
packages/heroui/src/columns/controls.css
packages/heroui/src/columns/index.ts
packages/heroui/src/columns/model.ts
packages/heroui/src/columns/types.ts
packages/heroui/src/sorting/index.ts
packages/heroui/src/sorting/model.ts
packages/heroui/src/sorting/sorting.tsx
packages/heroui/src/sorting/types.ts
```

This directory contains the README, unit/browser fixtures and tests, scoped
Vitest/Vite/Playwright configs, positive/negative public types, `check-types.mjs`
and `fingerprints.mjs`. Generated outputs and the vendor link are not deliverable
source or packing evidence.

`node tests/controls/columns/fingerprints.mjs` writes the full exact SHA-256 manifest
to `.artifacts/source-fingerprints.sha256`. It covers **61** code/style/fixture
files: all consumed core source, these nine producer files and this directory's
code/config fixtures; it excludes README/generated artifacts/vendor links.
The final manifest SHA-256 is:

```text
3880ecfb1fc70938057a73cc4729cc1f73daacb9ae15efa71f2e9ccb5a9d7171
```

Key consumed producer fingerprints (not modified by this worker):

```text
7b50a3b037c7c38338228605874a69bdd830be85579a84b2ee0a076894c09b46  packages/react/src/presentation/authority.ts
35b8ceae8cafdb2e9c60e6e85c30f1deabd4d3bdd266a67d579f582063dcdbfe  packages/react/src/presentation/types.ts
b22dcb4af9adbc75d43097ee7de0cf4697a5769a09ddec59aa376f4b47eb3470  packages/react/src/index.ts
```

Next: main independently reviews this exact candidate, wires root exports/style
and real collection composition, then runs actual emitted/packed consumers and
the combined workflow. Source proof is not delegated approval or release proof.
## Portable local-install harness

The new test-only [portability handoff](../harness/README.md) records current
declaring-package resolution, commands, results and remaining gaps. Earlier source
review hashes/counts above remain historical; they do not certify the new configs.
