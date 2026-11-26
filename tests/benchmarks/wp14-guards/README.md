# WP14 guards correction — provisional SOURCE handoff

TASK-022 / AC-28 / review32n1/n2. Main selects the two-file correction plan in
`docs/planning/wp-14-guards-plan.md`; supplied HEADf60df08 is main-reported, not
worker Git output. Only existing `tests/benchmarks/wp14/candidate.mjs` and
`driver.mjs` may change; every other addition is in this NEW subtree. Original22
fixture/config/timing/statistics/README/protocol bodies, old maps/raw evidence,
all155 library sources, WP13/apps/profiles/assets/settings/manifest/lock/CURRENT
generation stay frozen. Main owns docs/status/Git/root commands/dependencies and
future actual candidate/hardware/execution selection. Drag/G-02 remains blocked;
dedicated runner/real consumer remain user-deferred, no provisioning request.

## Baseline and history

[before.json](evidence/before.json) captured2,675 actual old regular hashes/sizes/
permission modes BEFORE edits and verified canonical155. It includes original31
inputs aggregate1cd83de1…/117 raw aggregate68f1e557… and original1,335 pinned inputs.
Exact [candidate preimage](evidence/preimages/candidate.mjs.txt) and
[driver preimage](evidence/preimages/driver.mjs.txt) are immutable. Git/reference/
dependencies/credential-shaped files are excluded from the broad regular-file map;
actual declared/installed compiler/SDK/RAC files are separately pinned. Original
input and artifact receipts themselves are protected, not overwritten/re-signed.

The new guard discloses exactly TWO existing body changes, retains their modes,
and checks every other original seal/pin entry. Main TASKS/REVIEW/README/docs drift
is separately disclosed; no other WIP/worktree is inspected. Do NOT claim the old
31/117 all-hashes verifier passes against corrected bodies. The unchanged original
31/117/1,335 receipts describe their original producer, not current runtime proof.

## n1: packaged RAC closure, not arbitrary reviewed maps

The actual styled archive is already bounded-parsed/linked by the existing pair
loop. Its `package/compat/rac-table-clone/profile.json` supplies the profile being
validated; no root cached declaration profile is substituted and no verifier runs.
Canonical metadata is required: schemaVersion1, ID rac-1.22.1-table-clone-v1,
private-unlicensed-candidate/isolated-pnpm-project, upstream react-aria-components
1.22.1, three EXACT Table.js/Table.mjs/Table.cjs paths/formats/beforeSha256/afterSha256,
and five exact companion hashes. All six packaged assets (including profile.json)
must exist as regular archive members; installed patch assets must equal those
actual packaged bytes. No copy/staging/patch registration/install or vendor repair.

Current RAC realpath must be canonical consumer-local, actual package version and
direct manifest pin1.22.1. Explicit profile workspace is the exact isolated single
RAC runtime registration, NOT SDK/packageExtensions/root declaration stacking;
ordinary workspace remains exactly `packages: []`. `.npmrc` is an unambiguous
12-key allowlist with exact strict/scripts-disabled/isolated/copy values, absolute
store path, no unknown/comment/duplicate/override/interpolation keys. The literal
safe environment is retained. This is stricter conformance, not a compatibility pass.
Both consumer manifests allow only name/private/type/packageManager/dependency
groups, without duplicate dependency entries: no manifest pnpm/overrides/resolutions/
workspace/lifecycle registration can supplement the exact workspace rule. The
explicit-profile and ordinary npmrc store selections must differ.

The old sealed input-contract's generic maps now have required concrete closure:
`profile.assets` EXACT six `patches/tableweave-rac-table-clone/*` records;
`profile.after` EXACT three physical current RAC runtime paths relative to benchmark
root; `profile.before` EXACT three physical ordinary RAC paths relative to its derived
ordinary root. Mode/size/actual file SHA must match each record AND canonical before/
after descriptor SHA. An unrelated nonempty map cannot waive those checks.

Ordinary receipt is the genuine hashed `installed-KEY.json` in the SAME WP13 run,
with candidate/profile/status and only styled/vite-styled/next ordinary keys. Its
hash must be selected by WP13 main approval. Root is DERIVED as
`/tmp/opencode/wp13-consumer-${request.run}-${ordinary.key}`; no extra caller root
field. Ownership/package recipe/exact RAC version/archive pair/frozen lock/config
are checked. Complete ordinary installed bytes/link topology and every required
before file are verified against the actual receipt. Current/ordinary three runtime
files must have independent dev/inode identities and nlink1; ordinary identity/
mtime/ctime and control/installed bytes are fenced before and after inspection and
on revalidation. Reviewed maps are not a conformance waiver. Missing genuine ordinary
before bytes holds/fails closed, never fabricates unpatched timing or auto-falls back.

## n2: bounded owned cleanup, persistent debt

All production waits use fixed30,000ms per operation, outside sampling intervals.
`boundedOwnedWait` creates an immutable completed/failed/timeout decision. Later
settlement is consumed but cannot upgrade a timeout. `runOwnedCleanup` attempts
independent remaining steps and retains EVERY failed/deadline outcome, not a single
last-error field. A deadline proves neither private P purge nor browser/process/
connection termination. These are async transport/handle waits, not a new async P API.

Normal source-end and trace-start/end/completion/detach paths are bounded before
the finally block can be stranded. Finally independently attempts source-end,
outstanding preflight/trace cleanup and context close. Context failure/deadline may
try only its captured owned Browser.close handle; the original debt remains even
if fallback completes. HTTP close starts only on the locally created server;
closeIdleConnections/close callback are bounded, and safe owned closeAllConnections
+ another bounded callback wait are fallback attempts, NOT a success upgrade.
No BrowserServer.process invention, PID kill/pkill, ambient process/port cleanup,
file deletion or permission extension. Unresolved native resources stay HOLD/debt.

Original primary Error is retained; session and server debt receipts contain arrays
of attempts/debts, primary reason and explicit late-settlement limitations. A session
with any debt throws before another session or aggregate observations can succeed.
Successful session.json is written only AFTER cleanup has completed without debt;
failure samples/partial trace are retained with explicit failure statuses. Bounded
wait failure codes accept only E_* identifiers, not arbitrary sensitive error bodies.
These async deadlines cannot preempt a synchronously blocked JS/event loop.
Existing immutable attempt directories also block replay. Source/timing/paint marks,
scenario counts, sampling order, statistical thresholds and actual frontend code are
unchanged. Public API probes are [uninvoked source](api-probes.ts), not observations.

## Authored tests and allowed LIGHT

[guards.test.ts](guards.test.ts) has10 unskipped FINAL-only cases: wrong canonical
descriptor/version/set/hashes; missing/synthetic assets; partial/loose/wrong before/
after/ordinary maps; shared inodes; extra workspace/override config; timeout then
late resolution; multiple cleanup failures with original primary; missing trace
completion with independent detach; owned browser fallback retaining timeout;
never-returning HTTP callback with safe connection-close attempts. Numeric/fake
handles are explicitly UNIT_SYNTHETIC, not real profiles/native measurements/P grants.
All tests/helper imports remain UNRUN; original statistics cases are untouched and
remain included by the extended positive source config, not silently skipped.

```sh
node tests/benchmarks/wp14-guards/light.mjs FRESH_LABEL
node tests/benchmarks/wp14-guards/seal.mjs capture
node tests/benchmarks/wp14-guards/seal.mjs verify
# FINAL only after independent main selection, NOT run now:
node --test tests/benchmarks/wp14-guards/guards.test.ts
```

Own config extends the frozen strict source-light config without option relaxation.
TS6/noEmit/exact optional/noUnchecked/skipLibCheck:false check actual old/new TS
contracts and public Page/BrowserContext/CDP/HTTP close method signatures. MJS
implementations remain UNCHECKED JS; inference/AST/syntax/Biome is NOT semantic JS,
profile/hash materialization, helper/FS/deadline/native test proof. No generated
routes, vendor patches, dependencies or framework execution. Static guards inspect
real call nesting, exact canonical runtime paths, before/current/after fences and
bounded/debt call paths; they are not runtime conformance/cleanup certificates.

Initial light-001 passes strict TS6/static/syntax/scope, pins1,307 program files/
1,353 inputs, then fails formatting/template-style checks. Raw logs/statuses remain
under that fresh attempt. light-002 preserves two strict indexed-array errors in
the NEW adversaries; light-003 preserves an AST check's trivia-position comparison
error. Both were corrected, not ignored/cast away. light-004 is an intermediate
full SOURCE pass before the final manifest/profile-override rejection tightening.
Two formatter attempts are preserved; subsequent fresh attempts are recorded too.
See the [actual completion record](evidence/completion.md) for final commands,
counts, per-body/pin digests, scope/main drift and next-step limits. No result is
borrowed; `results.json` plus raw logs under each fresh label own actual outcomes.
New pins include actual packaged profile/companions/installed RAC files, original
1,335 entries with exactly two disclosed body drifts, and expanded current tool/SDK/
source inputs before/after. Immutable maps/preimages/logs are never formatted.

New `evidence/source.delta.patch` and `evidence/handoff-hashes.json` seal only this
correction and own raw evidence; old seals remain history. Capacity floor128MiB,
no cleanup/relocation/HDD use. No agents/Git/install/build/pack/emission/provision/
native/browser/server/HTTP/SSR/statistics/generator/oracle/benchmark/negative/dual/
consumer/CI/manual/performance/net writes/.repo/credentials or test/helper invocation.
Main independently reviews/replays before preservation. No author n1/n2 closure,
ordinary/private compatibility, hardware/paint/performance/G05/WP14/stable approval.
