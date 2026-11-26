# F4c Builder adoption — BLOCKED before source implementation

Authorization: the activated four-existing/one-new-source provisional lease in
`/tmp/opencode/tableweave-wp09-stacked/docs/planning/wp-09-builder-adoption-plan.md`,
especially activation lines 21–26 and the stop boundary at lines 79/88. Main
supplied this worktree at `283bbad` (S1/D1 plus preserved Date); no Git operation
reverified or changed that label. TASKS was read and remains main-owned/read-only.

**No Builder implementation or partial optional-prop adoption was started.** The
four allocated existing sources, the proposed new Builder host and every frozen
producer remain untouched. Only this blocker record and a read-only baseline
checker were added in the authorized new fixture directory.

## Concrete frozen Date API conflict

The actual Date producer can edit an accepted Builder rule in its existing
field/operator, or start an empty new-rule editor. It cannot express an existing
rule's replacement draft whose field/operator differs from its accepted baseline.
This is a source/API limitation, not a runtime-test result or an S1/F3-core failure.

### Builder behavior that must remain

In `packages/heroui/src/filters/filter-builder.tsx`:

1. `open`, lines 264–280, keeps the accepted rule ID and stores
   `baseline: JSON.stringify(rule)` while copying its current field/operator/value.
2. `chooseField`, lines 347–360, changes the **draft** field/operator, preserving
   that accepted ID/baseline. A compatible value is retained; an incompatible
   value is cleared locally, not committed.
3. `chooseOperator`, lines 362–383, changes the **draft** operator with the same
   ID/baseline, retaining compatible values and otherwise clearing the operand.
   Value-bearing changes require confirmation, not an early accepted mutation.
4. `validation`, lines 294–309, passes `replaceRuleId: candidate.id` for an existing
   rule. `matchesDraft`, lines 128–153, continues comparing the original accepted
   rule's JSON baseline, independently of the draft field/operator.
5. `ValueEditor`, lines 504–515 of `filters/value-editors.tsx`, opens the shared
   Date editor using the draft field, descriptor cardinality and current value.
   Its raw `DateEditor`, lines 140–175, takes a one-time shape-checked draft seed.

### Actual Date API and rejecting path

In `packages/heroui/src/date/criteria-date-state.tsx`:

- `CriteriaDateBinding`, lines 75–82, exposes only
  `{kind:"builder", fieldId, operator, ruleId}` for Builder. There are no distinct
  accepted-origin and draft-editor field/operator/seed inputs.
- `beginCriteriaDateEdit`, lines 1078–1083, forwards that exact binding to the
  registered bundle. `begin`, lines 679–707, immediately calls `bindingValue`
  before allocating the current edit token/handle and initializing its slots.
- `bindingValue`, lines 355–381, derives cardinality from `binding.operator`,
  finds the actual accepted rule by non-null `ruleId`, and **denies at 372–376**
  unless that accepted rule's field/operator equal the binding field/operator.
  The seed is then taken only from that accepted rule's value.
- `cfg`, lines 445–450, reruns `bindingValue` on every full handle guard. This
  cannot be bypassed by issuing a handle first and changing the binding later.
- Keeping the accepted binding instead does not represent the new editor:
  `report`, lines 503–521, checks against its old cardinality/field. Supplying a
  new `cardinality`/`field`/`value` prop cannot fix this: the adopted
  `DateOperandEditor` branch at `date-operand-editor.tsx:41–45` forwards only the
  genuine handle and reads the registered snapshot, not those private props.

### Minimal blocked scenario (illustrative synthetic values; not executed)

```text
Accepted: r1 / builder-owned datetime field created / date.on / complete instant
User:     select date.between on r1; enter a replacement range before Apply
Baseline: the unchanged accepted r1, still date.on until successful application

beginCriteriaDateEdit(actualBundle, actualBuilderActor, {
  kind: "builder", fieldId: "created", operator: "date.between", ruleId: "r1"
})
→ bindingValue finds actual r1.operator === "date.on"
→ deny at criteria-date-state.tsx:372–376, before an edit handle is issued
```

An existing rule changed from a different field to a Date field hits the same
check. Retaining the old `date.on` binding would render a scalar editor and reject
a range draft. `ruleId:null` would pretend this is a new rule and discard the
actual existing-rule provenance; the explicit user lease prohibits that workaround.
Dispatching early to make the accepted rule match would violate confirmed Date
editing and local Cancel. Fake accepted rules, controller snapshots/authorities,
duplicate Date slot engines and changes to the frozen bridge are not alternatives.

## Exact next dependency / authorization boundary

Main must allocate a narrow Date-producer prerequisite which can represent,
separately, the genuine accepted Builder rule baseline and the intended draft
field/operator/cardinality/eligible seed, while retaining actual C/F3 provenance,
finite nested owned slots, old-handle denial and independent Cancel semantics.
The exact API remains for that authorized producer to define; no proposed shape
here is treated as an accepted signature. After main intakes that actual API,
reactivate this bounded Builder lease against the corresponding source map.

The user required stopping on this precise conflict. Builder host, option claims,
numeric/choice state, Date wiring, optional prop and runtime fixtures were not
partially implemented. F2 ownership/debt integration has not been assessed or
approved in this stopped lane. No additional source-path authorization is inferred.

## Baseline and actual light evidence

Main's canonical map is
`/tmp/opencode/wp09-before-builder-source127.json`, SHA-256
`8281387f44e3ef1e0392159d329e05c7a5e0d319311f42b673beaa923ceee1e2`.
All **127** mapped source files (including CSS) match their original hashes and
Git-style modes: **123** protected sources plus **all four allocated existing
sources also unchanged**, with no source additions/removals. Thus before and after
source hashes are identical to that exact map; Date/F3 historical maps were not
rebased. The new `criteria-builder-host.tsx` does not exist.

The initial ad-hoc mode check wrongly compared the map's Git mode `100644` to all
filesystem permission bits (`0664`) and failed. It wrote nothing. Correcting the
checker to compare Git-style executable/non-executable modes passed all 127
hashes/modes and matched the exact map-byte SHA above. Group-write filesystem
permission is not a source or Git-mode delta; no chmod or Git operation was used.

Read-only final checker and syntax-only check:

```sh
node tests/criteria-builder/check-baseline.mjs
node --check tests/criteria-builder/check-baseline.mjs
node node_modules/@biomejs/biome/bin/biome check --vcs-enabled=false tests/criteria-builder/check-baseline.mjs
```

Actual results: the final baseline checker **passed** all 127 hashes, Git-style
modes and the full source inventory (123 protected + four allocated unchanged;
zero added/removed sources). Syntax-only `node --check` **passed**. Final no-write
Biome checked the **one** new script with **no fixes or diagnostics**. No application
module was loaded and no emitted file was written. The single executable fixture
file `check-baseline.mjs` has SHA-256
`72cce529f15cbaef7a4693cca4ba5a0e969035c9afe336407ad3efe58436147b`;
README handoff prose is excluded from that self-referential evidence hash.

No positive TS6 run was needed or claimed here: source implementation stopped
before edits, and the added checker is JavaScript. Main's earlier integrated Date
positive TS6 result remains main's reported baseline evidence, not a fresh result
from this lane. No units, React/browser/SSR, negative programs, dual compilation,
emissions, packed/genuine consumers, server, network, install, agents, shared build,
Git/commit, export changes or independent verification were performed.

## Deferred proof

The full Builder acceptance fixtures and commands must be authored against the
resolved actual Date API when this lease is reactivated; no invented runnable
Builder unit/browser command is claimed to exist now. Port **6552** remains
reserved for the future authored-only browser config, not a launched server.
All runtime/purge/form/continuity/SSR/consumer/negative/independent engineering
approval stays deferred to the user's single final phase. This is a blocker
handoff, **not implementation-ready PROVISIONAL or Builder/WP-09 approval**.
