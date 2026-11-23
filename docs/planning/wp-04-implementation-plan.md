# WP-04 native/collection feasibility plan

TASK-012 under TASK-011's explicit delegated delivery grant. Plan before feature
code; independent numbered review and evidence-based **agent technical approval**
precede commit/PR. The maintainer's personal PR review remains later. No PR merge.

## Input and observable outcome

Accepted WP-02 wire/operators and WP-03 controller/hooks at `b2974fc` (PR #3, open).
Pinned installed TanStack Table 9.3.1, HeroUI/styles 3.2.8, React/DOM 19.3.1,
React Aria peers and existing strict TS/packed/browser harnesses. Do not upgrade
vendors or assume v8 construction, global callbacks or Aria sort-state APIs.

Deliver G-01's executable native bridge: one accepted controller, one native row
pipeline, one composite predicate carrier, stable IDs and subscribed controlled
projections; a minimal real HeroUI collection proves grouped headers, row header,
selection/focus and sorting semantics. Applications own server pages and metadata;
manual mode must not reprocess a partial page. The carrier must not appear in
rendered leaves, chooser/order capabilities or application actions.

Owners: [rendering](../engineering/rendering.md),
[state/query](../engineering/state-and-query.md),
[G-01](../engineering/feasibility.md#g-01-native-processing-and-collection-bridge),
AC-01/03/13/23/25 and relevant AC-26 import/type checks. No resource adapter,
filter tool UI, details, sortable plugin or final complete DataTable is implied.
The [candidate API contract](../engineering/wp-04-native.md) distinguishes actual
root exports from accepted APIs and still-proposed whole-table facades.

## Evidence/reference preparation

- Two independent read-only agents inspect installed v9 and v3 sources/types and
  matching official references. Exact API/interface findings are incorporated
  into implementation handoffs, not inferred from this provisional document.
- Primary HeroUI component reference is v3 Storybook; installed source wins for
  release-specific signatures. `.repo/` remains read-only and source-private.
- Supplementary Figma prototype node 2:72 inspected read-only through a file
  session: quiet title/table/filter row/footer hierarchy. No file edits, copied
  assets/business rules, default money colors or final visual approval. Prototype
  is not the primary taste source and does not prove grouped/selection behavior.
- Minimal feasibility presentation reuses HeroUI semantic styling and native
  collection anatomy. Full tools/scenes are later packets; this provisional
  disposition cannot waive their visual/accessibility acceptance.

## Exclusive paths and order

Main owns TASKS/REVIEW, plans/contracts/evidence, root exports, manifests/lockfile,
test discovery/packing/server configuration, integration/checks and Git/PRs.
Native worker owns only `packages/react/src/tanstack/**` and native unit/type
fixtures. Collection worker owns only `packages/heroui/src/table/**` and its
allocated fixture module after the native producer interface is handed off.
Review worker reads the integrated candidate and writes only its allocated review
report, not source fixes or shared ledger. Main integrates fixes serially.

1. Finish actual-release research; name factory/hook/features and verified
   per-slice callback/subscription contracts. Escalate incompatibility before code.
2. Establish failing native vectors: cross-field Any, same-field rules, filter →
   sort → page, controller rejection, stable row IDs, native functional updaters,
   hidden/order projection and manual partial-page behavior.
3. Implement the typed definition/bridge on v9 with directional imports and one
   filtering carrier. No second row engine or independently accepted state mirror.
4. Build minimal HeroUI collection from the resulting native row/header model;
   stable row/cell/column keys, grouped header hierarchy, row-header textValue and
   controlled primary sort. Multi-sort actions announce priorities explicitly.
5. Add isolated real React browser fixture (separate server/port) and inspect
   actual DOM/ARIA, focus/selection changes, native row projections and subscribers.
6. Extend actual public exports/type/Node/packed tarball checks deliberately;
   retain exact contents and default no-sortable/headless-no-UI exclusions.
7. Run scoped/native/browser checks, strict TS/packed consumers and full suite.
   Independent reviewer records n1/n2 findings with reproductions; fix and rerun.
8. Main records explicit G-01 scope/limitations and agent approval only if required
   proof passes. Commit/push `feat/wp-04-native-bridge`; create PR based on
   `feat/wp-03-coordinator`. Do not merge. Open WP-05's plan only after handoff.

## Conformance and stop conditions

The bridge derives accepted native options from controller snapshots. Native
callbacks route commands through the coordinator; rejected controlled proposals
must not change native accepted reads or emit partial requests. Arbitrary native
reset/update escape hatches cannot override row ID, carrier, processing mode or
managed state. Use a narrow supported escape hatch, not blanket option spreading.

Client mode supplies complete synthetic records to the actual native pipeline.
Server mode supplies the actual current page with explicit known/unknown metadata;
no guessed totals and no hidden client filtering/sorting/paging of that page.
Stable duplicate IDs and invalid definitions fail visibly rather than using
indexes. Hidden IDs remain in full order; utilities/groups and valid visibility
remain coordinator-owned. Row objects/records are not selected-ID ownership.

Required evidence: native row-ID assertions, inferred native cell/header/row types,
real subscriptions, generated grouped collection/ARIA and current-page selection/
focus, single/multi-sort priority, carrier exclusion, local/manual behavior and
accepted/rejected native mutations. Root client and server-safe subpaths retain
their boundaries. No G-02/G-03/G-04/full G-05, manual AT, actual Safari/mobile,
performance, real-consumer or publication pass follows from G-01.

Stop dependent expansion on an incompatible API, divergent processing, lost
identity, invalid collection, double store, unsafe diagnostics or missing G-01
proof. Ordinary engineering fixes stay in scope; product requirements are not
weakened to obtain a pass. Missing external evidence remains explicit, not agent-
approved away. All examples/records are synthetic; no upload/telemetry/storage.

## Compatibility repair disposition — 2026-11-24

The actual grouped Chromium proof passes, but strict declaration checks expose
RAC 1.22.1 conflicting exact-optional inherited properties in Group/OverlayArrow,
and HeroUI 3.2.8 extensionless declaration imports under NodeNext. Registry/source
research finds no newer stable version of the affected releases. Main authorizes
this bounded repair under the user's delegated engineering grant **before** patch
application/install; it is not a new runtime dependency upgrade or gate pass:

- Exact pnpm patch `react-aria-components@1.22.1`, declarations only: omit keys
  owned by AriaLabelingProps/DOMProps from the competing React HTMLAttributes
  bases. Retain authoritative Aria properties, strictness and runtime bytes.
- HeroUI package build uses ESNext/Bundler module resolution to consume the
  vendor's genuine declarations. All strict flags, exactOptionalPropertyTypes,
  noEmitOnError and skipLibCheck:false remain. Tableweave retains explicit `.js`
  local paths and independent **unpatched NodeNext** tarball type consumers.
- Public renderer signatures use genuine Tableweave-owned props plus React
  return types; never inferred vendor component props that leak broken vendor
  declarations. This must preserve actual capabilities, not erase the API.
- Declare direct `react-aria@3.53.1` and `react-aria-components@1.22.1` renderer
  peers. No version change or forced peer override. Preserve Apache license and
  identify declaration modifications; no copied reference runtime code.
- Patch attribution/license/removal policy is in the [patch notes](../../patches/README.md).
- Copy patch material into the fresh-install harness, verify fail-closed frozen
  reapplication and add strict positive/negative property regressions. Check
  runtime-file integrity. Root patch config does not propagate to downstream
  tarballs; direct raw vendor imports retain their upstream limitations.

ADR-07 records the rationale/alternatives/removal criteria. Approval remains
conditional on integrated renderer/native/browser and strict packed proof; no
upstream issue/PR publication is authorized merely by this repair.

## Native commit-boundary correction — 2026-11-24

Independent n1 reproduction shows React Table's persistent render-mutated native
instance exposes suspended speculative records through committed handles. The
bounded correction builds actual native model candidates with the matching core
constructor and its public store reactivity bindings, then publishes supported
reads/actions only on commit. This remains one TanStack processing engine, not a
second row/filter implementation. Real native subscriptions remain required.

Before installation, main scopes the direct runtime dependency
`@tanstack/table-core@9.3.1`, exactly matching the accepted React Table9.3.1 core,
for the public `reactivity` and `store-reactivity-bindings` imports. Do not rely on
an undeclared transitive pnpm package. No other TanStack/runtime version changes
or native API escape hatches are authorized. Root server-safe import graphs must
remain React/native-free; strict packed dependency/bundle guards are updated and
rerun. Controller preacceptance restrictions, current metadata and native toggle
freshness remain separate n2–n4 corrections, not presumed fixed by construction.

N2's main-owned coordinator extension is an optional synchronous pure
`ControllerOptions.validateState(state)` constraint. Validate initial state,
new reduced candidates before replacing pending intent/publishing onRequest, and
final acceptance after selection overrides before commit. Exceptions or nonvoid/
async returns reject safely without accepted-state/revision/notification/pending
changes. Observe rejected promises without exposing errors; do not authorize
asynchronous policy or application mutations. Native construction composes its
definition restrictions with this port instead of wrapping dispatch/accept or
committing first and throwing during rendering. Add direct coordinator regressions
and retain all prior controller protocol tests.
