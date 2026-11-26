# Aggregate locale module — PROVISIONAL

TASK-017 / FR-16, English/Arabic message authoring only. The controlling allocation
is main's `docs/planning/wp-09-localization-plan.md` in the stacked tree, including
its resolved top-level operator-label placement. This isolated worktree starts at
`f05bdb6`; the earlier bootstrap proof remains unchanged and provisional.

## Actual API and boundaries

Only the new `packages/heroui/src/localization/index.ts` exports:

- `englishTableweaveLocale` (`en-US`, `ltr`);
- `arabicTableweaveLocale` (`ar`, `rtl`);
- `TableweaveLocale`, `TableweaveMessages`, `TableweaveBuiltinOperatorLabels` types.

These are **private module exports**, not package-root/public exports. No existing
component, message interface/default, stylesheet, manifest, lockfile or bootstrap
fixture is changed. No new default UI behavior or future DataTable message/state
API is introduced. Main owns later exports, facade wiring and acceptance.

`TableweaveLocale` contains readonly `locale`, `direction`, `messages` and separate
top-level `builtinOperatorLabels`. The last property uses the actual existing
`FilterFieldPresentation<QuerySchema>["operatorLabels"]` port and additionally
requires all36 accepted `BuiltinOperator` IDs. It is **not** a member of
`messages.builder`. Main's later wiring must combine locale fallback labels with
explicit application per-field overrides winning; this module performs no field
mutation or automatic presentation wiring. Custom operators, schema labels,
record values, tab names and business/error payloads remain application-owned.

### Complete existing ports

Each aggregate value is readonly and checked with `satisfies` against the real port.
Component type imports are erased; no copied or weakened message interfaces exist.

| Aggregate key | Existing type/source | English default source |
| --- | --- | --- |
| `builder` | `filters/types.ts`: `FilterBuilderMessages` | data-only `filters/messages.ts` clone |
| `search` | `toolbar/filter-search.tsx`: `FilterSearchMessages` | component defaults plus shared tool strings copied |
| `tabs` | `toolbar/filter-tabs.tsx`: `FilterTabsMessages` | component defaults plus shared tool strings copied |
| `date` | `toolbar/filter-date.tsx`: `FilterDateMessages` | complete component defaults/templates copied |
| `dateEditor` | `date/date-types.ts`: `DateEditorMessages` | data-only default clone |
| `collection` | `table/collection-messages.ts`: `CollectionMessages` | data-only default clone |
| `sorting` | `sorting/types.ts`: `SortingMessages` | component defaults/templates copied |
| `columnChooser` | `columns/types.ts`: `ColumnChooserMessages` | component defaults copied |
| `selectionToolbar` | `selection/types.ts`: `SelectionToolbarMessages` | component defaults/template copied |
| `pagination` | `pagination/types.ts`: `PaginationMessages` | data-only default clone |
| `details` | `details/types.ts`: `DetailsMessages` | component defaults copied |

All paths above are relative to `packages/heroui/src/`. English keeps exact strings
and template behavior, including raw day summaries, constructor-free import and
default count behavior. New containers are cloned before freezing; no mutable old
default or application object is frozen. Pure existing template references are
preserved without mutating their function objects. The English date summary uses
the owned cloned date-editor dictionary rather than looking up a mutable old object.

Arabic supplies the complete same11 ports, all36 built-in operator labels and12
relative-date names. Human text is translated, not stable IDs or application text.
Pager/sort templates preserve already-formatted string arguments verbatim; no
`parseInt`, inferred numeric plural grammar or translated identifiers. Raw numeric
collection/selection arguments retain their existing number port and neutral count
wording. ISO/UTC/Z and NativeCollection are technical identifiers, not business labels.
Arabic date summaries format day/instant values only when explicitly called with
the existing date context; calendar-day formatting uses UTC to avoid date shifts.

Every exported locale, messages object, per-port dictionary and operator-label map
is a frozen library-owned container. No eager Intl formatter, React/HeroUI runtime,
provider, editor/app callback, request/source/controller connection, global locale
state or `document.dir` mutation is introduced. Direction is metadata only.

## Authored, unexecuted coverage

`locales.test.ts` authors five focused source-unit cases:

1. Exact key sets/types for all11 actual ports; English static-default parity and
   nonempty Arabic human text.
2. English function parity across collection/sorting/selection/date/pager branches,
   all12 symbolic date names and both rolling directions.
3. All36 real private builder-label IDs, exact English labels, Arabic labels and
   explicit application override precedence without helper mutation.
4. Frozen new dictionaries, distinct cloned containers and unchanged mutable old
   defaults.
5. Representative Arabic output with Arabic-digit strings, neutral count templates,
   unchanged synthetic record/field IDs, relative dates and lazy day formatting.

For component-private defaults, `defaults.ts` extracts only the named initializer
from trusted existing source with TypeScript's AST and evaluates that data
expression in a bounded sandbox. It does not import/evaluate any component module
or supply hooks, controllers, private editors or application formatter callbacks.
These tests are **authored, not run**; this extraction is not runtime UI evidence.

`types.ts` authors positive assignments and ten expected compile-error lines for
readonly metadata/containers, complete real ports and builtin coverage, the absent
builder operator-label field, and exact numeric versus preformatted-string ports.
Directive-removal proof, TS5.9 and emitted consumers wait for the final phase.

## Actual lightweight evidence and commands

The initial gap report performed only reads: **zero files written and zero checks**.
Main then explicitly resolved the missing operator-label placement before this code.
No localization unit, browser, Storybook, negative-removal matrix or runtime bundle
has been executed during authoring. Main's single final verification phase controls
all such checks.

Actual permitted checks: the initial protection capture sealed752 existing inputs;
the single TS6.0.3 source/noEmit check completed with **zero errors**, including the
new modules and type/test fixtures against actual existing types. Its static graph
contains seven data modules with no runtime package/component imports or eager Intl
construction outside function bodies. All752 protected inputs were unchanged.
There were no failed localization preparation checks or compiler corrections.

```sh
# Existing frozen install supplied by main; no install/root build is needed.
node tests/localization/protect.mjs before
# One permitted TS6 source/noEmit + static runtime-import/scope check:
node tests/localization/light-check.mjs light-final
# Final lightweight scope/owned-file hash capture:
node tests/localization/protect.mjs after

# DEFERRED to main's final verification batch:
node tests/localization/run.mjs final-units
pnpm exec biome check packages/heroui/src/localization tests/localization
```

The first capture protects existing tracked inputs including all105 original
runtime sources and10 bootstrap files; it does not rebase or rerun the historical
bootstrap742 guard. New localization source/test namespaces alone are allowed.
The unchanged original105 source map remains
`497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790`.
The capture is after new-module authoring but before light checks; no existing
file was written by the worker. Exact baseline bytes/modes and bootstrap hashes
are in `.artifacts/protected-before.json` and `.artifacts/baseline.json`.

The lightweight command records its actual compiler errors/results and a cheap
static runtime graph in `.artifacts/light-final/result.json`. This graph walks only
non-type imports/exports and checks for eager Intl construction outside function
bodies; it is **not** executed import/bundler/SSR evidence. Type reachability may
include actual React/HeroUI/DOM declarations because the existing ports live in
component files. Type resolution reuses the installed, declaring-package-aware
source resolver; no stubs, cross-worktree registry or dependency install is used.

The final `.artifacts/scope-after.json` records every newly added source/test file
hash (including this README), its `ownedAggregate`, and the unchanged protected
input aggregate. Artifacts/reports themselves are excluded to avoid recursive
hashes. All caches/reports remain in this new test folder; existing guard artifacts
stay historical and untouched.

## Deferred / handoff

Implementation-ready **provisional**, not verified localization or packet approval.
Main should inspect/intake the disjoint module, then batch independent review,
dual-compiler source/emitted and removed-directive proof, actual key/template units,
Biome, import runtime/packing, final source seals and subsequent integration once.
Actual Arabic native-language review, manual RTL/device/assistive-technology work,
real renderer/browser/Storybook coverage and text expansion remain unproved.

No complete localization/WP-09, WCAG, SSR, hydration, facade, genuine packed consumer,
release, publication, Git commit, PR integration or merge claim follows. This new
README is intentionally unlinked until main owns documentation intake.
