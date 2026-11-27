# WP-08 query/layout intent handshake — mini independent review pending

Target: `/tmp/opencode/tableweave-wp08`. Read main's approved pre-code plan section
"Query/layout intent handshake before control UI" before implementation. Edits
remain inside presentation and core tests. No root/shared exports, docs ledger,
controller/native/resource/bootstrap, Git, installs, build outputs or UI changes.

## Exact public type extension

```ts
type ControlsIntent =
  | { readonly type: "sort" }
  | { readonly type: "columns" }
  | { readonly type: "select-row"; readonly id: string }
  | { readonly type: "select-page" }
  | { readonly type: "navigate" }
  | { readonly type: "reorder"; readonly ids: readonly string[] }
  | { readonly type: "retry" };
```

No new runtime exports, methods or public authority flags. Existing
ControlsAuthority.require(intent) continues returning ControlsPresentation.

## Semantics for UI callers

`require({type:"sort"})` / `require({type:"columns"})` read the live committed
controller/definition/scope/access/resource domain on EVERY call. They require
the original controller and definition, matching actual/expected scope, permitted
actual AND expected access and the same resource owner. Current request association
must belong to that controller/resource when a live request exists; boot with no
request is valid. Unsafe resource invalidation cannot authorize the domain.

They do NOT require loaded records/snapshot, resource.ready/canNavigate or the old
captured queryIdentity. Thus A-captured query/layout callbacks still work after
accepted B, before begin(B), while B loads or fails, and during same-query refresh.
Row/page/navigation/reorder/retry callbacks continue using their prior accepted /
displayed query and row authority guards. Cancel's same-owner cleanup semantics
remain unchanged. Same-origin read facts may be row-query-blocked while the new
query/layout intent succeeds; UI should not guess permission from null displayed
metadata or misuse navigation eligibility.

The guard itself invokes no updater, controller dispatch/proposal or transport.
UI invokes the guard, then its existing controller/native event synchronously.
Actual sorting IDs, multi-sort and required/hidden-column restrictions remain
owned by those producers. No generic dispatch, sorting method, pagination clamp,
new query/resource buffer or backend authorization is added.

Expected/actual context values and intent fields are captured once. Read frames
keep the domain decision private; origin mismatch retains n9's exhaustive neutral
facts. Exceptions from unsupported input/ports become generic ControlsError with
no returned foreign facts or owner writes.

## Fail first and evidence

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts tests/controls/core/query-layout.test.ts
```

Before producer edits: **2 failed / 2**. Both new intent kinds incorrectly denied
A-captured callbacks after accepted B while row/navigation correctly remained
blocked. The completed file now has **32 scenarios** covering that transition,
pending/failed B, boot/empty resources and client rows, same-query refresh/error,
scope/controller/definition/resource/access denial, foreign request registration,
generic throwing-port errors, accessor capture, no controlled proposals/updaters
and retained native/controller field validation.

```sh
pnpm exec vitest run --config tests/controls/core/vitest.config.ts
pnpm exec vitest run --config tests/controls/core/controller-regressions.vitest.config.ts
pnpm exec vitest run --config tests/controls/core/native-regressions.vitest.config.ts
pnpm exec playwright test --config tests/controls/core/native.playwright.config.ts
pnpm exec tsc -p packages/react/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p packages/react/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/tsconfig.json --noEmit
pnpm exec tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/controls/core/controller-regressions.tsconfig.json --noEmit
pnpm exec tsc -p tests/native/tsconfig.json --noEmit
node node_modules/typescript-5-9/bin/tsc -p tests/native/tsconfig.json --noEmit
pnpm exec biome check packages/react/src/controller/store.ts packages/react/src/controller/types.ts packages/react/src/presentation/*.ts packages/react/src/tanstack/adapter.ts packages/react/src/tanstack/definition.ts packages/react/src/tanstack/types.ts tests/controls/core/*.ts tests/controls/core/*.json
sha256sum -c tests/controls/core/query-layout-candidate.sha256
```

Scope: **161 core + 56 controller + 24 native = 241 unit tests**, all eight strict
TS6/TS5.9 checks (positive/negative fixtures included) and seven existing source
Chromium regressions on port **6437**. Prior n1–n9 and all 32 privacy scenarios
remain in the core run. Type fixtures enumerate the exact seven-kind union and
reject generic mutation payloads/methods or a public query-layout permission flag.

This is the tested producer handshake for UI, not UI delivery or independent
approval. Main owns the separate mini independent check and consumer assignment.
No full SSR/bootstrap, packed-consumer, manual AT, performance, release/gate or
backend-authorization claim. No build/Git/public integration performed here.
