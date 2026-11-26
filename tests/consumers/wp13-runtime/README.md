# WP13 family runtime follow-up — provisional SOURCE, execution UNRUN

TASK-021 / AC-26/27 / review30n1. Main supplied preservation revision `10f6a8a`
on `feat/wp-13-archives` and selected `docs/planning/wp-13-runtime-plan.md`.
No worker Git operation establishes that frame. This follow-up replaces the missing
runtime **source**; it does not close the review finding independently or approve
complete WP13/G-05. Drag/G-02 stays blocked. No next-packet work is included.

## Exact changes and historical identity

Changed only these five leased existing files:

- [Vite adapter](../wp13/families/vite.mjs), [preimage](evidence/preimages/families/vite.mjs.txt).
- [Next adapter](../wp13/families/next.mjs), [preimage](evidence/preimages/families/next.mjs.txt).
- [Start adapter](../wp13/families/start.mjs), [preimage](evidence/preimages/families/start.mjs.txt).
- [Fixed command dispatch](../wp13/lib/generation.mjs), [preimage](evidence/preimages/lib/generation.mjs.txt).
- [Staging/output guards](../wp13/lib/installer.mjs), [preimage](evidence/preimages/lib/installer.mjs.txt).

NEW production sources: [parent runtime validator](../wp13/lib/runtime.mjs),
[standalone observation runner](../wp13/fixtures/family-runtime.mjs), and
[built-output host/Request bridge](../wp13/fixtures/start-host.mjs).
Only the two new frozen executable fixtures are staged through existing preparation.
All further additions are in this new follow-up subtree, not another product app.
The original CLI/protocol/matrix/readme/evidence, remaining helpers/fixtures, library155,
apps, manifests/lock/private assets, historical outputs and `fc01` are untouched.

Before these edits, the [separate before map](evidence/before.json) captured2,425
actual old regular files/modes and997 actual installed/tool inputs, verified all137
original seal entries and all1,179 original pin inputs/1,128 program files, and saved
the five actual preimages. It did **not** recapture an old baseline or producer map.
Original seal `ca6706bd83f1041fcf6e3115f411cab4e5dccb993e2c4f87651b0a222401ca7f`
and pin `ed3016137b3c24c26dc21e350738c87b85893da6613e68fac8cbc888af909498`
retain their original bytes. Their five original body hashes now intentionally
differ from current source; they are not rewritten or represented as current pins.
[Scope verification](evidence/scope.mjs) checks all non-leased original entries,
original2,286 old inputs (only main bookkeeping drift permitted), canonical155 and
initial14 installed inputs, plus the follow-up baseline and exact path lease.

The original static procedure requires unconditional `E_HOLD_*` runtime bodies and
its original scope excludes these five changes. That historical assumption is
superseded, not weakened in place or claimed as a passing current check. The new
[AST/static check](evidence/static.mjs) checks real dispatch, entry/import guards,
fixed commands, receipt/output/binding guards, complete case names and actual Start
`entry.fetch(Request)` bridge. Parsing/token checks are not helper execution.

## Implemented future path — not executed here

1. Existing `family-runtime` CLI dispatch remains synchronous: adapters call
   `runFamily(ctx)`; fixed generation dispatch runs only the staged
   `wp13-family-runtime.mjs` with the already selected owned Node/safe environment.
   No CLI modification, arbitrary command/arguments/import/URL field or default
   action is needed. The runner uses async `spawn` for its own server child.
2. Parent verifies existing control snapshots, producer/toolchain, actual archives,
   prepared/installed/native maps, reviewed build and browser/runtime selections.
   Family-build receipts now bind candidate/key/profile and consumer-relative output
   maps/outputRoots. Next records the actual whole `.next` regular tree; Vite prefixes
   its actual built tree; Start retains its actual selected outputs. Missing entries,
   extra unselected built files, stale receipts or output escape fail before startup.
3. A selected main attempt permits exactly one fresh exclusive `wp13-runtime/`
   directory. Existing/symlink/reused attempts fail; there is no retry or deletion.
   The immutable `attempt.json` snapshots current identities/maps/control hashes.
   The child verifies actual bytes again, refuses occupied6575 before any server
   start, uses only127.0.0.1:6575 and never takes over/reuses a server. Main serializes
   invocations; one job/zero retries is selected, not a parallel benchmark protocol.
4. Fixed production server commands: installed Next `next start --hostname
   127.0.0.1 --port 6575`; otherwise the staged built-output host, with no caller args.
   Vite serves only approved built HTML/assets. Start imports only the current
   `dist/server/server.js` default entry and calls its real `fetch(Request)` using
   the accepted WP11 production-host method/header/stream/duplex/signal contract.
   A different/missing public output contract stops with
   `E_START_PUBLIC_BUILT_FETCH_CONTRACT_REQUIRED`, never a private SDK fallback.
   Disconnect propagates abort/destroys the outbound stream; this is not proof of
   every SDK abort/late-completion case.
5. Consumer-local `@playwright/test@1.65.1`, approved local Chromium executable and
   complete browser-directory/native maps are mandatory. No engine/channel/flags,
   global browser cache, install/download, source alias or root runtime exemption.
   Browser page requests are intercepted to the fixed origin, WebSockets blocked,
   service workers blocked; API/readiness requests use fixed local URLs with redirects
   disabled. This is not a firewall/OS sandbox or hostile same-user race guarantee.
6. Actual callbacks produce per-case observations; timeout/assertion failure records
   a failed case, not a fabricated pass. Real stdout/stderr are bounded262,144 bytes
   per stream; overflow/truncation fails. Header-shaped lines are redacted; reports
   use counts/statuses and public synthetic observations, not cookies/auth/filter
   dumps. Unexpected page/console/framework errors fail. Intentional RSC failure
   requires actual HTTP500 **and** a narrow fresh server-log callback-boundary
   message naming `onUnexpectedAction`; unrelated500/build/TS errors cannot pass.
7. `finally` attempts every owned context/browser/server cleanup, retains the first
   failure and separate cleanup debt, and never kills global processes/deletes
   evidence. Forced server kill is debt, not green cleanup. Own temporary browser
   files are scoped beneath the attempt's `tmp/`; normal Playwright close manages
   its own transient profile, not project/evidence cleanup. Parent validates the
   complete nonempty observation schema and all identities/metrics, rechecks actual
   maps/outputs/attempt bytes, and records `runtime-result-KEY.json` with file hashes.
   Empty/missing/stale/truncated/mismatched/failed reports are errors. Subsequent
   phases require a main-approved matching successful result and exact output set.

### Main-selected receipt data

All receipts use existing `approval.receipts` hash selection; they are trusted-main
local inputs, **not backend authority, signatures or a caller-provided hash waiver**.
Missing preconditions fail closed. No approval or input root is created here now.

| Receipt | Required current fields |
| --- | --- |
| `runtime-plan-KEY.json` | status `main-reviewed-family-runtime`; run, candidate, key, family, profile, variant; workers1/retries0/host127.0.0.1/port6575. Next variant equals existing request.nextCase and actual build.nextCase; other variants ordinary. |
| `browser-inputs-KEY.json` | status `main-reviewed-local-chromium`; run/candidate/key/playwrightVersion1.65.1; directory `node_modules/.wp13-browser`; executable below that directory, regular/executable/canonical and in the nonempty complete mode/size/SHA256 files map. No links/borrowed browser files. Main provisions native prerequisites separately. |
| `runtime-attempt-KEY.json` | status `main-reviewed-fresh-runtime-attempt`; key/candidate, exact planSHA256, UUIDv4 attempt and outputDirectory `wp13-runtime`. Existing output fails instead of accepting another selector hash. |
| Existing native/build/installed/prepared/generation/toolchain receipts | Actual reviewed existing contracts and bytes remain prerequisites. Build receipt is produced by the updated real build phase, never handcrafted source output. |
| Explicit private profile | Existing manually staged profile/assets/lock and actual `profile-verified-KEY.json` byte proof required. Ordinary unpatched failures remain failures; no automatic RAC/SDK staging/fallback/registration. |

The child report (`wp13-family-observations-v1`) binds inputSHA256, run/key/candidate/
family/profile/variant/attempt, build/installed/browser/plan digests, actual browser
version, server lifecycle, bounded logs, failures/cleanup/truncation/error counts and
the exact expected nonempty case set. Parent validates actual metrics, not just
`status: observed`. Reports are smoke evidence only if future execution succeeds.

### Narrow authored observations

- **Vite:** mounted real rows, accepted search reflected in row11/old-row removal,
  then actual computed Tableweave grid/gap/CSS or zero headless styles. Production
  request observations reject source-runtime requests; no sort/drag adapter used.
- **Next:** neutral raw HTML versus actual RSC/Flight content type/payload; two real
  boundaries with independent pagination and genuine hide/show reattachment; separate
  no-store headless GETs. Optional negative variant reaches the real existing
  force-dynamic callback-prop route, not a shape error or any500 shortcut.
- **Start:** concurrent actual Alpha/Beta cookie contexts, distinct real bootstrap
  canaries with fully consumed HTTP bodies; neutral no-JS DOM; real two-domain
  hydration and accepted transaction query while inventory/Beta remain independent.
  No debug counter is invented: **fresh-read count is explicitly not proved**.

No duplicate33-play/WP12 product matrix, fake P/certificate, handwritten route tree,
old G-04 inheritance, complete retained scheduling/stream/abort/late-ABA/security
claim or Safari/mobile/AT/manual/performance claim follows. Real generation/build/
archive/HTTP/browser/SSR/hydration/negative/dual/profile/consumer execution remains
FINAL and UNRUN. The adapters now contain the required call path, not proof it passes.

## Source-only verification and handoff

[Positive config](tsconfig.light.json) extends the preserved strict source config;
it compiles the three original public TS positives plus a
[Playwright public-API positive probe](fixtures/playwright-positive.ts). The probe
checks real installed method/option typings without invoking them. **Runtime MJS is
untyped**; this does not type-check its semantics or prove consumer-local execution.
[Adversaries](runtime-source.test.mjs) and their [owned child fixture](fixtures/owned-process.mjs)
are authored FINAL-only/UNRUN: nonzero process, occupied port, bounded cleanup debt,
empty/stale/variant/overflow/error reports, output escape, false RSC500, missing
native/browser approval, output overwrite and actual Node POST Request bridging.
Rejection-only synthetic metadata never serves as a positive main/producer grant.

- [format-001](evidence/format-001/results.json) succeeded (17 files), with two
  `innerText` warnings in its [raw log](evidence/format-001/biome.log). They were
  manually changed to null-safe `textContent`; no unsafe/suppression flag was used.
- [light-001](evidence/light-001/results.json) passed syntax, strict positive TS6
  and static at that earlier body state; it is not silently reused after later edits.
- [format-002](evidence/format-002/results.json),
  [light-002](evidence/light-002/results.json), [biome-001](evidence/biome-001/results.json)
  and [inputs-001](evidence/inputs-001/pin.json) passed/verified at their capture state
  (1,282 inputs/1,244 program files). Final review strengthened **only** this new
  static procedure from textual executable-guard matching to actual AST guard/call
  validation, including all three families' inert top-level declarations. Production
  source did not change in that verification correction. The old new-pin bytes and
  attempts are retained; their evidence/README inputs are not mislabeled unchanged.
- Final fresh [format-003](evidence/format-003/results.json),
  [LIGHT replay](evidence/light-003/results.json), [Biome no-write](evidence/biome-002/results.json),
  [current input pin](evidence/inputs-002/pin.json) and [follow-up seal](evidence/seal-001/seal.json)
  record their actual statuses/identities. The current pin has its own capture time
  and source set, not the historical1,179-input signature with five changed bodies.

Commands from primary (only evidence procedures, no runtime helper/CLI import):

```text
node tests/consumers/wp13-runtime/evidence/check.mjs format format-003
node tests/consumers/wp13-runtime/evidence/pins.mjs capture inputs-002
node tests/consumers/wp13-runtime/evidence/check.mjs light light-003
node tests/consumers/wp13-runtime/evidence/check.mjs biome biome-002
node tests/consumers/wp13-runtime/evidence/pins.mjs verify inputs-002
node tests/consumers/wp13-runtime/evidence/seal.mjs capture seal-001
node tests/consumers/wp13-runtime/evidence/seal.mjs verify seal-001
```

[Check runner](evidence/check.mjs), [pin procedure](evidence/pins.mjs) and
[seal procedure](evidence/seal.mjs) preserve unique attempts/raw outputs. Never
recapture existing labels or original maps. Capacity guard128MiB remains active;
no drive relocation, cleanup, install, native provisioning or deletion was performed.
Main owns docs/TASKS/REVIEW/Git/dependencies/root commands and independent review/
replay before preservation. All runtime semantics, genuine framework behavior,
real-consumer/CI/manual/performance and complete WP13/G-05 acceptance remain open.
