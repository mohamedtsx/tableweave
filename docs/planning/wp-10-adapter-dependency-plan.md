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

## Installed source blockers — remedy not yet authorized

The external vendor-lifetime report identifies a declaration/runtime mismatch in
React's manager export, eager default manager construction, and incomplete native
cleanup/drain APIs. Main independently reads installed React index.js imports/
exports, DOM patchWindow and ScrollListener, and verifies latest registry tags
remain0.5.3. These source facts do not alter the preserved positive type/static
inspection result or constitute runtime/G-02 evidence. Review21n1/n2 stays open.

The proposed commit-owned imperative DOM-family/indicator path avoids React render
construction and optimistic DOM movement, but does not itself fix those cleanup
gaps. No adapter or generic disposer workaround is activated. A new dependency
patch/fork is outside the existing RAC-specific authority; main asks for a bounded
remedy direction while neutral prerequisites continue. Required cleanup, source
revocation and genuine packed/independent verification are not waived.

## User-selected upstream investigation — 2026-11-25

The user selects **Inspect upstream alternatives**, not a patch/fork or another
installation. The external report at
`/tmp/opencode/wp10-upstream-alternatives/REPORT.md` enumerates published family
versions/tags and inspects relevant pinned upstream sources/PRs. It finds no newer
fixed published artifact. Stable0.5.3 points to
3910e2773d57482f58ba135623523fe97b588245; the reported beta precedes that stable.
Main independently reads the [pinned comparison](https://github.com/clauderic/dnd-kit/compare/3910e2773d57482f58ba135623523fe97b588245...ccaf3d583903a5d0b68616310a24aec891ee0d69):
the two later commits change tooling/framework dependencies, not these runtime
paths. Main also rechecks registry latest DOM0.5.3. No floating head/beta adoption
or new artifact download is selected.

Correct the earlier export implication: [upstream React source](https://github.com/clauderic/dnd-kit/blob/3910e2773d57482f58ba135623523fe97b588245/packages/react/src/core/index.ts#L27-L36)
explicitly exports DragDropManager **as a type**. Main independently reads that
declaration. The installed declaration's unqualified export is a value-import
hazard, not evidence that upstream intended a React runtime value. The real DOM
value belongs to the same new-generation family. Choosing it would need an explicit
ADR/import/manifest disposition; the isolated inspection's React pin is not silently
removed. React module-default/render construction remains a separate ownership
concern, not solved by a positive provider type check.

The report also narrows cleanup claims: the shared constant touchmove noop captures
no table-private data/callback, and the uncancelled ScrollListener timer's branch
only clears coordinate metadata. Neither source fact alone proves a private-data
leak. Scroller's queued native write, entered keyboard continuations and exact
partial-allocation debt still require a closed table-owned source account. No
runtime leak, successful retirement or universal vendor drain was measured.

Relevant upstream work is not an adopted remedy: [#2117](https://github.com/clauderic/dnd-kit/pull/2117)
changes provider destruction ordering but keeps eager construction; [#2109](https://github.com/clauderic/dnd-kit/pull/2109)
changes AutoScroller metadata, not the queued Scroller write. Both are reported
open/unmerged. A bounded read-only follow-up traces supported Scroller exclusion/
prevention and keyboard usability against actual public APIs. It allocates no
adapter/native-resource code, dependency patch or requirement change. Dependencies
stay held; the independent source/UI correction continues.

## Scroller prevention and live-shape limitation

The follow-up report at `/tmp/opencode/wp10-scroller-boundary/REPORT.md` finds that
the public direct `manager.registry.plugins.unregister(Scroller)` removes the core
plugin; merely omitting it from a replacement plugin list does not. Main independently
reads the pinned [registry implementation](https://github.com/clauderic/dnd-kit/blob/3910e2773d57482f58ba135623523fe97b588245/packages/abstract/src/core/plugins/registry.ts).
Removal before **any** native enrollment/input is a possible source-level prevention
protocol, not cancellation of an already-armed write or a tested cleanup result.
Fixed lists must exclude AutoScroller and any subsequent Scroller registration.

The same report identifies a separate blocker in the earlier proposed configuration:
[Feedback.none](https://github.com/clauderic/dnd-kit/blob/3910e2773d57482f58ba135623523fe97b588245/packages/dom/src/core/plugins/feedback/Feedback.ts)
returns before assigning/updating the active drag shape. Main independently reads
that branch and [KeyboardSensor](https://github.com/clauderic/dnd-kit/blob/3910e2773d57482f58ba135623523fe97b588245/packages/dom/src/core/sensors/keyboard/KeyboardSensor.ts),
whose movement exits without a shape. A sibling indicator alone supplies none.
Thus the earlier static configuration is not established as keyboard/drop-target
usable. The refs-only lifetime has no geometry producer/grant; one initial rectangle
does not account for subsequent movement/layout/scroll changes. Review21n3 records
this source-only finding without changing the original inspection seal.

No adapter activation follows from removable Scroller. A separately selected closed
geometry/lifetime owner and exact native retirement still precede code. Offscreen
current-page reachability, touch/overflow, RTL, keyboard targeting and focus remain
required feasibility checks. No normal Feedback/overlay/clone behavior, replacement
keyboard algorithm, vendor patch or private-field manipulation is silently adopted.

## Minimal adapter lease stopped at the native read boundary

The final read-only contract at
`/tmp/opencode/wp10-closed-adapter-contract/REPORT.md` does **not** establish a
complete fixed backend. Main reads the actual installed observer and keyboard
continuation paths recorded by review21n4. Standard Droppable creates internal
observers whose captured-element reads can precede adapter callbacks; a later shape
getter or guarded updateShape cannot retroactively fence them. The retained keyboard
continuation also scrolls its target before a fresh adapter source check.

This is an unsupported proof seam in the proposed minimal protocol, not a measured
browser failure, a blanket claim that dnd-kit can never work, or a demand for universal
vendor quiet. Public replacement of effect suppliers alone does not close the other
native paths. The bounded N/core/R geometry/resource extension described in the report
is necessary but insufficient, so it is not allocated as code. No additional general
upstream search is needed. Main must obtain explicit remedy authority or keep drag
blocked; the independent UI/source correction and future neutral controls remain
separate. Existing RAC patch authorization does not cover this dependency.

The user subsequently authorizes the scoped private/prerelease patch spike. Main
selects the [isolated bounded repair plan](wp-10-dnd-native-read-patch-plan.md), not
the earlier stopped minimal adapter lease. Exact one-package/16-path envelope,
runtime-diff cap, preserved inspection baseline, no-algorithm-change and LIGHT-only
rules apply. Broad fork, adapter/native issuer implementation, primary dependency
intake and independent/runtime approval remain outside that allocation.

After three held isolated candidates, the user chooses **Keep drag blocked**.
The [final spike disposition](wp-10-dnd-native-read-patch-plan.md#final-v3-disposition--no-automatic-continuation)
records the type-compatible but incomplete/disabled result. No vendor patch is
registered or installed, no inspection dependency commit is intaken into primary,
and no further remedy/alternative research is allocated. Neutral simple move
controls remain independent; drag and full WP-10/G-02 are incomplete, not waived.
