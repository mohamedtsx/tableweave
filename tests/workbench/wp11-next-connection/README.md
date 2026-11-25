# Next connection correction — provisional source handoff

Authorized correction of review26n1/n2 against supplied isolated HEAD35780bf.
Only existing `apps/example-next/lib/client-owner.ts` changed; all other writes are
new files in this directory. Main owns Git, TASKS/REVIEW and primary intake. No Git,
install, dependency/profile/export, library, other app/config, original fixture/map,
Next/bundler/native module, application/React test, server, browser or SSR execution
occurred. Drag remains blocked; WP-10/G-02 and WP-11 acceptance remain incomplete.

## Exact source delta

1. Effect release invalidates its exact local connection token **before callbacks**
   and invokes only the disconnector actually returned by A's `app.connect()`.
   There is no timer/microtask, terminal-disposal heuristic or final-unmount guess.
2. Temporary release synchronously uses A's real unsubscribe/clear-input behavior.
   A later retained effect can reconnect the same genuine C/P and existing authority;
   it does not remount the controller, create a publication or grant new access.
   Public synthetic initial records are not an inherited private cache or grant.
3. A synchronous transition guard rejects reentrant attach during attach/release.
   The wrapper marks a token attached only after actual connect returns with active
   input. Stale/duplicate disconnects are no-ops and cannot retire a replacement.
4. Genuine `app.revoke()` is unchanged and terminal. A terminal A owner cannot
   become active through this wrapper; an inactive result gets no attached token.
   If attach/release throws, the wrapper stays closed and invokes actual A revocation,
   not a new authority. Primary errors propagate; secondary revocation errors are
   retained together in `AggregateError`. This is not a disposal receipt. If attach
   failed before returning its exact disconnector, no complete unsubscribe receipt
   is invented; real exceptional cleanup remains a final verification obligation.
5. The **only** P/resource/options/C disposal is the pre-return initial-query mismatch
   branch, before the source is connected. It first checks P's successful `disposed`
   result, then disposes downstream resources/C. A blocked result throws with cleanup
   debt, without pre-marking disposal or forcing C cleanup. There is no automatic
   UI-disconnect terminal helper or new public disposal API.

The existing client boundary/hook, RSC payload, source owner, definitions, manifest,
runtime/LIGHT config and all155 library sources are untouched. Inactive local objects
may become unreachable; **GC is not a C/P disposal receipt**. Actual React retained
effect/Next Activity scheduling and genuine framework behavior remain unproved.

## Historical evidence disposition — no old seal was re-signed

Before editing, `scope.mjs capture` verified all80 original seal bodies, all1,728
original pinned inputs and all155 library identities. It captured **1,773 current
regular inputs/modes**, including the original raw artifacts, and copied the exact
owner preimage to `receipts/client-owner.before.txt`. Original1692 inputs also match.
The new plan receipt includes the bounded connection selection; primary reads were
limited to that documentation and REVIEW's review26n1/n2, not other-worker WIP.

Original seal SHA256 remains
`391ded6f0de58c5e17cdead4c83bfc8cdef61f4cd70fdd7b26f95b6786ccb810`.
Source155 map SHA256 remains
`bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837`.
Post-correction comparisons record exactly **one body drift** in the original80 map
and original1728 pin: `apps/example-next/lib/client-owner.ts`. The other79 sealed
bodies,1727 pinned inputs, all1692 protected old inputs and all155 sources are fixed.
These historical maps are unchanged, not silently rebaselined. Their original
all-current-hashes claim no longer passes. The old auto-scope driver also predates
this new authorized namespace; use this correction's explicit comparator/commands.

The original `wp11-next/client.test.tsx` and both old READMEs remain exact history:

| Original assertion group | Corrected final-only disposition |
| --- | --- |
| Neutral React SSR: status, no table or row text | Retained with the actual boundary and `renderToString`; UNRUN. |
| Distinct C/P, initial identity, page1 versus page0, independent revocation | All retained; terminal-disposal-after-temporary-release assertions are superseded, not passed. |
| Immediate replay uses the same C/P | Retained and extended to unchanged publication/authority plus delayed reattach; microtask terminal disposal and later-connect rejection are superseded. |
| Invalid bootstrap rejected by the public parser | Retained; malformed identity and valid-but-different initial query are also authored. |

The new `vitest.config.mjs` selects corrected `connection.test.tsx` and unchanged
original `wp11-next/server.test.ts`, not the obsolete original client test. It reuses
the existing **source-unit** resolution configuration, never Next runtime aliases.
Do not call the old full Vitest command passed, skipped or fixed. The sealed original
app README's microtask-disposal description is superseded by this correction, not
silently edited. No unrelated SSR/request/query assertion group was dropped.

## Recovery and actual evidence

The first README write stopped with the patch tool's `ENOSPC` error, leaving62 lines.
At that stop no correction pin or handoff seal existed. The user subsequently
reported a server restart and restored capacity with dependencies/evidence intact.
This writer performed no cleanup, deletion, install or restart. No contemporaneous
on-disk ENOSPC failure log was preserved; none has been reconstructed or invented.
`receipts/README.enospc-partial-001.txt` preserves the actual partial file verbatim;
`receipts/recovery-001.json` records the recovery observation, its hash, free space
and the9 unchanged code/config identities. These are recovery receipts, not raw
logs of the original failure. Recovery writes stop below128MiB available space.

The first recovery pin invocation (`capture positive-inputs-001`) stopped before
creating its output directory: importing `scope.mjs` inherited the CLI `capture`
argument and hit its immutable-before-map guard. The actual tool error was
`Immutable before map exists`; no map was overwritten. Its retrospective note is
`.artifacts/recovery-pin-001/failure-note.json`, explicitly not a contemporaneous
raw log. Retry uses fresh label `positive-inputs-002` and a neutral-argument preload
of the unchanged scope helper. Seal capture needs the same preload. No helper,
production source or config is edited to bypass the guard.

Preserved producer results are not replayed into their old labels:

- `format-001`/`format-002`: full scoped Biome with formatter and assist off.
- `light-001`/`light-002`: positive TS6/noEmit, static/syntax and scope passed.
  The preserved `light-002/results.json` has exit0 for positive and static checks;
  its scope record has exactly the disclosed original-seal/pin body drift.
- `biome-001`: full recommended Biome plus formatter passed9 changed/new code/config
  files, no fixes. Preimages/maps/receipts/raw outputs were excluded. Recovery makes
  no production, fixture-code or config edits; its9 identities are checked against
  the recovery receipt, rather than overwriting or claiming a new Biome-001 run.

The completion artifacts use fresh labels, after this README is finished:

| Artifact | Meaning / actual-result location |
| --- | --- |
| `.artifacts/positive-inputs-002/{inputs,summary}.json` | New correction pin: actual compiler files/bodies plus protected regular, original pinned and own inspection inputs; summary owns count/hash/versions. It does not re-sign any historical map. |
| `.artifacts/light-003/{positive,static}.log`, `results.json` | Final strict positive TS6 and syntax/static replay; statuses are generated by the real tools, not prewritten here. |
| `.artifacts/light-003/{scope.json,client-owner.diff}` | Actual one-source delta,79 unchanged original sealed inputs,155 libraries and protected regular/manifest/lock identities. |
| `.artifacts/final-scope.json`, `handoff-hashes.json` | New correction seal includes the corrected owner, new preimages/code/README/maps/receipts and raw outputs, not a replacement for the original seal. |

The correction LIGHT config extends the preserved app LIGHT with **no compiler-option
overrides**. It includes the actual boundary/A producer, new positive cases and
installed Next/React declarations. The static guard checks unchanged public imports,
production scheduler absence, token guards, pre-return disposal placement and final
fixture selection. These are syntax/placement/type checks, not executed lifecycle,
observer, receipt-blocker or bundler proofs. Installed runtime/native closure and
ordinary archive compatibility are not established by any input map.

Exact completion commands, isolated repository root; guard free space before each
write-producing command and use a fresh label if an attempt already exists:

```sh
node --input-type=module -e 'const d="./tests/workbench/wp11-next-connection/"; process.argv[2]="preload"; await import(d+"scope.mjs"); process.argv[2]="capture"; process.argv[3]="positive-inputs-002"; await import(d+"pins.mjs");'
node tests/workbench/wp11-next-connection/run.mjs light light-003
node tests/workbench/wp11-next-connection/pins.mjs verify positive-inputs-002
node --input-type=module -e 'const d="./tests/workbench/wp11-next-connection/"; process.argv[2]="preload"; await import(d+"scope.mjs"); process.argv[2]="capture"; await import(d+"seal.mjs");'
node tests/workbench/wp11-next-connection/seal.mjs verify
```

Completion requires the pin to verify after replay, all recovery code identities to
remain unchanged, and the new seal to verify. Read the generated summaries/statuses
and reported seal hash for actual results; command listings alone are not evidence.
No old map, raw result or original fixture is rewritten by these commands.

## Final cases and remaining limits — UNRUN

The11 corrected client cases are authored, not executed: actual neutral React SSR,
immediate replay, delayed reattach across microtasks/a later task with unchanged
C/P/publication/authority, stale/duplicate disconnect, synchronous empty/inactive
display **inputs** and reentrancy, terminal revocation, independent queries/sources,
real observer failure, throwing release, aggregate failures, and invalid bootstrap.
They use actual public owners, no fake owner, fake timers, skipped cases or allowing
policy. A task delay appears only in an authored test, never production cleanup.
Neither a delayed unit call nor source-input assertions prove actual DOM purging,
React Strict/Activity retained scheduling or Next retained-page/cache behavior.

Only in the user's final verification-and-fix phase, **not during this recovery**:

```sh
node node_modules/vitest/vitest.mjs run --config tests/workbench/wp11-next-connection/vitest.config.mjs
```

This selects the current source-unit/React-SSR lane plus unchanged server cases,
not an ordinary unpatched consumer or a Next compatibility gate. All actual React/
Next retained scheduling, SSR/hydration/RSC, browser6571, build/typegen, native/
PostCSS, negative/dual/emitted/ordinary-packed, CI, manual AT and independent review
remain deferred. Exceptional partial-connection cleanup and blocked pre-return
P disposal have no executed cleanup/blocker/retry reproduction here. No automatic
final-unmount disposal or GC receipt is promised. Main independently reviews scope/
API/TS and owns Git/preservation/intake. **Source remains PROVISIONAL**: no React/
Next execution, review26 closure, WP-11 approval or drag/G-02 waiver follows.
