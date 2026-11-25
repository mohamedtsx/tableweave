# WP-10 adapter dependency preparation — not an install or adapter lease

TASK-018 / ADR-08 / FR-02/03/15, G-02. Main reads the published versioned registry
metadata and declarations/source below while the vendor-free controller prerequisite
is implemented. This page authorizes no install, adapter code or compatibility claim.
Actual native-ref/pager contracts and the admission handoff must precede that lease.

## Candidate family and isolation

The selected candidate for later installed inspection is the new-generation
`@dnd-kit/react`0.5.3 family, not legacy `@dnd-kit/core`/`sortable`. Its published
React peer ranges include18 and19. Published metadata reports MIT and these peers/
dependencies; registry/CDN reads do not verify installed bytes or legal acceptance.

| Package0.5.3 | Published runtime dependencies besides tslib |
| --- | --- |
| react | dom, state, abstract (`^0.5.3`) |
| dom | state, abstract, geometry, collision (`^0.5.3`) |
| abstract | state, geometry (`^0.5.3`) |
| state | `@preact/signals-core ^1.10.0` |
| geometry | state (`^0.5.3`) |
| collision | abstract, geometry (`^0.5.3`) |

Main must pin direct imported packages exactly, inspect the actual resolved lock
family and document additional direct imports before installation. Do not silently
add nonexistent same-version packages, assume every family uses a root index path,
or copy the upstream runtime into the repository. Optional peer/dev metadata must
match actual adapter imports; missing optional dependencies cannot affect raw/default
root/criteria/contracts/pure metadata consumers. All packages remain private.

Registry metadata inspected:

- [react0.5.3](https://registry.npmjs.org/@dnd-kit/react/0.5.3)
- [dom0.5.3](https://registry.npmjs.org/@dnd-kit/dom/0.5.3)
- [abstract0.5.3](https://registry.npmjs.org/@dnd-kit/abstract/0.5.3)
- [state0.5.3](https://registry.npmjs.org/@dnd-kit/state/0.5.3)
- [geometry0.5.3](https://registry.npmjs.org/@dnd-kit/geometry/0.5.3)
- [collision0.5.3](https://registry.npmjs.org/@dnd-kit/collision/0.5.3)

## No optimistic DOM movement by default

Published [React sortable declarations](https://unpkg.com/@dnd-kit/react@0.5.3/sortable.d.ts)
expose element, source, target and handle ref callbacks; no legacy hook result is
assumed. Published [DOM sortable declarations](https://unpkg.com/@dnd-kit/dom@0.5.3/sortable.d.ts)
declare default plugins `[SortableKeyboardPlugin, OptimisticSortingPlugin]` and a
customizable replacement array. The [versioned source](https://unpkg.com/@dnd-kit/dom@0.5.3/sortable.js)
confirms that default list and an optimistic reorder function calling
`targetElement.insertAdjacentElement(position, sourceElement)`, including cancel
handling. Using that default violates the selected cached-collection ownership
constraint; a visual callback cannot retroactively make the mutation safe.

Later adapter work must explicitly exclude OptimisticSortingPlugin and inspect the
complete manager/feedback/sensor configuration, not merely prevent a single event.
Published [DOM declarations](https://unpkg.com/@dnd-kit/dom@0.5.3/index.d.ts) expose
Feedback modes/default plugins plus pointer and keyboard sensors. A transform-only
preview or separately controlled drop indication must not move/reparent the actual
React-owned tr/th, replace native collection nodes, or optimistically update accepted
row order. Keep one manager for both axes, real designated handles, keyboard plus
simple non-drag controls and shared event-time eligibility. Selection/details and
sort controls retain their own semantics; no nested interactive handle/sort button.

## Required later proof

Installed type/source inspection selects precise plugin/feedback APIs and direct
imports before source authoring. Static fixture assertions can forbid unsafe default
configuration, but real DOM-parent/node-identity observation in grouped/Strict/empty/
selection/visibility/current-record/revocation cases is still mandatory in G-02.
Touch/keyboard/cancel/focus, actual parser/runtime/import/SSR/packed exclusion and
manual/AT/performance/consumer gates remain distinct. No unit, browser, module import,
build, install or independent verification was run for this preparation. Registry
source availability is not evidence that controlled previews are feasible.

## Main-owned isolated dependency inspection selection

After actual refs-only lifetimec8e7880 and extent6326b97, main authorizes **dependency
installation/static inspection only** in a fresh isolated tree from6f157bf. This
does not activate adapter/neutral UI source or bypass the active admission bridge.
Main owns only heroui/package.json, generated pnpm-lock.yaml and new
tests/reordering/adapter-inspection/**, plus ordinary main metadata in the primary
tree. All150 source bodies/old fixtures/config/patches/public generations freeze.

Add exactly @dnd-kit/react0.5.3 and @dnd-kit/dom0.5.3 as optional peers and exact dev
dependencies. Those direct packages provide the selected provider/hooks plus explicit
sortable keyboard/feedback plugin imports; no direct abstract/state/geometry/collision
API is selected. Review the actual resolved family/transitives rather than claiming
their ranges are exact pins. If another direct import is genuinely needed, stop for
an explicit manifest allocation. No legacy core/sortable packages, second manager,
root headless dependency or patch is added.

Run one main-owned lock-updating `pnpm install --ignore-scripts` in that isolated
tree, then inspect actual package/type/source files as bytes without importing a
vendor module or invoking a build/plugin/test. Existing onlyBuiltDependencies and
all patch registrations stay unchanged; no new install lifecycle script is allowed.
Review manifest/lock diff before preservation/intake. Preserve the initial manifests/
lock and exact source map. Static inspection records chosen entrypoints/plugins/
unsafe optimistic insertions and resolved versions, not browser compatibility,
preview feasibility, legal/publication readiness or G-02. Actual vendor enrollment/
geometry/disposal code still needs a separate closed contract/source lease.
One small noEmit installed-API type program may check provider/sortable plugin/ref
signatures as a lightweight static aid. It must execute no vendor constructor/hook/
configure method and is not a DOM/preview/SSR or package-consumer feasibility pass.

## Preserved isolated inspection

Main preserves exactly six files as isolated9a5f598 after the selected ignore-scripts
install, installed-byte/export/type inspection, one positive noEmit API program,
full scoped Biome and staged whitespace. Actual manifest/lock review finds exactly
the two optional peer/dev pins and71 lock additions/zero removals; old resolutions/
patch registration bytes are unchanged. All150 isolated production hashes and1468
other tracked file byte identities match. Six-input aggregate:
e90bdf9508d2df58f5a4cdaaa8e5ecea89028ffb2f7c36019c95f3b45d4d8e76.

Actual resolved family is six dnd-kit packages0.5.3, signals-core1.14.5 and existing
tslib2.9.1. Inspect output hashes declarations/compiled source but executes no vendor
module. The candidate configuration type-checks; actual manager effects/style
registration/preview/resource cleanup remain unverified. Initial formatting failures
and separate fresh attempt outputs stay preserved. Intake waits for the active
admission bridge; no primary manifest/lock or adapter source changes from this stage.
