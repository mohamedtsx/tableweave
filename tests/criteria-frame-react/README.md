# Criteria React bridge and source metadata — PROVISIONAL

Implementation handoff for TASK-017 / FR-01/13/16, AC-16/25. This is not final
runtime, React, SSR, privacy-erasure, consumer, packed or release approval.
Main owns planning/TASKS/REVIEW, public exports and Git. No worker Git mutations.

## Historical blocker and exact scope

[BLOCKER.md](BLOCKER.md) remains unchanged history: the first draft stopped without
compilation because genuine requestless resource identity was unavailable. Main
then allocated and implemented the source-private factory identity lookup in
`resource/adapter.ts`. That resolves the stated engineering boundary; it is not
new product policy or independent verification. The historical blocked handoff
is preserved as `.artifacts/blocked-handoff.json`.

Worker sources remain only existing `presentation/criteria-frame.ts` and new
`presentation/criteria-frame-react.ts`, plus this new test namespace. Root exports,
all other runtime sources, existing tests, configs/manifests and lockfile remain
outside the worker lease. Main's resource edit is read-only here.

- Original map: 117 actual sources including CSS; aggregate
  `f028ea42c0dc4af949ccec5e871fff4867648b46eddb1f97713dd3a5ae19b13e`.
- `.artifacts/before-source117.json`, `protected-source116.json` and the exact
  `original-criteria-frame.ts` preimage remain historical, not resigned.
- New `protected-source115.json` is derived from that original116 map by excluding
  **only** main-owned `packages/react/src/resource/adapter.ts`. Expected hashes for
  the other115 are never recaptured from current bytes.
- Main adapter preimage is
  `36df1cc7ca0304140a2d983be9e84c577322956b6e211e6a9697b19f711261f4`;
  current expected hash is
  `7ce69208472b815420ff1688016375c6633fdb9626a6ef8b055b42d6fa3405d2`.
  Its external preimage path is recorded in `main-identity-delta.json` and checked
  independently. This is **not** a claim that all original116 remain unchanged.
- `before-inputs.json` protects the original609 captured static inputs, including
  four explicit F1 seals. General historical `.artifacts` directories were not
  fully inventoried, so the check is not a byte audit of every historical log.
- `.artifacts/handoff.json` records final worker source/fixture hashes, aggregate,
 115-source protection and the separate exact main delta. No output generation is
  registered; historical installed dist remains unchanged.

## Actual source-module API

`CriteriaFrames<S,T>` adds:

```ts
commitSource(input: {
  criteria: CriteriaAuthority<S>;
  expected: CriteriaOrigin<S>["context"];
  source: ControlsInput<S,T>["source"];
}): CriteriaSourceAuthority<S>;
disconnectSource(authority: CriteriaSourceAuthority<S>): void;
```

Both are receiver-bound actions on the existing genuine owner. `commitSource`
has no native input and never prepares a boundary, processes rows or grants a
tool. The first successful source commit can pin mode and exact R; later genuine
frame commits honor that pin. Source and frame cells share the original immutable
C/CD/P. Local `close()` revokes both; it does not dispose C/P/R.

`CriteriaSourceAuthority<S>` is invariant and has a separate private WeakMap from
tool authorities. `getCriteriaSourceOwner` is provenance-only lookup.
`requireCriteriaSource(capability, expectedOwner)` authenticates exact capability
and owner identity before reflecting alleged payload, then freshly checks P,
criteria/domain, current source permission and post-reentry identity. A same-domain
old capability may follow the owner's newest committed source cell; it cannot
retag another P, epoch, owner, mode or R. It cannot pass `requireCriteriaTool`.

Source cleanup uses the exact receipt's source entry. Old cleanup cannot clear a
new source cell. `CriteriaFrameSnapshot.phase` remains `empty` for source-only
readiness; a source capability is deliberately not a zero-row frame.

### Finite metadata whitelist

All returned metadata is readonly/frozen. There are no records, rows, counts,
pages, raw errors, callbacks, query copies or controls in the result.

| Field | Client | Remote |
| --- | --- | --- |
| `origin` | Actual criteria origin (C/CD/context/epoch) | Same |
| `mode` | `client` | `server` or `server-complete` |
| `kind` | Absent | `idle`, `pending`, `ready`, `failure` |
| `busy`, `stale`, `hasSnapshot` | Absent | Actual finite resource metadata |
| `error` | Absent | `null`, `unavailable`, `offline`, `timeout` |
| `emptyKind` | Absent | `null`, `dataset`, `filtered`, `unknown` |
| `canRetry` | Absent | Actual current bound request permission, never a callback |

Remote factory identity is checked **before** reading alleged view/bindings/ports.
Copied/proxied/fabricated resources do not inherit identity. Identity alone grants
no liveness or permission: actual current view identity, expected context/access,
active status, invalidation success and nonblocked/nondisposed kind are required.
Any actual request/snapshot requires genuine U4 binding and exact original token
tuple/query-reference/extent/time/definition proof. Requestless genuine idle is
valid. Access loss denies, never becomes a network retry.

Retry eligibility also requires current C query identity to equal the genuine
request binding's query identity. The binding's original evaluation/extent tuple
is retained; the current clock does not rebase it. No formatter/query compiler,
transport, `retry`, `begin`, resource `connect` or P/C lifecycle mutation occurs.
Client metadata never reads caller records. Ports and binding/context references
are retained, not a separate row/query buffer. At most current request/snapshot
proof references are cached, not a growing request history.

Legacy omitted-metadata F1/native admission is not newly factory-restricted.
Only the new metadata path uses main's lookup. `manualOrder?: boolean` is the sole
additive `CriteriaFrameInput` field, captured as own data and stored in the actual
existing controls input. Explicit nonbooleans (including present `undefined`)
deny. No accepted order cache/controller API is introduced.

## React action linearization

`useCriteriaFrame<S,T>(frames,input)` accepts criteria/expected/source with optional
actual `nativeInput` and own-data `manualOrder`. It returns:

- `null` before layout/SSR, for invalid/revoked readiness or owner replacement;
- `{ phase: "source", sourceAuthority, metadata, frame: null, pair: null }`;
- `{ phase: "frame", sourceAuthority, metadata, frame, pair }` after a real commit.

Render allocates only an inert local store and performs exact owner lookup. It
does not inspect candidate inputs, keep a render-written latest-props ref, acquire
R, or prepare any model. Snapshot reads use committed permission and declared
owner/source metadata. Server snapshot is stable and neutral; resource server
snapshot/hydration behavior is unchanged. No serialized capabilities/bootstrap
reset are introduced. Explicit C/CD/P replacement requires a keyed lifetime.

Only actual layout captures the committed candidate, authenticates/adopts source
metadata, and—if genuine native input and a real remote snapshot are available—
calls the sole original owner's `prepare` → `commit` → `issue`. No second native
boundary or `useNativeTable` exists. Missing input/snapshot is source-only, never
an invented empty model. Frame commit still uses F1's actual native commit before
paired-cell publication; errors deny and disconnect, without vendor rollback
claims. Source metadata is a distinct action, not an atomic native-frame promise.

Stable external snapshots compare actual C snapshot/P/frame version tokens and
current R view refs. Layout's native-refresh key compares origin/context/mode
primitives, exact R, current view/bindings/record refs/page primitives, manualOrder
and the actual accepted C snapshot—not props container identity. Metadata-only
same-value commits do not publish a new frame version. Ordinary freshly allocated
envelopes therefore do not intentionally cause an own-notification loop. Accepted
selection/column/query/relative-clock changes use the real controller snapshot;
there is no query/state mirror. Mutation of an application array without changing
its reference is not a deep-watch protocol.

The stored continuation is a private exact-registry receipt, not the full native
candidate payload. It keeps comparison/proof/port references from layout only.
An unchanged already-admitted remote configuration may refresh through its
captured genuine current ports/bindings; previously admitted stale native metadata
can advance to that actual snapshot. New or changed supplied facts are re-admitted,
not blessed by structural similarity. Omitted native input never auto-promotes.

After valid commits, explicit C, P, frame-owner and R **metadata** subscriptions
are acquired with captured own functions/receivers and pre/post permission checks.
There are zero R connection/acquisition calls. Cleanup releases exact local
subscriptions/frame/source receipts only; Strict layout replay reuses the same
genuine owner and never calls terminal `close`, C/P/R disposal or P transitions.
Stale cleanup cannot erase a replacement. A suspended/abandoned same-domain B does
not run candidate private work; committed A stays eligible until actual B commit
unless real P/source permission revokes it.

Private bridge helpers/types (`getCriteriaFramesOwner`, `captureCriteriaReactInput`,
receipt/capture/equality details) are source-module plumbing, not proposed root
capability APIs. Main should export only the intended source capability interfaces
and hook, not the private capture protocol. Public root/export integration remains
main's next action, not proven by historical installed declarations.

## Authored tests — not executed

- 18 unit/SSR cases: genuine pending construction, requestless/initial failure,
  current Retry eligibility, supported/unsupported policies, actual page/complete
  native frames, metadata whitelist/no client record scan, stolen-view/copy/proxy/
  disposed identities, genuine U4 binding rejection, access loss, two owners/P2/
  epoch isolation, receipt cleanup, reentry, semantic keys and actual relative tick.
- Six real browser React cases: Strict replay/null prelayout, reallocated inputs/
  no-loop, selection/column refresh, suspended candidate, initial failure without
  a model/tool or Retry invocation, complete/native source refresh, access masking,
  independent owners/unmount and native callback reentry. They use real
  `ApplicationOwner`, controllers, frame owner, resources, bindings and native rows.
- Five meaningful negative type lines: source/tool brand separation, tool adoption
  denial, invariant foreign schema and manufactured source authority. The negative
  file is excluded from the light positive fixture compile.
- Final type runner authors source/emitted × TS6/5.9, with one all-directives-removed
  program per mode/compiler: 20 expected negative-line checks, not 20 separate builds.
- Static runtime import-graph runner is authored; it is not runtime SSR proof.

## Actual LIGHT checks

Final installed TS6 noEmit package and own positive fixture checks pass:

```sh
node node_modules/typescript/bin/tsc -p packages/react/tsconfig.json --pretty false
node node_modules/typescript/bin/tsc -p tests/criteria-frame-react/tsconfig.light.json --pretty false
```

Their exact final logs are `package-final-light-02.log` and
`fixtures-final-light-02.log` in `.artifacts/`. Scoped
Biome passes 17 code/config files; all five own MJS files pass `node --check`.
Scope-only verification compares115 protected sources, the exact main adapter
delta/preimage and original609 captured static inputs. See final logs/handoff.

Initial compile failures (`package-light-01.log`, `fixtures-light-01.log`) and all
subsequent attempts remain preserved. Initial errors were a closure function
narrowing and runtime-negative fixture casts/narrowing; scoped lint also preserved
its initial error/formatting history. Earlier successful compiles before the final
receipt refinement are historical attempts, not final-source verification.

No runtime/React/SSR unit, browser/server, dual compiler, emitted/removed-negative,
packed, import-graph, CI or independent verification has run in this phase. No
installs, shared emission/build, Git mutation, agents, network, vendor patch or
`.repo` changes. No n1 approval, backend completeness, privacy erasure, release or
PR-merge claim follows.

## DEFERRED final-phase commands

Run only in the user's single final verification phase, then inspect failures,
fix in-scope defects and rerun affected checks before independent approval:

```sh
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/vitest/vitest.mjs run --configLoader native --config tests/criteria-frame-react/vitest.config.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/criteria-frame-react/check-types.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/criteria-frame-react/check-imports.mjs
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@playwright/test/cli.js test --config tests/criteria-frame-react/playwright.config.ts
node tests/criteria-frame-react/scope.mjs --after
```

The browser command starts its own local Vite server only in that final phase.
Authored SSR coverage is a neutral server-render test, not hydration acceptance.
Packed/root-export/real-consumer and wider integration commands remain separately
main-owned; private emitted consumers are not genuine packed-consumer proof.
