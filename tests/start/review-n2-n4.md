# WP06 review corrections n2–n4 — 2026-11-24

Worker handoff in `/tmp/opencode/tableweave-wp06`, under the same exclusive app
scope. These are main's WP06 n2/n3/n4 (reviewer's original n1/n2/n3), **not an
independent approval or G04 acceptance claim**. Main's exact declaration patches,
dependency extension and strict compiler configuration remain unchanged.

## Independently reproduced before fixes

The reviewer reproduction was read from
`/tmp/opencode/wp06-independent-P24r1M/apps/example-start/review/lifecycle.spec.ts`.
Fresh app-owned regressions were added using actual browser cookies, committed
loader scope and a read-only synthetic inspection probe (counts/identities only;
no records, criteria or credentials). Before behavioral fixes:

```sh
WP06_PORT=6431 pnpm --filter @tableweave/example-start test:e2e tests/authorization.spec.ts
pnpm --filter @tableweave/example-start build
WP06_PORT=6431 WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e tests/authorization.spec.ts
```

Both development and production produced **four failures**:

1. Committed loader scope became Beta while Alpha rows remained visible/selectable.
2. Ordinary Refresh after a real unauthorized cookie retained rows instead of
   entering terminal access loss.
3. Malformed RPC mode was rejected with framework HTTP **200**, but lacked
   Cache-Control.
4. Cross-origin CSRF replay returned **403**, but lacked Cache-Control.

Before-fix traces/error contexts were preserved separately under
`.artifacts/start/review-before-development` and
`.artifacts/start/review-before-production`, rather than overwritten by passing
runs. No permission failure was inferred from a fake user role, UI hiding or a
requested fixture mode in these regressions.

## Repairs and ownership

### n2: accepted authorization lifecycle

- `src/rows/bootstrap.ts` re-reads the deliberately constant-key canary on every
  explicit authorization revalidation, verifies its scope, invalidates obsolete
  row freshness and prefetches using the exact shared `rowsOptions` factory.
- `Bootstrap` includes the application definition identity. The keyed boundary in
  `src/rows/session.tsx` mounts a new private runtime only for a new definition /
  scope identity. Its resource hook receives the **authoritative bootstrap**
  context, not the runtime's old context.
- A layout commit retires the previously committed runtime and purges other-scope
  Query entries. Old selection/details/options, rows/server snapshot and request
  authority are cleared; current Beta canary data is not erased by an old Alpha
  callback. Same-identity ordinary revalidation preserves page/selection.
- No committed adapter/controller/cache is mutated during speculative render.
  New runtime construction seeds only its private authorized bootstrap object.
  The explicit `/lifecycle` Suspense fixture proves abandoned Beta work leaves
  the committed Alpha selection/cache intact, while a later accepted Beta commit
  retires Alpha. No second QueryClient/provider or resource-hook owner was added.
- The UI moved to `src/rows/session.tsx`, rather than cross-importing a filesystem
  route from the lifecycle fixture; normal Start route splitting is retained.

### n3: actual typed permission outcome

- The server's actor/scope authorization returns a safe discriminated
  `RowsOutcome` (`access-lost`) for actual denied access. It still independently
  validates all transport/query fields. Fixture `deny` exercises that same outcome
  path, but the runtime no longer branches on that requested mode.
- The shared options convert that outcome to a local `AuthorizationLostError`.
  Runtime handling uses its type, not raw error text or arbitrary response fields.
  Terminal failure is applied only to the exact current pending resource token.
- The Query observer unmounts on access loss. A disabled but mounted observer was
  observed to recreate an empty cache entry after removal; that intermediate
  issue was fixed rather than weakening the clear-cache assertion.
- Real invalid-cookie ordinary Refresh now clears rows, selection, server snapshot
  and scoped cache/canary, with access/canSelect false. A delayed real denied reply
  for retired Alpha cannot revoke committed Beta; an old pending Alpha response
  cannot revive data through an Alpha/Beta/Alpha scope ABA.

### n4: outer private response policy

- The installed `createMiddleware({ type: 'request' })` establishes
  `Cache-Control: private, no-store` **before** CSRF and validation, and preserves
  it on their early Responses. No framework RPC status was fabricated.
- Tests retain HTTP **200** for the malformed-mode serialized error and **403**
  for CSRF rejection, and require private/no-store on both.

## Final verification on the new source

All commands ran in the isolated worktree. Port **6431** avoided main's 6013 packed
runner; no unrelated server was killed.

| Command | Actual final result |
| --- | --- |
| `WP06_PORT=6431 pnpm --filter @tableweave/example-start test:e2e` | **21/21 passed** (1.0m); original 13 retained plus 8 authorization/concurrency/rejection checks |
| `pnpm --filter @tableweave/example-start build` | Passed actual Start client + streaming SSR build, 365/146 transformed modules |
| `WP06_PORT=6431 WP06_PRODUCTION=1 pnpm --filter @tableweave/example-start test:e2e` | **21/21 passed** (59.4s), actual built default Start entry through the app Node host |
| `pnpm --filter @tableweave/example-start typecheck` | Passed strict TS 6.0.3 app/config checks |
| `node node_modules/typescript-5-9/bin/tsc -p apps/example-start/tsconfig.json --noEmit` | Passed strict TS 5.9.3 checks |
| `pnpm exec biome check apps/example-start/src apps/example-start/tests apps/example-start/vite.config.ts apps/example-start/playwright.config.ts` | Passed 21 files, no fixes |
| `node tests/start/check-client.mjs` | Passed; server reader/fixture markers absent from all four client chunks |

The same upstream unused-import warnings and intentional-abort diagnostics remain
visible. No compiler relaxation, dependency/runtime upgrade, install, core producer
edit, root/shared configuration edit, Git action or PR merge occurred.

## Fingerprints

22 application code/config files: all files below `apps/example-start/src` except
generated routeTree.gen.ts, all app tests, and app vite/playwright configs plus
serve.mjs. Sort paths; aggregate UTF-8 `path + NUL + sha256(file) + newline`:

`99257ac580451471c90aa8d8a9206c2d0ab869b168dec6d6df68e4fd6a14cd4e`

No main-owned `tests/start` helper is included in this source-set fingerprint.

| Final production chunk | Bytes | SHA-256 |
| --- | --- | --- |
| `index-DkHD1Wuq.js` | 425003 | `54f26bd20698156d93e511a6be24d8e52cdc098d4e0542a45accd24c903e9f14` |
| `lifecycle-CB3YKkG1.js` | 1163 | `c2bc2ed1756861a37469d0ad8e5c97c39d8258ea3a29fdc6cdaf536f2974f30b` |
| `routes-DCKNXIgx.js` | 261 | `f70faf0fb63b651f5f9a0f33463cb98c1fb6303a9d370f90a0a9de58260edce9` |
| `session-CDvuXra6.js` | 102635 | `fe315955cbd3e581e9093920151bb55ee34df367280fcacfa9ee37ac599d7368` |

## Remaining review / risk boundaries

Main must independently rereview and rerun packed/combined checks on **this new
source**. The background packed run copied the old candidate and proves nothing
about these repairs. The four main-owned compatibility/packed/preparation/client
helpers and main-appended UPSTREAM notes were not edited. Original evidence is
historical; it is not silently upgraded to cover this source fingerprint.

Synthetic cookies/authorization, local Node hosting and Chromium evidence remain
distinct from production authentication, actual consumer permission, supported
Safari/mobile/manual AT, performance, publication and personal maintainer
acceptance. No requirement or gate has been waived.
