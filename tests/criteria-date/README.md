# Committed Date adoption — implementation-ready PROVISIONAL

F4b private source/fixture handoff for TASK-017 / FR-10/13/16, AC-16/25.
Authorization: main's isolated Date plan and the explicit user lease, on the
main-supplied `882fa9f` baseline. No Git operation reverified or changed that label.
**Only implementation, test authoring and light static checks were performed.**
No authored runtime test has passed or even been executed in this lane.

## Scope and preservation

Seven changed existing sources:

- `packages/heroui/src/toolbar/{filter-date.tsx,criteria-tool-host.tsx}`
- `packages/heroui/src/date/{date-types.ts,date-operand-editor.tsx,date-picker.tsx,date-instant.tsx,date-segments.tsx}`

One new source: `packages/heroui/src/date/criteria-date-state.tsx`. All other writes
are in this new fixture directory. Main owns intake, TASKS/docs bookkeeping,
exports, commits and subsequent integration. No frozen producer API changed.

`before.json` was captured after main's child TASKS update, before source edits:
**880 existing inputs / 119 existing react+heroui sources**. Removing precisely
the seven allocated existing deltas leaves **873 protected inputs / 112 protected
sources**, including Search/Tabs/shared/F1/F2/F3/builder, old tests/evidence,
exports/styles/messages/config/manifests/lock/docs/TASKS. The checker also preserves
the seven allocated source modes. The new source brings that source inventory to
120; old Search/Tabs 855-input and F3 historical maps were not regenerated.

`source-preimages.json` contains exact original text for all seven changed files;
its capture is never repeated. `legacy-boundary.mjs` compares the eight original
function bodies (including raw outer and nested editors) by normalized AST print.
It also removes only the Date type/import/preparation/neutral-class additions and
compares the original host's printed AST tokens. Search/Tabs logic stays unchanged.
Existing Date JSX/classes/compound vendor props and styles are reused. There is
no new visual system or styling intake.

`handoff-hashes.json` records every before/after source SHA-256 and hashes all
allocated source plus own fixture/evidence files except this README, the seal
itself and `.artifacts`. `measure.mjs` checks the seal by default; `record` is the
authoring operation, not a command to rebase old evidence during verification.

Exact source hashes (paths relative to `packages/heroui/src/`):

| Source | Before SHA-256 | After SHA-256 |
| --- | --- | --- |
| `toolbar/filter-date.tsx` | `1973fd07c850c702cc0669e8c387068e92cf8c314174bc17cd6b51532501e3fb` | `063b7c2041dd61c3c9dea9ba0d9e5e8a693098d57b965af26b0e8c7346f0caf4` |
| `toolbar/criteria-tool-host.tsx` | `672a1db85bf76244afc16cc1259a1b87e0c1cafb8e4e537086f878c3651ff768` | `af5cf078585c7707692c7f8d9cfd3ad1e2bf5dc07b8a400c403a861f11bfa4ab` |
| `date/date-types.ts` | `da3a2c5970e3b8d7909ac04d6c0b49a120e70abf90eb07d4acf6f256192632b0` | `aef2b9d874af0e060959d57f46f52c993e5c2050bbfaf93412769c9bc7d87d37` |
| `date/date-operand-editor.tsx` | `5f812ff20e6e93db64e875f440476a5615c1b075de8cd0100ae4ed4ca52b6e26` | `eec1c3588a34cc53c786bd5902375e3d917649dcf46ee54f92e78974d121d0a4` |
| `date/date-picker.tsx` | `b99873914bdf0cc7227ea1776f2cf150e5b5b4b7069677ecb714459a20a606c8` | `ba9c542515fec311f4833c8a2ac585e1e4360a0dc744bc9c1bb1a87eab79630d` |
| `date/date-instant.tsx` | `dcf1e0c250a38f1703f52de03b10c257961a89c248b5ccc10ec75155c407bf88` | `33edcef8bcd7e5a5e369bb817f1e062d44096f4a5fd67431405b155e962cc957` |
| `date/date-segments.tsx` | `e011b7b1defb88465cdc48b5c9e39e2209c115aff01f60bb40d1eb65090b372b` | `6ff882a3dc1a7ad057f22b331c5af1814ded782fbd03be77ad2d2b4965b146ca` |
| `date/criteria-date-state.tsx` | new | `c504fa002f2f0d61fb1932f9511a3e66fa82b8a7073f1ad937048566fcab814c` |

## Actual internal API and trust boundary

The existing optional `FilterDateProps.criteria` now selects the actual shared
host/F3 `date` kind. Truly omitted metadata selects raw legacy; supplied undefined,
null, accessor, inherited, malformed, copied authority/owner or contained proof
proxies deny before private props. A structural target envelope may carry the
exact genuine contained owner/tool. Actual successful layout commit pins mode
and owner (hence its actual P/C/CD); dropping criteria cannot downgrade adoption.

The host remains unsubscribed and separates mount/disconnect from configuration
layout with no per-config cleanup. Its only Date-specific commit step prepares
the finite date bundle **before publishing B**, so nested committed B handles
already exist when the same Surface/editor DOM renders again. Search/Tabs do not
execute that branch. Constructor, initial SSR/prelayout and suspended candidate
configuration cannot call private Date callbacks.

`criteria-date-state.tsx` is private source, not a root export. Its fixed library
producer `createCriteriaDateBundle<K,S>(actualCell, builtins?)` is called by the
Date host with its actual factory-created F3 cell. Later Builder integration may
call it with its actual builder F3 cell; this lease does not adopt Builder.
It is not an application factory accepting a permission implementation.

- `CriteriaDateBundle<K,S>` is an opaque registered key. Exact cell identity maps
  to one finite allocation. Repeated bundle keys do not allocate new local cells.
- `beginCriteriaDateEdit(bundle, actualActor, binding?)` initializes only from the
  actual C snapshot. Date binding is `{kind:"date"}`; Builder binding is
  `{kind:"builder",fieldId,operator,ruleId}` and checks actual builder ownership,
  descriptor/cardinality and accepted rule/field/operator baseline. New-rule
  `ruleId:null` is an empty editor, not a fabricated accepted rule. Beginning a
  different role/rule retires the previous token and clears the same finite slots.
  Future Builder consumers read the validated `readCriteriaDateToolbar().draft`;
  a mode snapshot is not a mutation receipt. This bridge never dispatches Builder
  commands or invokes a caller's `onDraftChange` as an authority port.
- `reconcileCriteriaDateBundle`, `closeCriteriaDateEdit`,
  `readCriteriaDateToolbar`, `setCriteriaDateNotice` and
  `selectCriteriaDatePreset` require that bundle's actual F3 actor.
- `CriteriaDateStateHandle` is proved by the private `handles` WeakMap. It has no
  readable proof properties and no structural boolean, caller reset or permission
  callback. `readCriteriaDateState`, `requireCriteriaDateState`,
  `criteriaDateChild` and `criteriaDateState` actions use the exact registered
  bridge/actor/edit token/part/channel and the actual cell's `require`/slots.
  Unknown, copied, structural or proxied handles never traverse child private props.
- The sole optional **internal** editor prop is `criteriaState`. True omission
  preserves the raw branch, including all existing Builder Date consumers.
  Supplied invalid/undefined/accessor/inherited handles deny, never fall back.
  Nested supplied props are ignored in favor of registered committed slot/port
  state; initial supplied-handle rendering is neutral until layout.
- Erasure exists only behind the opaque registry: captured generic functions keep
  the real `CriteriaCommitCell<K,S>` and call its actual `require` on the erased
  actor before accessing any local slot. No contained handle fields are cast and
  treated as authority. The slot registry is not a new frame/publication protocol.
- `requireCriteriaDateSession` is a root-completion **identity-only** extra fence:
  actual actor plus exact current token, not a read/action permission. Successful
  own accepted dispatch may change the baseline before closing the old edit.
  Root completion separately checks actual ports/owner/result; nested actions
  always use the full baseline guard. A reentrant new edit is never closed or
  assigned the old notice, but a still-current A application's actual proposal
  receipt is not swallowed merely because its local edit changed.

## Slots, continuity and lifecycle

There are **52** finite date-bundle F3 local cells: 13 root cells and 13 each for
point/start/end. With the existing host presentation cell and Date focus cell,
the Date host has **54** tracked local cells. This is a source allocation count,
not a measured runtime result. There is no per-config/session growing private Map.

Root config, baseline/seed, candidate, draft, notices, open, mode, range, signatures
and handles are actual F3 slots. Each role separately owns day/time, exact text,
draft, dirty/blocked/error, day/clock partial state, convenience-control revision
and segment signatures. Dropping a root map is not the purge strategy: every
authoritative nested value is a separately tracked F3 node physically set to null
by the real P purge, even while a child handle is retained. Retained handle entries
contain only bridge/actor/token/role/channel/family/revision metadata and functions
closing over real cells/slot references, not plaintext private value backups.
React state holds only route/subscription metadata; refs hold DOM nodes.

Eligibility uses the canonical actual accepted Date (or actual Builder rule), field,
cardinality/operator and locale/time-zone session, never query identity or revision
alone. Same-domain config/functions/frame/sort/page refresh preserves eligible
local values and the same editor/input/form subtree. Old A handlers/observers/work
carry A and cannot invoke B through a latest-props ref. Actual accepted baseline or
locale/zone changes end the relevant edit, not the whole publication domain.

Day/instant/relative/rolling and separate range endpoints retain their raw rules.
Exact ISO input preserves milliseconds until an explicit convenience-field edit;
only that explicit ISO edit resets convenience controls. Mode/session changes
retire tokens. Incomplete/invalid segments block Apply. Current C `evaluatedAt`
and context own evaluation time; no hidden `Date.now()` date-clock substitution.
Whole-query `parseQuery` and `compileFilter` use committed registry wrappers;
summary, relative and time-zone formatters use committed message ports with
before/after and final action gates. Apply proposes/commits only `date.commit`,
Clear only `date.commit` with null, and local Cancel only closes this edit.
No Builder Clear, selection Cancel, source connection/acquisition or transport is
performed by these library surfaces. Focus is actual F3-owned rAF work fenced by
actor, accepted baseline, owner/session and DOM reentry checks, not raw timers.

Real P purge is deny-first and clears F3 canonical cells/work synchronously.
Ordinary view cleanup releases only local state; it does not dispose C/P/R, advance
application epochs, clear accepted dates, or perform application retirement.
**No universal DOM/heap erasure claim:** RAC/HeroUI may already have observed DOM,
internal popover values or segment context until React commits a removal. What is
implemented here is physical canonical-library-slot clearing plus immediate denial
of captured old library handlers/read ports. Runtime/privacy/continuity proof waits.

## Authored proof (not executed)

- `fixtures.ts`: genuine ApplicationOwner C/P retirement acknowledgement,
  `P.issue`, `createCriteriaFrames`/tool issuance, source barrels and actual F3.
- `host.test.ts`: inert/provenance/raw discriminant, genuine structural envelopes,
  invalid private-getter ordering, committed mode/owner, epoch ABA, actual P2 with
  equal C/CD/context/epoch and ordinary disconnect without app disposal.
- `state.test.ts`: finite allocation; non-mutating Set-add node observation of real
  tracked cells, then another actual P participant checking every node is null
  inside purge; retained nested handles; range partial/precision; A/B and mode ABA;
  accepted-baseline vs sort/page/locale/zone; actual builder-cell reuse boundary.
  The probe is synthetic observation only, never a fake permitting P/F3 producer.
- `date.test.ts`: controlled Apply/Clear/Cancel/accept/reject, symbolic/rolling,
  actual formatter and registry-get reentry, actual captured custom callback gates,
  onRequest failure and same-actor edit replacement with receipt preservation.
- `ssr.test.tsx`: raw legacy vs supplied prelayout neutral branches and every
  nested wrapper's supplied-handle/private-getter denial.
- `browser.tsx` / `browser.spec.ts`: real Strict/Suspense harness, same-node exact
  input/form/focus/caret through config/sort, partial segments, separate range
  endpoints, raw legacy controls, controlled proposal and actual baseline reset,
  candidate B abandonment, reset/drop/disconnect. Uses natural clicks, keyboard,
  focus and caret inspection; no forced or programmatic clicks.
- `types.ts`: positive actual-source Date and Builder opaque producer/prop shapes.

## Actual light checks

Installed profiles remain unchanged: TS **6.0.3**, HeroUI **3.2.8**, React **19.3.1**,
RAC **1.22.1**, internationalized date **3.12.4**. The own tsconfig resolves actual
Tableweave source barrels and declared installed vendor types, not historical dist.
Own runtime aliases are authored for declaring-package vendor resolution; they are
not evidence of successful browser/import execution.

Final light command results and hashes are recorded with this handoff. Commands:

Actual final results: positive TS6 noEmit **passed**; static boundary parsed **18**
own/source TS/TSX files with **0** emitted files; **9** own scripts/configs passed
syntax-only `node --check`; all **8** raw function bodies and original non-Date
host AST matched; **873** protected inputs/**112** protected sources and seven
allocated modes matched; no-write Biome checked **31** files without fixes or
diagnostics; the seal check matched **8 allocated sources + 23 own fixture/evidence
files = 31**, excluding README/self/artifacts. These are static results only.

```sh
node node_modules/typescript/bin/tsc -p tests/criteria-date/tsconfig.json --pretty false
node tests/criteria-date/check-boundary.mjs
node tests/criteria-date/syntax.mjs
node tests/criteria-date/legacy-boundary.mjs
node tests/criteria-date/scope.mjs
node tests/criteria-date/measure.mjs
```

The exact scoped no-write Biome command was:

```sh
node node_modules/@biomejs/biome/bin/biome check --vcs-enabled=false --max-diagnostics=15 \
  packages/heroui/src/toolbar/filter-date.tsx packages/heroui/src/toolbar/criteria-tool-host.tsx \
  packages/heroui/src/date/date-types.ts packages/heroui/src/date/date-operand-editor.tsx \
  packages/heroui/src/date/date-picker.tsx packages/heroui/src/date/date-instant.tsx \
  packages/heroui/src/date/date-segments.tsx packages/heroui/src/date/criteria-date-state.tsx tests/criteria-date
```

`node --check` checks own `.mjs` syntax without loading config/application modules.
No emitted files, shared build, installed profile changes, negative-removal checks,
runtime units, actual React/SSR render, browser/server, network, agents or Git work.

## Deferred final-phase commands — DO NOT run in the provisional lane

```sh
node tests/criteria-date/run.mjs final-001
node node_modules/@playwright/test/cli.js test --config tests/criteria-date/playwright.config.ts
```

The unit runner creates a fresh own artifact directory and runs source-based
Vitest units plus SSR tests. The authored browser server/config uses **6549 only**,
strict port and no existing-server reuse; it has not been launched. Final main
verification also owns genuine consumer/packed/emitted/dual-compiler/negative,
broader race matrices, SSR/hydration and independent acceptance. Source static
checks do not prove those boundaries or Date/privacy/continuity/WP-09 readiness.
Next: main reviews/intakes this bounded provisional producer, then allocates later
Builder/facade/companion work separately; no changing main-P3 API was consumed.
