# WP-07 private filter-tools producer

The isolated source integration is **agent-approved under delegated authority**
after independent corrections and the completed full workflow, including actual
packed UI interaction. Final WP-06 stack integration/PR delivery remains separate.
[TASKS](../../TASKS.md),
[review](../../REVIEW.md#wp-07--delegated-agent-review-session-1) and
[evidence](../evidence/wp-07-filter-tools-2026-11-24.md) record actual disposition.
No full DataTable/facade, fetching, persistence or backend permission is added.

## Actual server-safe helper entry

`@tableweave/react/filters` now exports:

- `getBuilderFields(schema)`: readonly typed `{ id, field }` entries for configured
  builder owners only. Neutral search/tabs/date ownership never becomes builder
  ownership; native column visibility is unrelated.
- `getFieldOperators(schema, builderFieldId, registry?)`: authoritative descriptors
  constrained by family/nullability/explicit allowlists and the supplied registry.
  Public field/operator literal types retain schema precision.
- `validateRuleDraft(schema, acceptedQuery, rawCandidate, options)`: valid/incomplete/
  invalid result, code-only issues and typed valid rule/query preview. Options
  extend the existing compile context (`now`, registry and client-evaluation policy)
  with optional `replaceRuleId`. Replacement preserves the existing rule ID.
  A preview is not accepted state; only controller dispatch/controlled acceptance
  commits it. Raw partial input remains outside the wire query.
- `createOptionSource<Id>(context, options?)` and `projectOptionSourceView` plus
  genuine own editor/source/request/page/label/view/error types.

These modules import no React/DOM/network/cache. They reuse existing normalization,
compiler/registry/inverse semantics rather than implement another evaluator.
Use the same registry as controller construction and accepted evaluation context.

## Plain option-source protocol

Context explicitly carries `definitionKey`, `scopeKey`, `fieldId`, `access`.
`setSelectedIds(context, ids)` supplies accepted IDs; it never changes a rule or
becomes the selection owner. Numeric/string IDs remain distinct, including0/"0".
One current term/page plus labels for currently supplied selected IDs is retained;
unselected old search pages are not cached. Unknown labels honestly use String(id)
with `known:false`. Application-supplied recovery never invents accepted values.

`begin({...context, term, pageKey, retry?})` returns an opaque exact-instance token
without fetching. The application starts its request after begin returns and
settles that exact token using `succeed(token,{options,hasMore})`,
`recoverSelectedLabels(token,labels)` or `fail(token,safeCode)`. Retry makes a new
generation for the latest requested term/page and invokes the supplied application
port; no automatic background retry/transport/cache is provided. Copied/old/cross-
source/scope/definition/field/term/page tokens cannot settle. hasMore is explicit,
never guessed from option count.

Expected-context projection masks old pages/labels before effects. If supplied,
accepted IDs for a newly expected allowed context receive unknown-label fallback,
not previous-scope labels. Terminal access loss is not restored by stale allowed
props. Actual context acceptance/reset/permission restoration belongs to the app.
Malformed/accessor envelopes reject without invoking getters or admitting mutable
payloads; failed input preserves snapshot/token identity. Public errors are fixed
safe codes/messages rather than arbitrary payload inspection.

One stable source owner connects in a **passive effect**, outside picker visibility.
Picker close or Suspense layout hiding is not real owner unmount. Real invalidation/
unmount/disposal clears private labels and outstanding tokens. Explicit app resource
onInvalidate can clear choice sources; do not acquire a second row-resource lifetime.
The stable server snapshot starts empty; no SSR/cache hydration follows from this
protocol. Combined emitted/packed lifecycle and visible-label masking checks now
pass; this is not a framework hydration or backend authorization service.

## UI and remaining boundaries

The [builder implementation handoff](../../tests/filter-tools/builder/README.md)
records exact props/option ports and source-fixture commands. Main owns
public/emitted/packed integration and independent finding disposition; the handoff
is not personal maintainer or whole-library acceptance.

The actual styled root exports FilterBuilder, FilterSearch, FilterTabs, FilterDate
and own public props/messages. The [bounded plan](../planning/wp-07-implementation-plan.md)
and exact source types own their contracts. Applied values are accepted controller
state, never a second optimistic query. `proposed` means submitted, not applied;
controller reject has no subscription notification. Draft Cancel, builder-only
Clear, search/date Clear and selection Cancel remain distinct operations.

Source and actual-tarball checks exercise real HeroUI composition, accepted-only
drafts, same-turn stale events, scoped options/Retry/cursors/labels, IME/Suspense
search, relative/preset/date precision, focus, responsive/RTL/theme and real built
Storybook plays. Default names include visible labels and rich value summaries;
Escape dismisses without implicit membership removal. Explicit final deselection
still removes its own rule. No second query evaluator/store/resource lifetime.

Full source workflow passes429 units,171 browser checks and43 genuine-tarball
production checks with strict unpatched NodeNext TS6/5.9 and install/runtime/CSS
confinement. This is not manual AT, actual supported devices, performance, real
consumer, complete facade/shell or release acceptance. Native collection/control
visual work remains separately scoped in WP-08; no overall WCAG claim follows.
