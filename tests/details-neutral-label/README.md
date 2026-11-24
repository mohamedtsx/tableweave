# RecordDetails neutral label — implementation-ready PROVISIONAL

TASK-017 / FR-16 prerequisite, review16n2, isolated D2 treece3ea3b. This is only a
nonsensitive aria-label port, not details/body/focus/permission behavior or full
FR-16/WP-09/manual-language/AT/SSR/packed/independent approval. Shared S3/core work
is elsewhere and was not resumed, modified or consumed as a new API. Main owns
preservation/intake/Git/exports after that source handoff.

## Source-private API and sensitivity contract

Only `packages/heroui/src/data-table/details-provider.tsx` changes:

```ts
export const englishDetailsRegionLabel = "Record details region";
export const arabicDetailsRegionLabel = "منطقة تفاصيل السجل";
export interface RecordDetailsProps<S extends QuerySchema, T extends object> {
  readonly accessory: DetailsAccessory<S, T>;
  readonly neutralLabel?: string;
}
```

True omission uses the **unchanged original English wording**, including under an
RTL DetailsProvider. Arabic/custom labels are explicit caller inputs; direction is
layout, not a locale heuristic. No private DetailsAccessoryOptions/messages/source
callback is read to derive a label. Existing locale bundles/types/barrels/default
UI text, raw DetailsShell/trigger/options and all styles remain untouched. These
constants/props are source-module exports only; no package-root export was added.

`neutralLabel` is neutral presentation metadata, available before layout and while
detail readiness is denied. **Never use row, record, dataset, scope, authorization
or private detail values in it.** Primitive validation cannot determine semantic
sensitivity. Consumers/later DataTable must pass a real neutral constant or explicit
committed locale metadata; the label grants no source/body permission or readiness.
The Arabic string is an authored translation, not native-language/manual AT approval.

S/T inference stays anchored solely to the actual invariant accessory. A string
label provides no schema/record inference input, so no consumer cast/extra NoInfer
wrapper or widened record type is necessary. Props are readonly/exact-optional.

## Exact admission/capture/error order

RecordDetails now accepts `props`, never destructuring incoming label at entry:

1. Capture the `accessory` **own data** descriptor once without invoking accessors.
2. Authenticate it through the existing actual `getDetailsBinding` WeakMap lookup.
   Unknown/copied/proxied accessory objects deny before neutralLabel traversal.
3. Capture neutralLabel's own descriptor **once**. Only genuine absence with no
   inherited field gets English. Inherited/accessor/present-undefined/null/nonstring/
   boxed/coercible/blank values deny. Nonblank primitive text is preserved as given;
   trim is only a primitive blank check, not presentation normalization.
4. Continue the original bound-session hook/context/ref/state/effect/body path.

Metadata reflection/validation failures throw only
`TypeError("Invalid record details neutral metadata.")`, with no input, raw trap
error or cause. Unknown accessories retain the producer's existing safe denial;
no alleged accessory method/property is used as proof. There is no String/toJSON/
getter coercion. Static malformed metadata may throw before hooks by design.

This is not universal Proxy/global containment: a reflection trap can run its own
application side effects, and global builtin overrides are not intercepted. No
rollback, private-data content classifier or authority follows from metadata.

## Identity and unchanged producer structure

No label state/effect/subscription/focus mechanism or component key was added in
production. The same section/ref/tabIndex and the same BoundDetailsShell props,
session/body helper, shell token, claim/release, focus scheduling and effect dependency
arrays remain. Only that section's aria-label expression uses the captured primitive.
Valid label changes do not configure an accessory, change model/actor/ports/source/
accepted details or select a new content key. The existing bound hook constructs a
transient session **view wrapper** on render; that unchanged behavior is not a claim
of referential equality of wrapper objects. Lifecycle/contentKey/producer identity
and owned app DOM are the relevant identity contracts here.

`static-check.mjs` checks exact immutable preimage SHA, exact new parameter and four
capture statements/order, then normalizes only the one aria-label back to its old
literal. Every remaining RecordDetails statement (hooks/effects/body/ref/anatomy)
and all unrelated module declarations/imports must be AST-identical. Constants are
checked by literal value. This is structural/static import evidence, not execution,
SSR/focus/form continuity or a new full runtime/cycle graph pass.

## Authored cases — not executed

- Seven own unit/SSR cases use the existing real D.factory C/CD/P/AppOwner and actual
  `useDataTable` + `useDetailsAccessory` hook-issued accessory: omitted English,
  explicit Arabic/custom, RTL without inferred translation, no private candidate
  descriptors/read/body/other ports before layout, provenance-first unknown/copy/
  proxy denial, malformed metadata/getter/coercion/trap denial and whitespace retention.
- Denial-only direct entry calls stop before hooks; valid SSR positives use actual
  React rendering, never a structurally fabricated permitting accessory/model/session.
- One authored browser case opens actual bound details, edits a real app input,
  changes only child neutral-label state and checks app DOM/value plus actual
  accessory/binding/actor/model/ports/source/contentKey identity. The setter state
  exists **only in that test harness**, not in the production provider. Port6578,
  inherited real D2 Tailwind/source setup and CSS link are authored, never launched.
- Positive source inference and four excluded negative lines cover readonly metadata,
  explicit undefined, nonstring values and wrong accessory record T. No negative
  program, removed-directive matrix, dual/emitted/packed lane was executed.

## Immutable protection and actual LIGHT checks

Canonical130-source aggregate:
`90f6528f6adcc061eeae0a6e47d81179ff4a018d6732d10110e34cead7f2c55d`.
Provider preimage SHA:
`aa8d59d31482fa8958039e827dc17f39e3aa361a6922b162e7c4b56be40d32a5`.
Original bytes are `preimages/details-provider.before.tsx` (explicit immutable test
input); original130/derived129 maps stay in own `.artifacts/`, never rebased. Current
source count is still130. All other129 sources (CSS included) and1112 existing
tracked/test/log/seal inputs remain unchanged. Main child TASKS is excluded explicitly.
Old D2 raw warning logs are retained verbatim, not rewritten/staged by this worker.

Scope uses read-only Git index inventory and normalized filesystem Git modes: file/
symlink kind plus owner executable bit, **not** raw100664 versus100644 rw bits. No
Git mutation. Current exact source/test/preimage input hashes/aggregate are in
`.artifacts/handoff.json`; main must retain the immutable preimage for cold static
checks, not accidentally stage generated `.artifacts/` evidence/log trees.

Actual LIGHT results only:

- own positive TS6 actual-source program and existing D2 positive program pass;
- scoped Biome/syntax pass;
- exact old/new AST and unchanged imports check pass;
- scope passes129 protected sources/1112 old inputs/original preimage/index.

Final logs: `own-final-resumed.log`, `d2-final-resumed.log`, `biome-final-light.log`,
`syntax-light.json`, `static-final-light.log`, `scope-final-light.log`. Initial
compile/static/format results remain preserved. No assertion from the authored
unit/SSR/browser/negative cases was run. This tree predates main's S2/audit/Date
integration: positive source aliases are **not** ordinary public/root/packed proof.
The server restart interrupted the original final compile calls; their empty
`own-final-light.log`/`d2-final-light.log` files are preserved without a success
claim. No compiler process remained; only those two incomplete calls were repeated
into the resumed logs. Completed AST/Biome/syntax checks were not repeated.

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/typescript/bin/tsc -p tests/details-neutral-label/tsconfig.json --pretty false
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/typescript/bin/tsc -p tests/data-table/details-accessory/tsconfig.light.json --pretty false
NODE_DISABLE_COMPILE_CACHE=1 node tests/details-neutral-label/static-check.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/details-neutral-label/scope.mjs --after
```

Only in the user's final verification phase (unrun here):

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/details-neutral-label/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/details-neutral-label/playwright.config.ts
```

Full readonly/wrong-T/undefined negative verification, SSR/browser/failure replay,
manual Arabic/AT, independent review and ordinary emitted/packed/root integration
remain separate deferred gates. No install/dependency/shared build/emission/runtime/
server/browser/network/vendor/.repo/agent/PR/merge/export/permission changes.

Main next: inspect the single-source metadata delta, exact static result and input/
protection hashes, preserve/commit the isolated correction and intake after shared
S3 hands off. Review16n2 is addressed provisionally by source, not independently
verified/closed as a language/accessibility/full-WP-09 gate.
