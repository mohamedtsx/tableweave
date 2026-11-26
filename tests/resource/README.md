# WP-05 resource producer verification

These tests exercise emitted `packages/react/dist/resource` modules, not source
aliases. Root exports, packed contents and default test discovery are deliberately
left to the coordinating session. The plan is
[WP-05 implementation plan](../../docs/planning/wp-05-implementation-plan.md).

## Integration interface

```ts
const adapter = createResourceAdapter<Row>(
  { definitionKey, scopeKey, access },
  {
    onInvalidate(event) {
      // Synchronously clear app/controller-owned selection, details,
      // option-label buffers and transient move/edit operations.
      // The adapter already cleared its rows and outstanding tokens.
      clearApplicationPrivateState(event);
    },
  },
);

// Application effect/transport owner, not a Tableweave fetch service:
const token = adapter.begin({
  definitionKey, scopeKey, queryKey, requestKey, query,
  retry(nextToken) { return runApplicationRequest(nextToken); },
});
if (token) runApplicationRequest(token);
// Application settles the exact token with succeed(token, freshResult)
// or fail(token, publicCode). It must explicitly distinguish fresh/placeholder.

// One committed hook owner per adapter; other readers may subscribe directly.
const view = useTableweaveResource(adapter, {
  definitionKey, scopeKey, access,
});
```

Queries must already be validated accepted wire queries. Keys must represent the
actual query/request, including explicit clock context if needed. The adapter
does not translate/execute requests, detect permission, infer empty cause or
guess totals. `fail(token, 'access-lost')` is an explicit application signal, not
an HTTP-status heuristic or authorization implementation. Other errors map only
allowlisted codes to fixed safe messages; arbitrary message/stack/payload fields
are never read. Render localized/custom copy from the code if desired.

Render `snapshot.query.pagination` and `snapshot.page` for displayed provenance,
not the current requested page over retained rows. Respect `notice`, `obsolete`
and action guards. Same-query refresh is data-only: no controller/query/presentation
reset is dispatched. Cancel and application recovery remain available separately.
Retry is supplied only through `canRetry`/`adapter.retry()` and receives the new
generation of the current failed request, never the retained query.

Context changes, explicit clear, access loss and lifetime cleanup invoke the
application invalidation port. Callback exceptions never restore rows; they set
`invalidationFailed` and block new requests until an explicit successful clear.
Async/thenable lifecycle callbacks are also rejected and safely observed; deferred
clearing does not satisfy the synchronous lifecycle port.
No resource-owned store exists for labels, selection, details or operations.
Applications must integrate those clears at their accepted context boundary and
independently authorize backend reads/actions. Keys and hidden UI grant no access.

The hook commits context changes in a layout effect and owns the adapter lifetime
in a passive effect, plus a pure render-time context guard. Suspense layout hide/
reveal is not unmount: the same-scope snapshot, pending token and app state remain,
matching the still-mounted application passive request effect. Speculative render
does not mutate the store. Real unmount/StrictMode passive-effect cleanup directly
clears the buffer and invalidates tokens before the same component's later app
passive cleanup; it schedules no timer/microtask or deferred cancellation. App
request effects must restart using `begin` after real remount/StrictMode replay,
not merely Suspense reveal. An unchanged old `access: true` prop cannot restore same-scope
access after a terminal response, even on remount. Restore explicitly with a
committed denied→allowed prop transition or application `setContext` call.

`getServerSnapshot()` deliberately remains the stable initial empty view; server
rendering runs no lifecycle effects and does not expose a mutable client buffer.
This is not a dehydrated loader/Query cache or the WP-06 SSR integration proof.
Record arrays/metadata/queries are copied/frozen, but application row objects are
not cloned/frozen; applications own immutable row values and retained references.

## Scoped commands

Run only from the isolated WP-05 worktree. Allowed existing dependency symlinks
are sufficient; no install is required. Runner loading avoids transient Vite
config bundles in shared `node_modules`; caches/results live in `.artifacts/`.

```sh
pnpm exec tsc -p packages/react/tsconfig.build.json
pnpm exec tsc -p tests/resource/tsconfig.json
node node_modules/typescript-5-9/bin/tsc -p tests/resource/tsconfig.json
pnpm exec vitest run --config tests/resource/vitest.config.ts --configLoader runner
pnpm exec playwright test --config tests/resource/playwright.config.ts
pnpm exec biome check packages/react/src/resource tests/resource
```

The Node fixtures cover deterministic identity/precedence/race/lifecycle/error
behavior and server-render immutability. Chromium fixtures cover actual React
StrictMode replay, reactivity, terminal revocation including synchronous effect
failure, remount, render-time scope/permission suppression, an abandoned
speculative scope transition, and actual committed Suspense hide/reveal with
ready/pending data (including completion while hidden). Real unmount while hidden
also verifies that a late completion in the app's own passive cleanup cannot be
accepted. No UI notice, real authentication, two-actor Start
SSR/hydration, real transport/cache, accessibility matrix, packed consumer or
performance/release proof is claimed. Review/acceptance belongs to the separate
reviewer/coordinator, not this fixture.
