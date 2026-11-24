# Date / Builder draft prerequisite — implementation-ready PROVISIONAL

Narrow TASK-017 / FR-04/05/10/13, AC-16/25 handoff. This implements only main's
`wp-09-date-builder-draft-plan.md` prerequisite in the main-supplied `283bbad`
Builder worktree. **Builder adoption remains paused.** There is no runtime,
privacy/purge/continuity/SSR or full-WP-09 approval from this lane.

## Exact scope

One changed source: `packages/heroui/src/date/criteria-date-state.tsx`. Every other
write is in new `tests/criteria-date-builder-draft/**`. The four Builder sources,
proposed Builder host, other Date files, F3 core/ports, F2/options, old fixtures,
exports/styles/config/lock/docs and Git remain unchanged. TASKS was read; its main
bookkeeping is deliberately excluded from the new protected-input map.

The exact original source127 map is still
`/tmp/opencode/wp09-before-builder-source127.json`, SHA-256
`8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2`.
The new scope checker derives **126 protected sources, including CSS**, by removing
only this one Date source from that original map, not by capturing a new expected
source baseline after changes. It separately preserves all four original Builder
hashes/modes and verifies that `filters/criteria-builder-host.tsx` is absent.
`before.json` captures **1010** other protected inputs at this stage after main's
TASKS update. `source-preimage.txt` is the exact original Date helper, whose SHA is
`c504fa002f2f0d61fb1932f9511a3e66fa82b8a7073f1ad937048566fcab814c`.
Neither capture is repeated. All old Date/F3/source127 and blocked Builder records
remain historical and byte-preserved; their old source seals are not resigned.
In particular, the old Builder check expects the pre-prerequisite source127, so
it is not the current 126-source delta gate and is not rerun as such.

## Actual backward-compatible internal API

Existing function signatures remain:

```ts
beginCriteriaDateEdit<K extends "date" | "builder", S extends QuerySchema>(
  bundle: CriteriaDateBundle<K, S>,
  actor: CriteriaActor<NoInfer<K>, NoInfer<S>>,
  binding?: CriteriaDateBinding,
): CriteriaDateStateHandle;
```

`CriteriaDateBinding` now permits one optional, readonly **Builder-only** envelope:

```ts
interface CriteriaBuilderDateDraft {
  readonly id: string;
  readonly baseline: string | null;
  readonly value: DateValue | DateRange | null;
}
// Builder member of CriteriaDateBinding:
{
  readonly kind: "builder";
  readonly fieldId: string;        // intended draft editor target
  readonly operator: string;       // intended draft editor target
  readonly ruleId: string | null;  // genuine accepted provenance
  readonly draft?: CriteriaBuilderDateDraft;
}
```

- **True omission** of `draft` preserves the original contract: a non-null real
  `ruleId` must still exist with the same accepted field/operator and seeds from
  that accepted rule. Legacy null provenance still opens its original empty editor.
  Supplied undefined, inherited or accessor `draft` is denial, not omission.
  Captured omission is subsequently read as an own-property decision, not through
  a potentially changed ambient prototype.
- **Explicit existing-rule draft:** `draft.id === ruleId`, real rule exists, and
  `draft.baseline` must equal **exactly `JSON.stringify(actualAcceptedRule)`** from
  the parent's original Builder intent. No canonical-string guessing, parsing,
  recapture of a changed accepted rule, replacement snapshot or early dispatch.
  The target Date field/operator may differ from that accepted rule's field/operator.
- **Explicit new-rule draft:** `ruleId === null`, `draft.baseline === null`, and
  the actual C snapshot must have **no rule with `draft.id`**. Requiring the new
  allocated ID makes absence checkable; null cannot hide an existing rule.
- `fieldId` must identify an actual builder-owned date/datetime field. The explicit
  target uses the actual `getFieldOperators` descriptor allowlist and must have
  `one` or `range` cardinality. The legacy omission path retains its original
  descriptor/matching contract. Field/operator strings are runtime schema-checked,
  not backend permission or schema-specific compile-time proof.
- `draft.value === null` is an empty editor. Otherwise it must be a complete,
  eligible Date wire of the target cardinality. Own copied primitives, exact ISO
  offset/millisecond strings, symbolic values and range endpoints are retained.
  Partial parent inputs must be intentionally represented by null, not malformed
  Date data, undefined, callbacks or fabricated accepted rules.

Example of the formerly blocked path, without modifying accepted state:

```ts
const originalBaseline = JSON.stringify(actualAcceptedR1); // parent intent time
const handle = beginCriteriaDateEdit(actualBundle, actualBuilderActor, {
  kind: "builder", fieldId: "created", operator: "date.between", ruleId: "r1",
  draft: { id: "r1", baseline: originalBaseline, value: null },
});
// Parent observes actual validated operand slots, never an onDraftChange receipt:
const operand = readCriteriaDateToolbar(actualBundle, actualBuilderActor).draft;
```

The parent Builder still checks its original accepted baseline before begin and
before final dispatch, performs full rule validation/normalization with actual
committed ports, and decides Apply/Cancel. This prerequisite dispatches nothing
and does not adopt Builder or reclassify a Date mode snapshot as successful Apply.

## Capture, guards and finite ownership

The bundle first requires its genuine actual F3 actor and C/CD origin. Baseline
strings and seeds are only **intent assertions**, never authority. An internal,
operation-local descriptor/alias cache captures the binding and explicit envelope
once. It checks real actor/C freshness before/after reflection, caches own-property
descriptors/prototypes/key inventories, rejects accessors/inherited consumed fields
and non-plain records, and never invokes caller getters/toJSON/coercions. Strict
wire keys reject extra callback properties. Transparent proxies can only contribute
their captured plain data while every reflection is still fenced; they do not
become genuine handles/owners or a new permission mechanism.

Accepted provenance is checked before seed-descriptor traversal. If reflection
changes the relevant accepted rule, locale/zone, actor or local slot version, the
outer begin denies before further private work. The short-lived existing F3 version
checkpoint also prevents overwriting a same-actor edit replaced during reflection;
it is not a new domain counter or permanent query/revision freshness policy.
Aliases reuse descriptor snapshots. After capture, configuration/binding/envelope/
seed copies are owned and frozen; application objects are not frozen or retained
as live config. `cfg` never reflects or rereads caller objects.

The full guard always rechecks the **original** explicit accepted baseline (or new
ID absence), actual target eligibility, actor, and locale/zone. Unrelated rules,
sorting, paging and same-domain props/frame refresh are not baseline changes.
Accepted changes/removal/context changes deny old handles; actual reconciliation
or F3 lifecycle retirement closes the local token. Old A actors, copied/proxied
handles and mismatched bundles cannot borrow B. No added subscription, clock,
transport, callback factory, external permission port, private clear hook or app
retirement mechanism exists.

Seed validation is the actual `resolveDateOperand` Date-wire/cardinality/bounds
validation at current C time. Target eligibility uses captured descriptor metadata;
begin does **not** invoke registry `get`, custom validate/normalize/evaluate,
formatters or app editors. No new callback wrapper authority is invented. Final
custom-operator normalization/validation/evaluation remains the parent's existing
rule/controller pipeline, not a claim made by the operand result.

There are still **26 source allocation sites / 52 instantiated F3 local cells**:
13 root plus 13 each for point/start/end. No new slot or private history Map is
allocated per configuration. Original accepted provenance and distinct target/seed
live together in the existing frozen `root.config` slot. Actual P purge physically
clears all tracked nodes, not merely a root pointer while nested handles keep
plaintext copies. Reflection caches are transient operation locals, not handles.
The exposed explicit initial `readCriteriaDateToolbar().draft` is Date-validated
immediately; original omission seeding behavior and other public helper bodies
remain compatible. Local close never changes accepted C data.

## Authored fixtures — NOT executed

- `fixtures.ts`: actual normalized schema, native C, ApplicationOwner P retirement
  acknowledgement, P.issue/F1 frame/tool, actual builder F3 cell and Date bundle.
- `intent.test.ts`: existing scalar→range/null seed, number field→Date with same ID,
  copied range seed/precision, new-ID absence, old binding positive/mismatch denial,
  stale/missing/wrong ID, schema owner/type/operator denial before seed traversal,
  sorting/page/B refresh, accepted value/removal/context changes, unrelated rules,
  reconciled ABA and another real P participant observing 52 physical node nulls.
- `capture.test.ts`: descriptor-once/aliased endpoints/no later caller reads,
  malformed/accessor/inherited/undefined/callback seed rejection, prior-session
  preservation on invalid seed, actual accepted-state/actor/local-edit reflection
  reentry, no eager registry callback, symbolic/rolling seeds and genuine wrong-
  bundle actors/counterfeit handle denial. No fake allowing producer is used.
- `types.ts`: positive readonly envelope, old/new entry and actual generic actor/
  bundle programs. `negative/` authors readonly/field/seed/id/undefined cases but
  is excluded from this lane's positive compilation and remains unexecuted.

No new UI/browser work is necessary for this producer-only prerequisite. Port
6553 is unused, no config/server was started, and no old assertion or CSS changed.

## Light verification and source/fixture hashes

The initial own positive TS6 check reported one unused `required` fixture import;
that import was removed. The existing Date positive source-fixture TS6 check
passed at that point. Final results below are actual light checks only; no runtime
result is inferred from type or static checks.

| Final light check | Actual result |
| --- | --- |
| Own positive TS6 noEmit | Passed |
| Existing Date positive source-fixture TS6 noEmit | Passed |
| Syntax/static scope | 5 positive/source TS files parsed; 5 scripts/configs passed syntax-only checks |
| Unchanged exported private helper bodies | 18 matched original AST prints |
| Finite allocation | Original 26 source call sites, 52 instantiated cells unchanged (static count, not runtime measurement) |
| Protected-input/source check | 1010 protected inputs and original-map-derived 126 protected sources unchanged; four Builder hashes/modes intact; Builder host absent |
| Scoped no-write Biome | 15 files checked, no fixes or diagnostics |
| Source/fixture seal | 1 changed source + 14 own fixture/evidence files = 15 hashes matched |
| App modules / emitted files | 0 / 0 |

Exact Date source SHA-256:

- Before: `c504fa002f2f0d61fb1932f9511a3e66fa82b8a7073f1ad937048566fcab814c`
- After: `28ebb1a8181337a5aa9bfd867bebee621efaf75d67442f354d4aa982fea73aef`
- Aggregate source/fixture SHA-256: `c022dceb49b363c0658d7247a9d37e69d1ac0fe90846c2765795dd871c45fa83`

```sh
node node_modules/typescript/bin/tsc -p tests/criteria-date-builder-draft/tsconfig.json --pretty false
node node_modules/typescript/bin/tsc -p tests/criteria-date/tsconfig.json --pretty false
node tests/criteria-date-builder-draft/static.mjs
node tests/criteria-date-builder-draft/scope.mjs
node tests/criteria-date-builder-draft/measure.mjs
node node_modules/@biomejs/biome/bin/biome check --vcs-enabled=false packages/heroui/src/date/criteria-date-state.tsx tests/criteria-date-builder-draft
```

`handoff-hashes.json` records the exact original/new Date SHA and all own fixture/
evidence hashes. Aggregate SHA means SHA-256 of the compact JSON encoding of the
sorted path→SHA map. README, the seal itself and `.artifacts` are excluded to avoid
self-reference. `measure.mjs record` is an authoring operation; default is a check.
Old seals are never rewritten. Source aliases and TS6 config use actual source
barrels/declaring-package vendor profiles, not historical Tableweave dist.

## Known limits and deferred final phase

Matching content alone cannot detect an unobserved accepted-ID ABA or create an
application incarnation. Parent live-baseline/session checks and actual C/P/F3
retirement/reconciliation remain required; this source adds no domain counter or
source lifecycle shortcut. App/custom/vendor already-observed DOM/state is not
universally contained or erased. The physical-node fixture is authored, not proof
that purge, React continuity or privacy has passed in a runtime.

After main authorizes the single final verification phase:

```sh
node tests/criteria-date-builder-draft/run.mjs final-001
node tests/criteria-date/run.mjs final-date-compat-001
node node_modules/typescript/bin/tsc -p tests/criteria-date-builder-draft/negative/tsconfig.json --pretty false
```

The negative-removal matrix, dual compilers, emitted/packed/genuine consumers,
actual React/SSR/browser, wider races and independent review remain main's final
phase. No units, app runtime modules, SSR/React render, browsers/servers, installs,
shared builds/emits, network, credentials, agents, Git, commits or exports occurred
here. Main must inspect/intake this actual API, preserve it, provide the new source
map and **explicitly reactivate** the original Builder lease. This handoff grants
no autonomous Builder work or engineering self-approval.
