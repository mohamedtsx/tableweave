# Reference performance protocol

Source: HLD §12; PRD D-30/D-34. Budgets are release acceptance targets, not
measurements. Fix the environment/protocol before recording results.

## Workloads and budgets

- Client: deterministic seed, 10,000 stable-ID records × 20 semantic fields;
  100 rendered page rows; representative text/number/enum/date/nullable values.
  Exercise five-rule All/Any, two-field sort, paging and visibility.
- Server: 100 records × 30 fields with supplied known/unknown metadata and larger
  total. Network/backend processing outside frontend interaction budget.
- Default lightweight library renderers. Consumer charts/editors form a separate
  reported workload; do not exclude costs after seeing bad measurements.
- Per-scenario p95 ≤200 ms applied filter/sort/page/visibility. Initial render
  ≤1 second after data availability. Measure reorder responsiveness without a new
  numeric drag-frame guarantee. No universal/mobile latency or dataset-max claim.

## Fixed environment

Isolated Ubuntu 24.04 x64, four dedicated vCPUs, 8 GiB RAM, fixed OS/browser image,
production build, viewport 1440 × 900, no competing jobs/extensions, no DevTools
instrumentation beyond documented harness. Record actual CPU model, browser/build,
commit/dirty state, fixture seed, resource constraints and lockfile.

Provisioning is a future authorized task, not an existing runner. Do not treat
different hardware results as comparable passes. Test mobile layouts separately.

## Sampling and timing

Warm up ten interactions, then record 100 measured samples **for each scenario
across three fresh production-browser sessions**. Record the session distribution
and report per-scenario p50/p95 and raw samples, not a single average hiding slow
cases. Initial samples use fresh table mounts after fixture availability;
separate route/network startup and SSR hydration.

Mark accepted-query commit → displayed accepted results after paint, including
predicate compilation, TanStack processing and React. For control-only changes,
mark action → resulting paint. Use performance marks, after-commit paint
synchronization and browser tracing; validate the harness itself.

Exclude network and configured debounce explicitly; report typing-to-result too
so a 300 ms debounce is not disguised as a ≤200 ms interaction. Identify arbitrary
consumer-renderer exclusions up front. Publish failures/variance/limitations and
the exact aggregation method; no “passes on my laptop” stable claim.

## Optimization and bundle boundaries

First use stable definitions/accessors, compiled predicates, native memoized row
models, leaf subscriptions, bounded buffers and component memoization. Pointer
movement must not rebuild every cell or commit full queries. Virtualization is
not the first/default fix and remains outside required v1 scope.

Report Tableweave own code separately from peers and optional sortable. Establish
any numeric bundle budget from packed production output as an engineering
baseline, not an invented product promise. Use [evidence template](../templates/evidence.md)
for baseline, raw artifacts, observed numbers, regressions and limits.
