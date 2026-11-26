# Feasibility and readiness

Source: HLD §14. G-01–G-05 are **engineering acceptance activities**,
not unresolved product scope. Architecture is reviewable; API/dependency freezing
waits for proof. Current task status belongs only in [TASKS](../../TASKS.md).
WP-04 now records [scoped executed G-01 evidence](../evidence/wp-04-native-2026-11-24.md)
and delegated technical approval; no later gate or personal maintainer review
follows automatically from that result.

## G-01 Native processing and collection bridge

Prove pinned TanStack v9 controlled projections, hidden composite-predicate
carrier, grouped HeroUI collections, stable-ID selection, multi-sort and reactive
leaf subscriptions compose correctly. Deliver a minimal real-browser fixture,
type checks, row-model assertions, native-control transition tests and generated
ARIA review. Correct the bridge before feature expansion. Record actual peers;
no v8 API or removed global callback assumptions.

## G-02 Sortable collection compatibility

Prove selected sortable API preserves React Aria collection identity without
unowned DOM reparenting. Row/column fixtures must cover pointer/touch/keyboard,
simple non-drag controls, cancellation, focus restoration, group/utility/hidden
order and pending/failure behavior. If unsupported, revise isolated adapter/version
and ADR-08; do not downgrade accessibility or identity requirements.

## G-03 Resource races and access loss

Prove scope/key guards and bounded presentation buffer handle new-query failure,
fresh empty success, retries, access loss and late/uncancellable responses.
No leaked/mislabeled retained rows, obsolete action targets or wrong retry query.
Use deterministic fixtures with explicit acceptance identity.

## G-04 SSR and hydration

Prove Start request-local clients, two-actor isolation, initial locale/timezone/
clock/state, same-options loader/cache handoff and hydration without duplicate
fresh reads. Record actual provider/integration arrangement; stories do not prove
SSR and mock actors do not prove a real consumer's authorization.

## G-05 Packed compatibility and performance

Prove declared types/exports/peer matrix, headless/optional import boundaries,
styles/client directives and clean packed consumers, plus reproducible reference
performance evidence. Narrow untested peer promises through explicit review or
optimize; do not claim untested combinations. This gate spans later packaging and
performance packets; an early successful build is not full G-05 completion.

## Ready to begin versus ready to release

Before execution: review HLD-derived contracts (TASK-002), authorize a bounded
packet, assign an owner/paths and inspect the current tree. No blanket permission
to install or publish follows from a backlog. WP-01 can establish the workspace
needed for feasibility; only proof-dependent API freeze/feature expansion waits
on the corresponding gate. Independent safe work may proceed when authorized.

At stable release: every [product gate](../../product/release-gates.md), all
engineering gates, reviewed design/stories, manual accessibility, exact browser
matrix, full examples and authorized real-consumer evidence remain required.
