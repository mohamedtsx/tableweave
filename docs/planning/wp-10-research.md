# WP-10 sortable research — not execution approval

Read-only research for TASK-018/G-02. No sortable code, dependency install or gate
approval follows. Exact producer/guard/ref interfaces and a bounded implementation
plan must precede code. Current interfaces in WP-08 are still under correction.

## Verified dependency candidate

Main independently fetched registry metadata for all six new-generation dnd-kit
packages: react/dom/abstract/state/geometry/collision **0.5.3**, MIT, no declared
engine restriction. React/DOM peers `^18.0.0 || ^19.0.0` include installed19.3.1;
that is not installed/strict/browser compatibility proof. All metadata records the
same gitHead `3910e2773d57482f58ba135623523fe97b588245`.

Proposed future exact optional peers **and** development dependencies for the
styled package: `@dnd-kit/react:0.5.3`, `@dnd-kit/dom:0.5.3` (both directly imported).
No headless dependency or legacy @dnd-kit/core/@dnd-kit/sortable mixing. Freeze the
actual resolved graph after separate plan/install approval; do not install unrelated
helper packages by assumption. Metadata/source lookup is not a security/license
audit or final version acceptance.

Registry sources: [React](https://registry.npmjs.org/@dnd-kit/react/0.5.3),
[DOM](https://registry.npmjs.org/@dnd-kit/dom/0.5.3),
[abstract](https://registry.npmjs.org/@dnd-kit/abstract/0.5.3),
[state](https://registry.npmjs.org/@dnd-kit/state/0.5.3),
[geometry](https://registry.npmjs.org/@dnd-kit/geometry/0.5.3),
[collision](https://registry.npmjs.org/@dnd-kit/collision/0.5.3).

## Concrete DOM hazard and proposed controlled adapter

Separate read-only tagged-source/tarball research finds that the default optimistic
sortable plugin physically reparents originals via insertAdjacentElement; feedback
can create placeholders/manipulate styles. That is incompatible with cached RAC
collections. The candidate per-item plugin list **replaces defaults**:

```ts
// Research sketch, not imported/installed/runtime-verified application code.
plugins: [SortableKeyboardPlugin, Feedback.configure({ feedback: "none" })],
transition: null,
```

Omit OptimisticSortingPlugin on **every** registration. No accidental default item
may install it into the manager. Use a React-owned ghost/insertion hint outside
semantic table sections, stable target IDs and operation.transform—not an assumed
legacy transform/listeners/attributes hook result or optimistic source.index.

References: [sortable](https://dndkit.com/concepts/sortable.md),
[React hook](https://dndkit.com/react/hooks/use-sortable.md),
[optimistic source](https://github.com/clauderic/dnd-kit/blob/3910e2773d57482f58ba135623523fe97b588245/packages/dom/src/sortable/plugins/OptimisticSortingPlugin.ts).

Installed HeroUI/RAC forward row/header refs to actual tr/th, but the current
collection wrapper exposes no ref/handle binding seam. Main must explicitly own
that extension; never query/reparent nodes after rendering or put div wrappers in
tbody/thead. No competing RAC drag manager. Do not use reserved RAC slot=drag
(its row context disables pointer events); use a genuine handle button. Header
drag handle is a sibling of sort, not nested inside its button. Original native
reorderGroup/utility partitions, not padding ancestors or dnd group alone, enforce
boundaries; the vendor supports cross-group movement by default.

## Required staged handoff and proof

Proposed pure producer under packages/react/src/reordering owns operation IDs,
scope/query/page/revision anchors and one pending move, **not** records/persistence.
It needs an exact latest-authority guard port from the reviewed native/resource
producer before adapter consumers. Column helper preserves the complete stable
leaf permutation, hidden slots and original group/utility partitions; utilities
cannot move or be crossed. No controller query/order mirror or captured-array
rollback over newer input. Success cannot manufacture authoritative records;
pending release must respect actual revision/order acknowledgement. Old outcomes
after external changes cannot overwrite the new view; UI cancellation is not
proof a submitted backend effect was undone.

Future isolated port suggestions are6451/6453/6455/6457, not the already allocated
6443/6445/6447/6449 fixtures. Recheck availability before assignment. Main owns
manifests/lock/exports/shared renderer/harness/Git; workers get disjoint pure,
optional adapter and fixture paths after plan approval.

G-02 must establish pointer/touch/keyboard/simple move for both axes; actual
MutationObserver/node-identity evidence of no reparenting/placeholders; uneven
groups/hidden utilities/header-body alignment; handle focus/selection/sort isolation;
sort/filter/stale/pending restrictions across methods; deferred persistence/ABA/
latest-authoritative recovery; strict TS6/5.9; and actual packed optional-entry
interaction while headless/default installs and bundles omit dnd. Missing plugin
must diagnose and retain available accessible alternatives, not dead handles.
Revise incompatible adapter/config/version—not product requirements. No human AT,
real persistence, performance, release or publication acceptance is claimed.
