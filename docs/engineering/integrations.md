# Application integration: Start, Query and server processing

Source: HLD §7; ADR-09. Primary integration is TanStack Start + Query; core
imports neither. Additional Vite React and Next App Router consumers exercise
the same [public contracts](public-api.md).

## Implemented bounded Start fixture

WP-06's private [actual app](../../apps/example-start/README.md) is agent-approved
under delegated engineering authority for scoped G-04/AC-22–24. It uses one
request/router-local QueryClient/provider, explicit app-owned authorization grants
and authorized bootstrap around the existing resource producer; the producer's
empty server snapshot is unchanged. Normal refresh and bootstrap denials are
distinct from recoverable unavailability, and old wrappers cannot resume revoked
private cache. Accepted scope/definition changes retire the prior owner at commit.

The corrected full workflow passes actual source and genuine-tarball Start HTTP/
Chromium development/production cases with strict TS6/5.9 and resolved-file install
confinement. [Evidence](../evidence/wp-06-start-2026-11-24.md) preserves independent
failures/fixes, exact versions/hashes and limits. This is not a full styled table,
production auth/database/backend translator, Next/device/AT/performance/real-consumer
or release proof. All PRs remain unmerged for personal maintainer review.

## State before data

Create accepted query state before the request, then adapt the result into a
resource and build/render the table. Do not require a table instance to discover
the query needed to fetch that table's records.

```text
definition → accepted state → normalized plan/request key
            → app query options/loadRows(signal)
            → identity-tagged Snapshot → Resource → table
```

An application Query key includes schema/version, authorized data scope,
normalized criteria, sorting, page/size and resolved date boundaries. It excludes
renderer functions, selected IDs, column visibility, drafts and timestamps that
change every render. Query identity and semantic filter identity have different
jobs: sorting/pagination change requests but preserve selection.

WP-03 implements `useTableweaveState`/`useTableweaveQuery`; WP-02 exposes
`getQueryIdentity` rather than an assumed `queryKeyOf` alias. WP-05 now implements
`useTableweaveResource(adapter, expectedContext)` over the plain tagged resource
adapter, never a Query-specific result type. See the actual
[resource protocol](resources.md#implemented-private-producer), not the HLD's
illustrative hook signature. An already-loaded server page still needs truthful
scope/query identity and page metadata.

## Application port and cancellation

`loadRows` is an application-owned **isomorphic port**, not library fetching.
Browser HTTP requests consume AbortSignal. SSR uses an authorized request-scoped
reader or correctly configured server transport. Node cannot be assumed to fetch
relative browser URLs; AbortSignal is not a serializable server-function payload.

Use accepted plan identity captured at request start in the returned snapshot,
not controller state when a delayed response finishes. Consume cancellation but
also guard scope/key/generation for uncancellable/late transports. Old option
requests get equivalent term/scope guards.

Query's previous-data placeholder is not a complete refresh-failure solution.
Maintain the bounded last accepted same-scope presentation snapshot described in
[resources](resources.md), including after new-key failure. The app owns cache
freshness/retry policy; HLD's illustrative 30-second stale time is not a library
constant. No automatic infinite retry/mutation replay.

## Start SSR and hydration

- Create the QueryClient inside router/request construction, **not module scope**.
  Preserve the browser's router client. Use matching root-route context typing.
- Use one matching Router SSR Query integration/provider, not duplicate cache
  hydration owners. Check the actual installed Start/Router/Query docs/types.
- Prefetch critical data in the route loader with the same query options/key
  used by the component. HLD research cited `queryClient.query(options)` in
  current Start guidance; feasibility must verify installed APIs. A bare,
  unprefetched `useQuery` is not SSR-data evidence.
- Dehydrate/serialize validated query state and authorized data only. Accessors,
  JSX columns, drawers and mutation callbacks stay client code.
- Share initial controller snapshot/IDs/locale/timezone/clock for hydration;
  do not guess viewport on the server. Use responsive CSS.
- Exercise two simultaneous actor/scope requests and verify no data/cache leaks,
  stable hydration and no duplicate fresh reads from a mismatched key/provider.

Vite has no implied Start server facilities. Next App Router must verify preserved
client directives, server-safe contracts and no browser globals/React runtime
pulled into request-handler imports.

## Application server responsibilities

Authenticate actor; authorize dataset/fields/actions; validate the versioned query
against authoritative schema; enforce limits; map allowlisted IDs/operators to
parameterized backend queries. Apply filtering → sorting → pagination, with a
deterministic record-ID tie-breaker where needed. Do not interpolate client field
names, SQL fragments or arbitrary predicates.

Return matching totals **or** explicit `hasNextPage`, plus correct query/scope
identity and empty cause when known. If data shrinks beyond the page, provide an
authoritative corrected-page indication or accept a bounded controller
correction/refetch. Prevent infinite correction loops or fabricated page labels.

Mutations authorize and validate independently, acknowledge actual outcomes and
invalidate the relevant scope. Table UI never confirms a backend write by itself.
The synthetic example need not adopt Gamila's database/auth/transport stack.
