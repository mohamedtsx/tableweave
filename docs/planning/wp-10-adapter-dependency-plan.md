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
