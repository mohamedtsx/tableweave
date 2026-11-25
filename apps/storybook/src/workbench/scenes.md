# WP-11 Stage A scene map — all runtime checks UNRUN

TASK-019 / FR-01–FR-16 / AC-01/27. These are exact **CSF-defined** IDs from explicit
metadata IDs and named story exports, not a verified built Storybook index. The old
20 focused stories are unchanged. New five modules contain33 real annotated stories
(the31 required labels plus controlled acceptance and an owner-conflict diagnostic).
Every new play uses real DOM actions/awaited assertions and a completion marker.
Compilation/static discovery are not execution, visual acceptance or completeness.

| F / FR | Required scene and CSF-defined ID | Authored coverage / exact remaining gap |
| --- | --- | --- |
| F-01 / FR-01/07/12 | `wp11-configurations--default` | Minimal builder + pagination; no selection/search/tabs/details. Public source typechecked only. |
| F-02 / FR-01/05–10/15 | `wp11-configurations--fully-configured` | Explicit search/tabs/date/chooser/selection/details, computed amount cell, app actions. States missing dragging/G-02. |
| F-02 / FR-07–10 | `wp11-filters--field-ownership` | Hidden builder field offered; search/tab/date owners excluded. Neutral ownership proof remains unrun. |
| F-03 / FR-07 | `wp11-filters--builder-all-any` | Two genuine accepted rules + join change. Duplicate/Negate/Remove permutations remain in old focused stories/final matrix, not executed here. |
| F-04 / FR-07/14 | `wp11-filters--operator-families` | Text/value-less, numeric, set, nullable boolean, date rules; additional numeric custom editor/registry; async numeric entity separately. Full newly authored custom-operator picker and inverse/cardinality permutations still missing. Old `Filters/Tools → OperatorFamilies` complementary. |
| F-05 / FR-07 | `wp11-filters--invalid-draft` | Invalid numeric edit, unchanged accepted query and draft Cancel. New invalid date/range and DST play still missing; existing focused InvalidDraft remains unchanged. |
| F-06 / FR-07/13 | `wp11-filters--async-options` | Actual fail-once option request → Retry → same numeric zero ID. Search-empty, off-page selected label, continuation, late/ABA and string-vs-number interactions need fuller plays; raw fixtures contain string0 separately. |
| F-07 / FR-11 | `wp11-filters--builder-clear` | Real Clear with independent search/tab/date, keeps Any. Sort/size/order/visibility invariants need additional final assertions. Old focused BuilderClear asserts complementary cases. |
| F-08 / FR-15 | `wp11-configurations--selected-across-pages` | Eligible native selection, off-page IDs/count vs loaded subset, app review action and selection Cancel preserving accepted query. |
| F-09 / FR-15 | `wp11-configurations--selection-lifetime` | Page preserves; external tab clears. Size/sort preservation and all filter exits still need broader final interaction vectors. |
| F-10 / FR-04 | `wp11-configurations--sorting` | Native header menu, ascending + additive descending; unsortable/header priority/focus review owed. |
| F-11 / FR-06 | `wp11-configurations--required-columns` | Required Description cannot hide; hidden Reference can reveal. Hidden field identity persists; blank-table edge owed. |
| F-12 / FR-02/03 | `wp11-reordering--drag-blocked` | Honest user-blocked dragging: no registration/drag glyph/dead handle, no move configuration. Drag ready/preview/drop/cancel are BLOCKED, not satisfied by menus. |
| F-12 / FR-02/13 | `wp11-reordering--reorder-failure` | Real production manual row menu, exact synchronous app operation, timeout uncertainty/pending pager, optional UI hide/show, newer authoritative INPUT and matched model before ack. Accepted/rejected/conflict controls exist; all transport/race/receiver/cleanup positions remain unrun and need fuller plays. No backend persistence claim. |
| F-13 / FR-03 | `wp11-configurations--grouped-columns` | Genuine ordinary-C grouped leaf move menu, fixed utilities. Existing private RAC clone profile; complete hidden/group/utility boundary matrix and drag remain unproved/blocked respectively. |
| F-14 / FR-13 | `wp11-recovery--initial-loading` | Actual resource token; empty initial view → real response. |
| F-14 / FR-13 | `wp11-recovery--refreshing` | Same-query retained rows, updating notice, disabled new selection. |
| F-15 / FR-13 | `wp11-recovery--initial-error` | Real fail → Retry/new request → supplied response. |
| F-15 / FR-13 | `wp11-recovery--refresh-error` | Real retained failure + Retry/current request. Full query-change/late-result races deferred. |
| F-16 / FR-13 | `wp11-recovery--empty` | Authoritative empty input + dataset cause; no invented Create/Import action. |
| F-16 / FR-13 | `wp11-recovery--no-results` | Actual constraining search + empty response, real Clear search recovery. |
| F-16 / FR-13 | `wp11-recovery--unknown-empty` | Authoritative empty input, explicitly unknown cause; no guessed dataset/no-match explanation. |
| F-17 / FR-12 | `wp11-configurations--pagination` | Actual unknown total/explicit next, next page transport. Known totals also in client hosts; shrink/final-gated clamp/size controls need expanded final plays. |
| F-18 / FR-05/14 | `wp11-details--custom-details` | Bound transaction utility trigger, one real accessory/provider/shell, independent detail source, retained draft through refresh, dirty Keep editing, save/close. Focus/resize/dirty discard/async veto/off-page target matrix owed. |
| F-19 / FR-01/05 | `wp11-details--customer-details` | Different customer note/team layout and local report choice, application source update. |
| F-19 / FR-01/05 | `wp11-details--inventory-details` | Stock worksheet/numeric validation, computed availability, explicit missing-detail response. Error/retry controls are real but full detail failure/late-generation plays still owed. |
| F-20 / FR-14 | `wp11-configurations--dark` | Same native host, semantic classes/dark mode, no global restyling. |
| F-20 / FR-14 | `wp11-configurations--rtl` | Whole EN/AR DataTable bundle + I18nProvider, actual query.context locale change. Library message localization, mixed-value bidi and focus still require real review. |
| F-20 / FR-05/14 | `wp11-configurations--narrow` |390px container; selector also offers320/768/1024/1440 without owner remount. Actual overflow/zoom/text expansion/screen-size drawer proof deferred. |
| F-21 / FR-01/14 | `wp11-configurations--independent-tables` | Transaction + inventory, separate actual D/C/P/source owners; search affects only first. Same-domain duplicate/ABA cases not yet authored. |
| F-22 / FR-13/15 | `wp11-configurations--access-loss` | Terminal public P/app source retirement; no restored grant button. All row inputs/options/detail/pending buffers must purge. Play currently checks rows/selection; open-drawer/options/late callback coverage remains a named gap. |
| F-02/08 / FR-15 | `wp11-configurations--controlled-acceptance` | Actual controlled selection proposal rejection then exact C acceptance; no accepted selection mirror. |
| F-02 / FR-07–10 | `wp11-configurations--owner-conflict-diagnostic` | Real schema construction; only actual ContractError rule.field for the deliberately misowned amount predicate gets the owner-conflict explanation. Other errors are not classified as success. |

## Hosts, reuse and lifecycle limits

- `MinimalWorkbench`, transaction/grouped/controlled/manual hosts, server-recovery
  host and distinct customer/inventory hosts use genuine public producers. Structural
  variants are separate story renders, not hidden query keys or fake controller
  rewrites. Scenario args apply real accepted commands/source requests on the retained
  owner; visual args update appearance/accepted locale without rebuilding C.
- Raw records/schemas/definition factories have no HeroUI/CSS imports. Domain
  definitions accept typed utility columns once; styled triggers are supplied by
  Workbench. Shared modules are unmounted exports until a host renders them.
- App source owns input records/requests, independent detail records/form drafts,
  options and exact delivered operation. It does not cache/mirror native outputs.
  A real public app P purge participant and retirement port clear application state;
  detail participants clear before publication observers. Application source is
  above optional table UI; hiding it is not application unmount/cancellation.
- SSR remains neutral until genuine library commit; no SSR grant, request isolation,
  archive/ordinary runtime compatibility or browser execution is claimed by source
  authoring. Actual Strict effect ordering/reconnect/P purge and public subscription
  races are not proved by TypeScript and must be executed/fixed in the final phase.
- The approved local compact white/gray table image guided composition. No Figma
  edit, new visual acceptance, native hardware input or full G-02 claim follows.

Existing `Foundation/Workspace`, `Filters/Tools`, `Controls/Public composition` and
`Controls/Real filter composition` remain unchanged complementary evidence lanes.
Stage B, mounted Start/Next, packed consumers, WP-12/13/14/15 are not skipped or
completed by this catalog. All required missing/manual/external gates stay open.
