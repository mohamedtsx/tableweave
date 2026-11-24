# F1 callback fence — implementation stopped, not ready for intake

Static installed-source counterexample, **not an executed failing test**.

The pinned TanStack9.3.1 column option is `sortFn`, not the report's `sortingFn`:

- `packages/react/node_modules/@tanstack/table-core/dist/features/row-sorting/rowSortingFeature.types.d.ts:20–28,88`
- `…/rowSortingFeature.utils.js:142–148` returns a function-valued `columnDef.sortFn` directly.

The name correction is inside the current lease. The deeper issue is the installed
`constructSortFn` utility:

`packages/react/node_modules/@tanstack/table-core/dist/features/row-sorting/sortFns.js:34–45`

```js
const sortFn = Object.assign((rowA, rowB, columnId) => {
  let dataValueA = rowA.getValue(columnId);
  let dataValueB = rowB.getValue(columnId);
  const resolveDataValue = sortFn.resolveDataValue;
  if (resolveDataValue) {
    dataValueA = resolveDataValue(dataValueA);
    dataValueB = resolveDataValue(dataValueB);
  }
  return sortFn.sort(dataValueA, dataValueB, rowA, rowB, columnId);
}, def);
```

A legitimate app column can supply this returned function as its `sortFn`. The
first app `resolveDataValue` can synchronously begin actual P revocation and return.
The vendor closure then calls the same resolver for B and its app `sort` comparator
**before an outer function wrapper can run its post-call gate**. Those are known
nested vendor-to-app callbacks, not another invocation of the outer column callback.

Wrapping/cloning properties on the replacement column callback does not interpose:
the closure references the **original** `sortFn`, not `this` or the replacement.
Mutating the original function's properties would mutate app-owned/shared callbacks,
which is not authorized. Arbitrarily rebuilding every callable with `sort` properties
would substitute function semantics without genuine constructed-function provenance.
Patching the vendor closure is explicitly outside this lease. No workaround is made.

`sort-resolver-boundary.test.ts` authors the required one-resolver/zero-comparator
assertion using actual vendor rows, real certified P and the proposed outer wrapper.
It has **not** run; no red-before result is claimed. It is expected to expose the
static counterexample when the final-phase harness is authorized and corrected.

Main must select/allocate the supported constructed-comparator callback contract
before F1 can claim the required nested-callback fence. Merely renaming sortingFn
to sortFn or checking after the outer sort cannot satisfy that stronger requirement.
No product-policy waiver, dependency change or extra source path is inferred.

## Preserved partial state

- Five existing allocated producers and two new private producer files are edited,
  plus new tests in this directory only. They are **incomplete, unapproved**.
- Initial5/canonical109 hashes matched; separate104-source protection is preserved.
- Source first light compile failed on generic/brand narrowing casts; those local
  issues were addressed, but no subsequent source success is claimed.
- First fixture light compile failed on its missing local vendor type path, actual
  `sortFn` spelling, nullable fixture ticket and Subscription cleanup shape. Those
  logs remain original; fixture/support authoring is not yet complete.
- No unit, negative matrix, runtime graph, browser, SSR, packed or independent check
  has run. No shared build, Git, vendor, existing test or excluded-source edit.

Resume only after main's concrete callback-contract decision; preserve all original
failed logs/preimages and do not relabel the partial producer implementation-ready.
