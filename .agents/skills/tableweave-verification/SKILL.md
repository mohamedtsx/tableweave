---
name: tableweave-verification
description: Select and execute risk-based Tableweave documentation, contract, component, browser, SSR, packed-consumer, accessibility, benchmark, or release checks, and review the scope of resulting evidence.
---

# Verify the actual boundary

Read affected acceptance and [test strategy](../../../docs/testing/README.md).
Choose documentation, feature, feasibility, performance or release mode.

1. Name the failure/consequence/FR/AC/gate and inspect existing coverage/commands.
   Add tests only for a meaningful gap; minor visual adjustments normally need
   visual review. Missing runtime is not permission to invent/install one.
2. For docs, run [README checks](../../../README.md#check-documentation), inspect
   source-section semantics, skill triggers and task-sized reading paths. A
   structural pass is not proof of semantic equality or external URL health.
3. For runtime, choose pure/type, React, real-browser, SSR, tarball consumer,
   manual AT, benchmark or real application boundary as needed. Use actual pinned
   vendor tooling; label mocks/synthetic actors and distinguish app authorization
   from UI affordances.
4. Include rejection, empty, stale, late/uncancellable completion, scope loss,
   date equality/DST, controlled-owner and identity/focus failure risks relevant
   to this change. Isolate ports/fixtures/output paths for concurrent runs.
5. Benchmark only with [fixed protocol](../../../docs/engineering/performance.md)
   and comparable baseline. Review [stable gates](../../../product/release-gates.md)
   for release; a prerelease/Storybook/compile pass cannot substitute.
6. Review diff/results, fix in-scope defects and rerun affected checks. Record
   exact revision/dirty state, tools, target, fixture, command, results/artifacts
   and limits in [evidence](../../../docs/evidence/README.md). Stop after appropriate
   checks pass with no unresolved in-scope issue; do not loop for arbitrary counts.

Required missing proof prevents that outcome's completion. No publish/deploy,
real-consumer mutation, private data collection or WCAG claim follows from a
checklist. Use [handoff](../../../docs/templates/handoff.md) for unfinished work.
