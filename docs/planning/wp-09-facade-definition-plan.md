# WP-09 facade definition/controller composition — isolated provisional lease

TASK-017 / FR-01/04/16, D-10/11/24. Main chooses the private facade proposal's
curried defineTable<T>()(config) definition surface and actual native-controller
factory, without activating hook/shell work. useDataTable is the proposed later
facade-hook name; existing useTableweaveState/Query/Resource names stay unchanged.
No new name is public until main's explicit export integration and final proof.

## Scope and dependencies

In the isolated generations worktree at34fad4f, own only new
packages/react/src/table/{types,definition}.ts and new tests/table-facade/definition/**.
All existing source/harness/tests/config/exports/manifests/lock/docs/Git freeze.
Main owns package exports, later hook/model types and shared integration. No React
hook, DataTable UI, fetch/resource/publication/frame creation, install or dependency.

This stage uses stable NativeDefinitionInput/NativeDefinition/controller options
and native definition/controller functions, not NativeInput/ControlsInput or F1
symbols. U4 changed source unions but not those producer signatures; F1 cannot edit
native definition/controller/contracts. Do not consume changing shared F1 files as
accepted or invent future hook/frame/criteria types in the new table/types module.

## Exact contract and behavior

- DefineTableInput<S,T> extends actual NativeDefinitionInput<S,T>, adds tools and
  defaultColumns?:Partial<ColumnState>. TableDefinition<S,T> holds actual readonly
  native definition, resolved readonly tool placement and createController(options).
  Brand/invariant types plus private WeakMaps recognize actual instances at runtime.
- Tool placement is toolbar/external/hidden for builder/search/columnChooser,
  external/hidden for tabs/date. Builder defaults toolbar only when actual normalized
  schema has builder-owned fields; all other placements default hidden. Paging,
  selection/details/sorting capability remain existing native/schema policy.
  Placement never changes owner assignment, accepted filters or authorization.
- Delegate columns/schema/native flags to actual defineNativeTable, not a copied
  registry or structural native definition. Use existing native column helper in
  consumers; preserve ordinary row/cell/header/accessor inference without casts.
- The constructor retains configuration only, no row data/current query/publication/
  resource/selection singleton. It invokes no row ID/accessor/renderer/transport/clock.
  Existing producer validation/metadata reflection stays its actual contract, not
  a universal arbitrary-Proxy-side-effect prevention claim.
- Copy/validate/freeze only library-owned tool/default-column containers. Normalize
  defaults via existing pure columnState validation, not a throwaway controller/
  clock. Do not freeze application callback objects or mutate supplied columns.
- createController calls actual createNativeController once and returns that exact
  frozen controller. Preserve all required initial query/now, controlled groups,
  validators and callback behavior. No wrapper, readiness validator or second state.
- Merge initial columns with definition defaults: explicit order replaces default
  order; visibility merges by stable ID with explicit values winning. Existing native
  state validation still rejects unknown/utility/last-visible contradictions.
  Query/selection/details remain the actual explicit initial inputs, never defaulted
  from another owner. Two controllers from one reusable definition remain isolated.
- Capture actual C.getDefinition() reference after factory creation; it can differ
  from native.controllerDefinition due to normalization. Source-private assertion/
  lookup helpers may expose only the minimal identity proof needed by the later
  facade: exact registered D/C/CD plus native registration and current liveness.
  Unknown/copy/proxy/same-schema foreign values deny before private property traversal.
  No root export or general caller-register capability is allocated.

Use safe fixed facade-definition errors without raw input/error payloads; preserve
existing producer contract errors where meaningful. No future source/SSR/slot API.
Stop for a protected producer/interface change rather than widening the lease.

## Provisional proof code

Author inference/readonly/schema-owner/custom operand/native contexts and runtime
definition/controller/default merging/foreign owner/two-table/controlled acceptance
cases using actual factories. Preserve bootstrap/native/generation inputs exactly.
Only lightweight TS6 positive compile, syntax/scope and scoped formatting now.
Units/dual compiler/emitted/negative/import/SSR/browser/packed/independent verification
are deferred to the user's one final phase. Own README records source APIs/hash map,
actual lightweight results and exact deferred commands. No facade availability,
full WP-09 acceptance, zero-vendor import graph or verified controller claim.

## Preserved provisional handoff

Isolated1ebfb62 contains only two new producers/own test folder. Main reads the
actual definition/receiver/identity/default merging code and checks staged whitespace.
The worker's successful light TS6 compile predates final small source guards; final
syntax/scoped lint and750 protected inputs pass. This is not a final-source type or
runtime approval. Intake and one combined lightweight compile follow F1's handoff.
