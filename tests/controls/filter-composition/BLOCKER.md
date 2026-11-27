# FC-01 — real builder portal loses focus during accepted selection replacement

**Historical failed-generation reproduction; no correction/workaround at this handoff.**
The separately reviewed fc01 producer correction now passes actual unchanged19
and the unclocked diagnostic. See [current main observations](README.md#main-owned-fc01-observations).
Keep this original failure/trace record; it is not a claim that corrected output
still reproduces the failure or that later packed/full workflow gates are passed.
Target transport is now committed `68706c5` per main. This worker has not performed
Git operations. Default combined suite: **18 pass / 1 fail, 19 discovered**, with
the required focus assertion intact. A separate unclocked diagnostic also fails.
The observation establishes a real tool/toolbar focus-boundary problem, not its
precise producer/vendor root cause or permission to alter one.

## Exact reproducer using actual target public outputs

```sh
pnpm exec playwright test --config tests/controls/filter-composition/playwright.config.ts --grep 'accepted off-page-only' --output tests/controls/filter-composition/.artifacts/focus-probe
pnpm exec playwright test --config tests/controls/filter-composition/focus-diagnostic.playwright.config.ts
```

The second command uses the same unmodified application, dependencies, emitted
entry resolver, port6499 and default30s budget, but **no fake clocks, queued search
or lifecycle instrumentation**:

1. Open `/?rule`; the genuine grid mounts with the accepted Amount>=20 rule.
2. Click the real `Value: Amount: ...` chip, fill its real Value textbox with `70`.
   This is an unapplied local draft. Assert that textbox actually owns focus.
3. Through the existing genuine application event seam call
   `window.filterControls.first.external({type:"selection.change",update:{unavailable:true}})`.
   This is app-owned external selection acceptance while the builder modal is open,
   not a force/DOM user-click bypass, speculative query write or fabricated native
   row. The same callback backs the existing application scenario control.
4. The actual normal region and real builder portal unmount. The genuine toolbar
   renders selection Cancel. Expected: focus transfers to
   `Cancel — Clear row selection`. Actual: focus is on **BODY**, and the required
   focus assertion fails after the ordinary5s assertion budget.

No intermediate focus/inert mutation, artificial delay, increased timeout, skipped
assertion, hidden-filter replacement, private API call or product workaround was
used. `getRestoreFocusTarget` is supplied through the actual supported public prop
for the return-to-normal path; it is not a custom cancel-focus manager.

## Preserved evidence

All paths below are relative to `tests/controls/filter-composition/.artifacts/`:

- `browser-second.log`: full19 emitted run, **18 pass / 1 fail**.
- `focus-probe.log` and
  `focus-probe/composition-accepted-off-p-08c68--clearing-accepted-criteria-chromium/trace.zip`:
  explicit focused-input precondition and before/after passive DOM observation.
- `focus-observation.json`: actual attached observation extracted from that trace:
  `before={tag:"INPUT",label:null,dialogs:1}`;
  `after={tag:"BODY",label:null,dialogs:0}`.
- `focus-unclocked.log` and
  `focus-unclocked/focus-diagnostic-unmodifie-c4db4-on-swap-without-fake-clocks-chromium/trace.zip`:
  one real unclocked reproduction, failed focus assertion.
- `browser-final.log`, `browser-final.json` and
  `browser-final/composition-accepted-off-p-08c68--clearing-accepted-criteria-chromium/trace.zip`:
  final formatted full19 replay still **18 pass / 1 fail**, no page-error failure.

The main19 failing case stops at its required Cancel-focus assertion. Its later
queued-search timeout, queue action, selection Cancel/normal-focus restoration and
discarded-draft reopening assertions therefore remain **blocked, not passed**.
Independent passing cases do prove ordinary accepted search debounce/simulated IME,
Editor Cancel, controlled rejection/acceptance, date Cancel versus selection/filter
consequences, actual membership, hidden priorities/columns, stable nullable tabs,
two owners, and locale/theme/axe/viewport behavior at their stated scopes.

## Frozen boundary and exact next step

- All main **180** public outputs remain exactly
  `ad59470c7d472563ed273b8b167073953f6f574df0a1910510480082da63a8ce`.
- The own **275 source/public** guard remains exactly
  `1b843feaa084edc13b620f77f88d608612284f396b8c6cfcc5e6f02ff9604555`.
- Strict TypeScript6.0.3/5.9.3 pass emitted and separately labelled source checks;
  full own Biome formatting/import-order/lint passes22 files. New source files are
  stable for main's full type check. Old38 and main-owned files were not edited.

Main next: independently replay FC-01 and determine the actual tool/toolbar/vendor
responsibility under the accepted focus contract. A producer correction, if needed,
requires main's separate allocation/review/build and a new explicit frozen artifact
generation. Do not manufacture green with an app/global focus patch or removing
the focus assertion. This worker does not build packages or broaden the RAC profile
repair. New Storybook4 and genuine packed19 are still **not executed**; main's
other passing643/165/43/38 lanes are separate evidence, not this combined approval.
