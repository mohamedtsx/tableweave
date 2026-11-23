# WP-05 resource producer implementation plan

## Authority and boundary

The delegated request explicitly authorizes plan then implementation in isolated
`/tmp/opencode/tableweave-wp05`, starting at accepted `b2974fc`, with main owning
Git delivery, root exports/manifests/test discovery and the shared TASKS ledger.
This document precedes runtime edits. Implementation owns only
`packages/react/src/resource/**` and `tests/resource/**`; no installs, Git writes,
UI notice component, transport/cache/auth/persistence service or option-label store.
The local `.repo/` reference is absent; the recorded assessment is the fallback,
not a fresh reference inspection.

Inputs: [WP-05](work-packets.md#wp-05-resource-presentation-and-race-safety),
[recovery](../../product/recovery.md), [resources](../engineering/resources.md),
[security](../engineering/security.md), AC-14–AC-17 and G-03. FR-13/D-26 recovery
is producer coverage only; downstream notice copy, controls and full application
authorization/SSR isolation remain integration work.

## Exact candidate interface

- `createResourceAdapter<T, Q extends WireQuery = WireQuery>(context, options?)`
  creates an independent in-memory presentation buffer. Context is
  `{ definitionKey, scopeKey, access }`. Applications must change definition and
  scope identities for corresponding changes; keys are not authorization proof.
- `begin({ definitionKey, scopeKey, queryKey, requestKey, query, retry? })`
  returns a frozen request token or `null` when inactive/blocked/wrong context.
  Every begin has a new monotonic generation, including same-key refreshes.
  `query` is an already accepted/validated wire query, copied/frozen by the adapter;
  application-supplied keys identify its effective query/request (including clock
  context where relevant). Tokens include scope, definition, keys and query.
- `succeed(token, { source: 'fresh' | 'placeholder', records, page, emptyKind,
  receivedAt })` accepts only the exact current token and fresh data. It shallow
  copies the record array without freezing/mutating application record objects.
  Page is `{kind:'known',total}` or `{kind:'unknown',hasNextPage}`. The timestamp
  is application-supplied provenance, never an implicit clock/cache identity.
- `fail(token, code)` accepts only the current token; codes are allowlisted
  `unavailable | offline | timeout | access-lost`. Unknown runtime errors map to
  a fixed generic public error; no supplied message/stack/payload is forwarded.
  Access loss clears the buffer and request, disables retry, and is terminal until
  an explicit allowed context transition. Old tokens can never restore records.
- `retry()` operates only on the current failure's request and supplied callback.
  It creates a new generation and calls that callback with the new token; the
  application starts/completes its request. There is no automatic retry loop.
- `setContext(context)`, `clear(reason)`, `dispose()` invalidate outstanding
  tokens and the one buffer. `onInvalidate(event)` is the synchronous application
  port for clearing selected IDs, details, option labels and transient operations
  on scope/definition/access/lifetime invalidation. The resource stores none of
  those application states. Callback failure is reported safely in the view;
  internal clearing happens before callbacks and cannot be undone by them.
- `getSnapshot`, stable `getServerSnapshot`, `subscribe` provide immutable,
  reactive external-store reads. The server snapshot is the initial empty view;
  this is not an SSR dehydration/cache integration or authorization guarantee.
- `useTableweaveResource(adapter, expectedContext)` subscribes and owns one
  committed lifetime for the adapter. It suppresses private rows synchronously
  during render when expected scope/definition/permission differs, and only
  commits context changes in a layout effect and lifetime ownership in a passive
  effect (no render writes). Suspense layout hide/reveal preserves the lifetime,
  matching the application's still-mounted passive request effect. Real unmount/
  StrictMode passive-effect cleanup clears the buffer/tokens synchronously in
  that cleanup phase, before the same component's later app passive cleanup;
  no timer/microtask or deferred cancellation is used. StrictMode replay can
  reconnect without permanent disposal.
  Application request effects must begin again after lifecycle replay/remount.
  A stale allowed permission prop cannot undo request-side access loss during
  replay/remount; restoring the same identity requires an explicit denied→allowed
  prop transition or direct application `setContext` call.
  One owning hook per adapter; other consumers can subscribe directly.

The view carries `kind`, current request, actual displayed snapshot, public error,
`busy`, `stale`, `obsolete`, display/notice precedence and action guards. A's
snapshot always retains A's page/query when B is requested. Retained empty data
uses neutral updating-empty precedence. Obsolete rows cannot be new selection or
reorder targets; navigation requiring current metadata waits for ready. Recovery
and Cancel are not removed by these producer guards.

## Sequence and observable acceptance

1. Add types, view derivation and token adapter; build declarations using existing
   strict TS 6 without manifest/export edits.
2. Add emitted-dist deterministic tests: A→B fail→retry B→fresh empty B; B before
   uncancellable A; same-key generations/failure; forged/cross-adapter tokens;
   placeholder rejection; previous empty; actual page and unknown totals;
   data-only refresh without query resets; scope/definition/access/lifetime clears;
   late callbacks and callback failure; independent stores; stable snapshots.
3. Add React hook and real Chromium fixture tests under `tests/resource`, with
   isolated Vite/Playwright configuration: committed StrictMode replay, unmount/
   remount, reactivity, render-time scope/access suppression, no render mutation,
   late completion rejection. Include Node server-render and stable server reads.
4. Run scoped build, TS 6/5.9 declarations/fixtures, Vitest, browser and lint/docs
   checks where available. Record exact commands/results and limits at handoff.
   [Fixture/integration notes](../../tests/resource/README.md) document the exact
   application port and isolated commands; main supplies the packet navigation
   link alongside its shared-file integration.

Scoped commands (configuration supplied under `tests/resource`):

```sh
pnpm exec tsc -p packages/react/tsconfig.build.json
pnpm exec tsc -p tests/resource/tsconfig.json
pnpm exec vitest run --config tests/resource/vitest.config.ts --configLoader runner
pnpm exec playwright test --config tests/resource/playwright.config.ts
```

Dependencies may only be symlinked from the two expressly allowed root worktree
locations. Generated outputs remain isolated. Stop for a product contradiction,
missing dependency, shared-file need or unproven security boundary rather than
weaken requirements. Main integrates exports/discovery/packing and an independent
reviewer assesses the packet; this worker does not claim maintainer acceptance.

## Initial worker verification handoff (before n1; not acceptance)

Executed in the isolated worktree at unchanged `b2974fc` on
`feat/wp-05-resource`, using only the two authorized dependency symlinks:

- Package declaration build: passed.
- Scoped TS 6.0.3 and installed TS 5.9.3 emitted-declaration consumers: passed.
- Scoped Vitest runner: **47 tests passed** (46 adapter/provenance/error/lifecycle
  tests, including async lifecycle rejection, plus one server render).
- Scoped Chromium runner: **6 tests passed**, including a reproduced-and-fixed
  terminal access-loss/remount regression and synchronous StrictMode revocation.
- Scoped Biome check: passed, 15 files. `git diff --check`: passed.
- `python3 scripts/check_docs.py`: blocked only by the plan and fixture README
  being unreachable from current main-owned entrypoints. Main must link this
  plan from WP-05; this plan already links the fixture README. No broken links,
  fragments or inventory findings were reported.
- `python3 -B scripts/test_check_docs.py`: 15/17 probes passed; the two failures
  depend on that same baseline reachability check. No docs pass is claimed.

The exact commands are above and in the fixture notes. Root exports/discovery,
packing allowlists, shared ledger/canonical status, integrated regressions and
independent review remain main-owned. No install, commit, PR, merge, publication,
real authentication, full SSR/hydration or release acceptance was performed.

## Review n1 — committed Suspense hide/reveal

Independently reproduced the reported HIGH lifecycle defect before runtime edits:
after ready A (one application passive fetch effect) or an open pending A,
committing same-scope Suspense fallback invoked the layout lifetime cleanup,
emitted a false `unmount` invalidation and erased app/adapter state while the
application passive request effect remained mounted. The prior abandoned
transition fixture did not cover a committed fallback.

Before command:

```sh
pnpm exec tsc -p packages/react/tsconfig.build.json
pnpm exec playwright test --config tests/resource/playwright.config.ts --grep "committed Suspense hide/reveal"
```

All three new ready/pending regressions failed with unexpected `["unmount"]`
instead of no invalidation. The fix changes only hook lifetime ownership from
layout to passive effect; context invalidation stays in layout and render-time
suppression stays pure. Public interfaces and the adapter state machine do not
change. Added browser checks cover ready retention, pending retention/completion
while hidden, and real unmount of both ready and pending hidden owners, including
late completion during the app's own cleanup. Existing StrictMode cleanup also
asserts cancellation before that application cleanup.

After correction, reran the exact scoped package build, TS 6.0.3 and TS 5.9.3
consumer checks, Vitest, full Chromium runner and Biome commands documented above:
all passed, **47 unit/SSR tests and 11 Chromium tests**. The three previously
failing committed-hide regressions pass, with no false invalidation or fetch
effect restart; real-unmount and StrictMode cleanup reject the app cleanup's
uncancellable late completion. Public API and existing six browser regressions
are unchanged/passing. No timer, microtask, render mutation, implicit fetching or
scope revival was introduced.

Documentation reruns retain only the original two unreachable-page findings
(this plan and the linked fixture README pending main's packet link); checker
probes remain 15/17 with the same two baseline-dependent failures. No docs pass
or review acceptance is claimed. Shared navigation/ledger/integration and the
independent n1 rereview remain main-owned; no Git/manifests/install work occurred.
