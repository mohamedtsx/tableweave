# UNMOUNTED headless Start/Query facade recipe

FR-01/07/13/14, AC-22–27. These three new modules are not referenced by existing
routes. No router/provider/transport/runtime/manifest/cache driver was changed.
The existing sealed WP-06/G-04 native consumer and approval remain exact history;
this recipe inherits **none** of its packed/hydration/SSR approval.

## Actual API and caller responsibilities

- `recipeQueryOptions(namespace, input, read)` uses installed Query5.108.4
  queryOptions with a stable normalized wire/query identity, captured fixed example
  clock, domain and request/router-local namespace. No C/P/native model, auth token
  or callback enters a serialized key. No globals/cross-request cache is created.
- `createRecipeOwner({queryClient, read, context, namespace, initialQuery?})` creates
  fresh actual shared transaction D, its factory C, genuine P, resource and public
  controls-request bindings. The app must supply an **already-authorized** synthetic
  context (definitionKey `example-transactions`, its scopeKey and access:true), a
  QueryClient local to this request/router and a lifetime-exclusive namespace.
  A schema/namespace is not backend authorization. Never use module-global clients.
- `read(input, signal)` is supplied by the application. It must return an actual
  ResourceSuccess<Transaction> for that wire query/page and captured clock, with
  truthful known/unknown metadata, empty cause and fresh/offline origin. It owns
  backend filtering/sorting/paging, validation and authorization; this recipe does
  not fetch a guessed endpoint or locally filter an accepted server page. AbortSignal
  and semantic clock/scope apply to the app's read. Do not return a fabricated native
  frame, old accepted cache mirror or the sealed WP-06 runtime cast as a facade.
- `TableRecipe({owner})` borrows that retained owner in the **same explicit application
  lifetime**, subscribes real C/resource, connects in a committed effect and passes
  public modelOptions to useDataTable. It renders neutral SSR and an actual native
  semantic table after a genuine library commit. Search/pagination/retry operate
  through current public authority, not privileged status ports.

### Preload order — no duplicate fresh fetch

Construct/retain the owner **before** its loader preloads via `await owner.preload()`.
Both preload and mounted load use actual `queryClient.query(options)` (not fetchQuery)
with the same key/staleTime. Mount takes the fresh cache result without a second
fresh reader fetch. Initial publication really retires any pre-existing namespace
data; it is not an initial-only allowing certificate. Therefore loading an old cache
first and constructing this owner afterwards is **not** the supported ordering.
Neither queryOptions creation nor owner construction calls the reader by itself.

Request-local entry example, not an automatically installed route:

```ts
const owner = createRecipeOwner({ queryClient, read, context, namespace });
await owner.preload(); // called in the SAME request/router-owned lifetime
// retain owner, render <TableRecipe owner={owner} />; do not reconstruct per query
// request completion/permanent application disposal: owner.dispose()
```

Public P participant + retirement clear actual source records/bindings, pending
request receipts and the exclusive Query namespace; callbacks also check exact token,
connected state and terminal loss. Draft state has a real P purge participant.
Strict effect disconnect is a real source-owner retirement/reconnect; it may need
a new reader result after the prior namespace is cancelled/removed. This is not an
automatic transport retry or an application UI hide. Revoke is terminal and invalidates
current source before reuse. Caller-owned QueryClient is not disposed by this owner;
permanent caller `owner.dispose()` is distinct from Strict effect cleanup.

## Explicit integration gaps

No actual route loader/hydration/dehydration/error boundary/auth/scope handoff has
been mounted or executed. A server owner is **not serializable**; never serialize C/P,
criteria, resource, functions or granted authority. Actual Start SSR must allocate a
separate client lifetime, connect app authorization and current Query cache retirement,
prove request isolation and truthful cache adoption without duplicate fresh reading.
That cross-realm cache/authorization handoff needs its own allocation and proof;
this unmounted recipe does not claim it. No styled dependency is declared by this
Start app and this source imports no HeroUI/CSS/Storybook.

The new `apps/example-start/tsconfig.wp11-light.json` is positive SOURCE/noEmit only;
it includes these modules, not routes/typegen. It leaves the old app config untouched.
No Start build/typegen/routegen/server/browser/SSR/packed command ran here. Main must
choose and integrate genuine mounting later; TSX compilation is not Start integration.
