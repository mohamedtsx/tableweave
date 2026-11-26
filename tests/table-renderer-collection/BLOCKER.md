# S2 fence: native React render-entry seam is outside the current lease

**STOPPED before producer edits. Not implementation-ready.** This is a static
installed-source trace, not an executed runtime/cycle/React/SSR reproduction.
The user explicitly requires stopping rather than hand-calling arbitrary React
components, replacing genuine native definitions/cells or narrowing renderers.

## Required boundary and the distinction that matters

The activated plan requires a genuine current renderer/model/argument check before
private native context is handed to the actual app component. Library-invoked
formatters/projections also require post-checks before returning their results or
doing next work. These are separate obligations.

React itself invokes a component produced by `React.createElement`. Calling that
helper does **not** invoke the app's function/class/memo/forwardRef body, so a check
after element creation cannot be reported as a post-callback check on that body.
App-owned returned nodes/effects/escaped props remain outside the promised boundary.
This report does not turn those internals into an extra containment requirement.

The problem here is the first obligation: the current available native API is an
unguarded child **component**, not a synchronous context-to-element helper that
the new collection adapter can surround with its own checks at the handoff point.

## Actual installed/source call trace

All paths below are relative to `/tmp/opencode/tableweave-wp09-stacked`.

1. `packages/react/src/tanstack/types.ts:91–110` includes `FlexRender` on the public
   native handle, but not lowercase `flexRender` or a guarded context/element port.
2. `packages/react/node_modules/@tanstack/react-table/dist/useTable.js:3,52`
   imports `FlexRender` and assigns that exact component to `tableInstance.FlexRender`.
3. `packages/react/src/tanstack/adapter.ts:624–641` freezes the actual handle with
   `FlexRender: table.FlexRender`. It supplies no renderer-entry hook. The existing
   F1 work checks/accessor/sort guards at `adapter.ts:234–274` do not wrap column
   header/cell renderer entry or React element creation.
4. `packages/heroui/src/table/native-collection.tsx:146,160,180` creates
   `<native.FlexRender header={header}/>` / `<native.FlexRender cell={cell}/>`.
   This creates a child element; it does not synchronously execute `FlexRender`.
5. `packages/heroui/src/table/controlled-collection.tsx:230–240,318–324` later places
   the cell content in actual compound `Table.Cell`/`Table.Row` markup. It is a
   separate frozen component, not an entry callback available to S2.
6. Installed `.../@tanstack/react-table/dist/FlexRender.js:41–52` executes later:

   ```js
   // Cell branch; aggregation/placeholder branches precede it.
   return flexRender(def.cell, cell.getContext());
   // Header branch:
   return flexRender(props.header.column.columnDef.header, props.header.getContext());
   ```

7. In that same installed file, `flexRender` at `20–22` does:

   ```js
   return isReactComponent(Comp) ? React.createElement(Comp, props) : Comp;
   ```

   The supported function/class/memo/forwardRef dispatch at `4–14` is the vendor's
   dispatch. There is no genuine S1 renderer-target/current-frame check at steps6–7.
   Its declaration `FlexRender.d.ts:4–9,17–29,47` provides no such parameter.

`packages/react/src/tanstack/definition.ts:105–106,119–129,161–170` captures/freeze-
copies native column definitions, preserving their original renderer values; S2
cannot quietly replace that definition or mutate its renderer objects. Genuine
native cell/context identity is not replaceable by a proxy or synthetic clone.

## Why the obvious wrapper does not establish the required entry fence

This preserves React semantics, but is insufficient as an exact context handoff:

```tsx
function GuardedEntry({ target, cell }) {
  requireCurrentRendererAndCell(target, cell);
  return <native.FlexRender cell={cell} />;
}
```

The guard completes when `GuardedEntry` returns its element. React can defer or
resume the child component separately. There is no check **inside** the subsequent
native child before `cell.getContext()`/`React.createElement(App, context)`. A source
revocation between those entries is not fenced by the earlier check. A parent
effect, DOM post-check, cleanup or later sibling guard is not a synchronous entry
check before that context handoff. This is a source-level boundary gap, not a claim
that a specific scheduling race was reproduced.

Hand-calling `native.FlexRender` would put its current implementation in a try/finally,
but it is an arbitrary React component API from the native handle, not a documented
imperative callback port. Hand-calling app renderers to obtain the same effect breaks
Hooks/class/exotic/Suspense semantics. Both are explicitly disallowed. A per-epoch/
config wrapper component type is also disallowed; remounting forms is not a guard.

Returning a component that itself returns `<App {...context}/>` is React-correct, but
without an authorized native/helper seam it either duplicates the vendor renderer
selection algorithm instead of using actual FlexRender, or replaces/proxies a native
column/cell to insert itself. Neither is an authorized fix.

## Existing synchronous vendor helper is a possible engineering route, not selected

The installed package exports the documented **lowercase** `flexRender` helper.
It may provide the needed synchronous library-owned context-to-element boundary
while leaving app component bodies React-owned and keeping a stable adapter type.
It must not be confused with hand-calling the uppercase component.

However, no such port exists on the frozen Tableweave native handle/root exports.
The styled package's `package.json:29–40` has no runtime dependency/peer on
`@tanstack/react-table`; `49` lists it only as a **devDependency**. Importing it in
styled production code merely because it resolves locally would introduce an
undeclared runtime dependency. Manifests, dependency changes and headless/native
exports/adapter/types are outside this lease. No import or package change was made.

Main can allocate a small engineering seam for the actual installed helper, with
exact ownership/dependency types and pre/post checks, or explicitly disposition a
different boundary. The first route should be evaluated before asking to restrict
renderers: **this is not evidence that a blanket React renderer restriction or
vendor patch is necessary.** Neither has been authorized. Native aggregation,
placeholder/header behavior, real contexts, stable component types and app-render
responsibilities still need explicit review/tests in any selected route.

If main instead intends only an outer pre-`<FlexRender>` gate, it must explicitly
reconcile that weaker boundary with the current requirement; S2 will not silently
call it an exact actual-component/context entry fence.

## Scope and next action

- The five allocated existing sources are unchanged. No new producer was written.
- All126 source files (including CSS) match the canonical baseline, not merely the
  protected121. All1360 captured existing test/config/artifact inputs are unchanged.
- Canonical source126 aggregate:
  `4a956137a365746d964c084a161884853650138c36e1aebe6a586d178345b731`.
- Original five source preimages, derived121-source protection map, original126 map,
  input hashes and installed trace hashes are retained in own `.artifacts/`.
- No S2 registry/membership/selection/focus/collection feature or behavioral suite
  is claimed implemented. Safe independent changes were not used to conceal the
  unresolved collection entry contract in a partial implementation-ready handoff.
- No Git, exports, old tests/seals, shared core, other workers' changing trees,
  manifests/lock, vendor or `.repo` edits; no install/build/emission/network/server/
  browser/agent work. Runtime/React/SSR/cycle/golden/negative/independent tests unrun.

**Main next:** inspect steps1–7 and choose/allocate the synchronous genuine
context-to-element seam (or reconcile the contract explicitly), then reactivate the
same bounded S2 registry/membership/collection/selection work. Main owns TASKS/docs/
intake and any ask-modal product-contract decision. This report grants none.
