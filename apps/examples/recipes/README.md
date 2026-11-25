# Typed application recipes

These are new reusable source functions, **wired by the styled Vite main entry**,
not separate apps or independently executed demonstrations. FR-01/05/07/13–15.

| Module | Export and actual caller |
| --- | --- |
| custom-cells.tsx | transactionRecipeColumns adds a typed signed-value computed cell, a bound TableDetailsTrigger utility and a real application review button, once at D creation. Vite supplies the owner-bound callback. |
| row-bulk-actions.tsx | reviewSyntheticRow checks the current app input; syntheticBulkActions receives the production action context and updates a real synthetic app notice. It does not invent off-page objects, authorization or persistence. |
| custom-filter.tsx | NumericRecipeEditor retains an uncommitted numeric/range string draft and delegates validation/commit to the real builder. transactionRecipeTools passes the actual shared custom registry, typed zero-valued enum choices, set/date fields and independent tabs/search/date configuration. |
| locale-recovery.tsx | recipeLocale selects the **full** EN/AR DataTableLocale. SyntheticRecoveryControls uses real source/request subscriptions and actual begin/succeed/fail methods. Vite wires onRetry to the current resource and locale changes to a real C query.context command. |

The custom operator lives in preserved shared schemas and its native evaluation
registry is already configured by the shared transaction definition. These recipes
do not add library policies or exports. They are deliberately styled compositions;
neither headless Vite nor unmounted Start imports any of them. No private internal
registration, UI test helper or Storybook runtime is required.

Mounted-capable means connected from `apps/examples/vite/main.tsx`; **nothing was
mounted/run in this Stage B work**. Full custom picker/cardinality/inverse interactions,
focus/access-loss/late-event/dirty races and final a11y/visual checks remain owed.
No URL/storage persistence, built-in backend action, Export, drag/DnD activation or
auth claim is introduced. See Vite and evidence READMEs for commands and limits.
