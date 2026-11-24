# WP-08 controls producer candidate

Actual private core APIs, approved for scoped source integration after independent
review; UI/renderer, emitted/packed and whole-packet acceptance remain pending.
[TASKS](../../TASKS.md) owns live disposition and the
[plan](../planning/wp-08-implementation-plan.md) precedes implementation.

## Pure facts and existing owners

projectControls(definition,input) combines the actual current NativeTableView with
explicit client complete records/context or genuine server resource view/bindings.
It owns no subscription, request/cache/resource lifetime or second row pipeline.
Render consumes current view state/models, not committed stable-handle getters.

ControlsPresentation separates all selected IDs, loaded selected {id,record},
missing IDs, genuine eligible current-page rows, displayed snapshot query/page/
range/pageInfo, current requested query and busy/stale/obsolete/action facts.
No snapshot is not authoritative zero. Retained A keeps A metadata while B is
requested. Current context/access/definition/source provenance gates every fact;
foreign IDs/query/activity/checked/mixed bits are neutral before early returns.
Saved initial server snapshots do not override the resource's current context.
Matching-context genuine server snapshots remain supported, not invented SSR data.

## Atomic request and event authority

beginControlsRequest(definition,controller,resource,input) captures accepted query
identity/evaluation time **before** the existing resource.begin, returning the
real token and immutable binding. It starts no transport. Applications own begin,
requests, cancellation, settlement and retained snapshot binding references.
getControlsRequestBinding only retrieves a previously registered exact token;
it cannot post-hoc bind/rebind an old request to a newer relative-date clock.

createControlsAuthority captures a render-origin definition/controller/context/
query and an application committed-read port. Never write speculative render props
into that port. read/require and commands reread current accepted ownership and
resource inputs; old-scope or wrong-owner handlers cannot mutate the new owner.
Ordinary stale render views fail safely rather than gaining foreign facts.

Row/page/reorder/navigation/retry intents keep their specific freshness/eligibility
guards. Cancel ignores query/readiness while retaining owner/definition/scope
identity, so recovery stays available during same-owner refresh/failure. Sort and
columns are owner-domain criteria/layout intents: allowed during same-owner query/
loading changes, but never by a foreign controller/resource/scope/access origin.
They do not grant retained-row actions or backend authorization.

getControlsAuthorityOwner returns the exact frozen {definition,controller} pair
registered by the genuine factory, or null for copied/inherited/proxy objects.
It invokes no methods/getters/ports and is not authorization. Consumers with a
separate mutation target compare **both exact identities**, then require the
specific event-time intent. Query strings/object identity are not an owner proof.

UI hosts must derive presentation and authority from the same current owned input.
These separate public values do not promise automatic cross-input binding; passing
another table's facts can display that table while authority commands still target
their own genuine owner. The composed host must not create that mismatch. This
precondition never excuses rendering private criteria from genuine context-masked
facts: requestedQuery:null is unavailable, not authoritative zero selection.

## Native single mode and controller capability closure

Native definitions accept selection:true|multiple|single, with false/omission
disabled and true retaining multiple compatibility. NativeSelectionMode is
immutable. Single replaces rather than merges selected IDs, and all page-selection
commands reject, including direct generic commands and final controlled acceptance.
The existing controller remains the only accepted-state owner.

The optional pure synchronous validateCommand guard captures immutable command
envelopes once and runs before reduction/publication and final acceptance, including
no-ops. Native construction composes that mode guard with the captured application
callback. Existing validateState semantics remain separate. Async/nonvoid/throwing
guard failures preserve state/pending and are safely handled. No authorization or
persistence is established by either UI state or these schema/capability guards.

## Temporary styled-runtime compatibility

Ordinary RAC1.22.1 grouped/Strict runtime loses the dirty flag when cloning cached
headers. The user selects an explicit temporary application-side patch for private/
prerelease delivery. The [profile/bootstrap](../../packages/heroui/compat/rac-table-clone/README.md)
preserves the actual boolean, not a forced-clean flag or second pipeline. Headless
and unpatched public declaration lanes remain independent. A peer version alone
cannot express the installed patch state; verify actual bytes explicitly.

The styled archive includes exactly six compat assets, without runtime imports,
public vendor props, automatic configuration or postinstall. Extract them before
installation into app-owned patches and load the consumer's own pnpm workspace
configuration. Do not pass --ignore-workspace for this profiled install: it ignores
the explicit patch registration too. Root development combines the original two
declaration repairs with the exact runtime asset; root configuration never silently
propagates through tarballs. Only changed runtime map annotations are removed;
original maps are retained but not advertised as regenerated.

Main's rebuilt emitted38 and separate actual profiled-production38 pass, alongside
unpatched strict declaration consumers and explicit unpatched E_VENDOR rejection.
Independent final integration/full workflow/stack are still required. These are
selected ESM production and Node import checks, not full CJS table interactions,
all raw vendor structures, general package-manager layouts or stable/G-05/manual/
device/performance/legal/publication acceptance.

## Real-tool selection focus handoff

Real builder/search/tab/date composition exposes a modal phase boundary not covered
by a plain portal: its background remains inert until passive cleanup. SelectionToolbar
captures removed focus in layout cleanup, then restores in the passive phase after
that cleanup. It requires fresh same-owner authority/liveness/selection-phase facts,
preserves surviving external focus and rechecks after any application fallback.
It does not focus disabled/inert targets or alter modal containment, timers, global
handlers or vendor internals. The synchronous application fallback remains a focus
target port, not backend authorization or a general asynchronous operation wrapper.

The [real composition](../../tests/controls/filter-composition/README.md) passes
unchanged19 emitted and actual profiled-production cases plus four real built
Storybook plays. [Permanent focus probes](../../tests/controls/focus-handoff/README.md)
add ten actual public and genuine packed cases, independently reviewed at their
stated boundaries. See [stack evidence](../evidence/wp-08-stack-2026-11-24.md) for the
preserved original failure, named corrected generation and exact current limits.

## Remaining integration

Real WP-07 tools in the normal/external regions retain their accepted raw-tool
coherent-context host precondition. This packet proves guarded control actions,
selection replacement, local portal/draft lifetime and criteria preservation; it
does not claim a new live criteria-authority seam for same-controller pre-render
scope/access/reset transitions. That integrated AC-16/25 obligation remains open
for the separately planned WP-09 facade. A hidden slot or equal query string is
not that proof, and immediate application revocation must be explicitly published.

Selection, pager/correction, sorting/chooser and guarded native collection have
bounded independent source approval. Main emits actual own root types/messages/CSS
and verifies genuine tarball strict NodeNext TS6/5.9/runtime boundaries. See the
[dated observations](../evidence/wp-08-controls-2026-11-24.md), not inferred UI proof.
Actual packed composition/focus proof is now recorded separately from source/type
checks. Main still owns the complete ordered stack workflow and final packet/remote
approval; focused preflights do not replace that result.
No manual AT/device/performance/real-consumer/G-05 or publication claim follows.

Scoped source handoffs (not a second live task board):

- [Core protocol](../../packages/react/src/presentation/README.md)
- [Original correction](../../tests/controls/core/review-handoff.md),
  [privacy ordering](../../tests/controls/core/privacy-review-handoff.md),
  [neutral authority facts](../../tests/controls/core/authority-mask-review-handoff.md)
  and [query/layout intent closure](../../tests/controls/core/query-layout-handoff.md)
- [SelectionToolbar candidate](../../tests/controls/selection/README.md)
- [Selection privacy correction](../../tests/controls/selection/privacy-correction.md)
- [Pagination/correction candidate](../../tests/controls/pagination/handoff.md)
- [Pagination guard corrections](../../tests/controls/pagination/review-fixes.md)
- [Unsupported-Promise original negative evidence](../../tests/controls/pagination/promise-original-failure.md)
- [Pager test classifications](../../tests/controls/pagination/test-classification-handoff.md)
- [Sorting/column chooser](../../tests/controls/columns/README.md)
- [Rapid popover correction and original failure evidence](../../tests/controls/columns/rapid-correction-README.md)
- [Guarded collection and contrast disposition](../../tests/controls/collection/HANDOFF.md)
- [Public controls-only composition](../../tests/controls/integration/README.md)
- [Portable harness observations and remaining viewport failure](../../tests/controls/harness/README.md)
- [Compatibility asset checks](../../tests/compat/rac-table-clone/README.md)
- [Original asset construction handoff](../../tests/compat/rac-table-clone/HANDOFF.md)
