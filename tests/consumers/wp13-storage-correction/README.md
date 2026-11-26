# WP13 review45 corrections — PROVISIONAL source handoff

TASK-021 / AC-26/27 / package G-05 filesystem confinement only. Main supplied
original producer `af5ad20` after independently matching184 sealed entries,
1,186 pins and canonical155. No worker Git operation verifies that revision.
The [selected narrow follow-up](../../../docs/planning/wp-13-hdd-storage-plan.md#review45--explicit-narrow-follow-up-authority)
and [review45n1–n4](../../../REVIEW.md#final-verification--review-session-45-provisional-hdd-source-intake)
authorize only the changes below. Main retains TASKS/REVIEW/plans/Git/exports/
dependencies/lock/manifests/permissions and actual phase/namespace allocations.

## Actual source delta

- [runtime.mjs](../wp13/lib/runtime.mjs): only `runFamily()`'s post-child/report/
  postflight/inventory failure handling plus its necessary `ownedConsumer` import.
  All other functions and pre-child preconditions/staging remain byte-identical.
- [storage-roots.mjs](../wp13/lib/storage-roots.mjs): only `consumerStorage()`.
  All other function bodies and layout/control/approval schemas remain fixed.
- Exact packaging rename of
  `wp13-storage/preimage-tests__consumers__wp13__README.md` to
  [the `.md.txt` path](../wp13-storage/preimage-tests__consumers__wp13__README.md.txt),
  plus link/append-only follow-up in the [original handoff](../wp13-storage/README.md#authorized-review45-correction-follow-up--source-only).
  No old-path stub, exclusion, alias or target copies. Original raw Markdown bytes,
  size19,096, mode0664 and SHA256
  `e426cdbdfda3e156f1f3393ba12bb7ba94b19260d6b1766efb837e9261d7c1ad`
  are unchanged. The original51-finding failed documentation output stays at
  `/tmp/opencode/final-hdd-source-intake-docs-001.log`; main owns the full replay.
- This NEW correction subtree only. Original guards, checks/evidence/static
  scripts, logs/maps/pins/seals/source155 and all other production/test/app/profile/
  dependency/type-alias inputs remain fixed. No protocol or stock WP13 README
  change was needed. Historical collectors are NOT rerun as current scope passes.

### Runtime failure behavior

The frozen `execute()` contract has exactly one classified ordinary logged child
failure, `Error("E_CHILD_FAILURE_RETAINED")`. That failure is preserved for trusted
failed-observation recording. Any other execute error, including a child+guard
AggregateError or unclassified filesystem/identity error, aborts immediately; the
function does not retry guards and resume cached reads if state later looks valid.

After execute, an explicit `revalidate(ctx)` and `ownedConsumer(ctx)===target`
boundary precedes report parsing. Postflight again establishes consumer ownership
BEFORE installed/build/native/browser/attempt reads. Any postflight error aborts
immediately without inventory or runtime-result write. Earlier child/report errors
and the actual later boundary/postflight error are both retained in an AggregateError;
without an earlier failure the original error is thrown unchanged. No `failure ??=`
silently loses secondary failures.

A final explicit boundary precedes inventory; another follows inventory before
the result receipt. Tree/receipt errors also retain a prior child/report failure.
When postflight is fully healthy, an ordinary failed child or invalid report still
records the existing `failed-runtime-observations` receipt and throws the original
failure. Successful result shape remains smoke-only, never completeWP13/G-05.
This tightens failure handling on both layouts without changing grammar, profile
selection, application/backend authority, report expectations or runtime preconditions.
It is not a hostile same-user/concurrent-race OS sandbox guarantee.

### Consumer physical-before-marker behavior

The main-approved prepared receipt's key/candidate/profile and storage layout/lease
hash/root/supplied binding are validated first. Physical identity/private owner/
device and any previously pinned identity are checked BEFORE marker capture.
Only then is owner protocol/run/key/storage equality checked. A second physical
check precedes pinning, and invalid metadata/marker never pins a new consumer.
`prepared.profile` is an existing receipt field; no new prepared protocol field or
approval schema was invented. Unknown/copied contexts still fail through the frozen
issuer checks. Other boundary callers remain unchanged, including their redundant
consumer validation.

## Authored tests — ALL UNRUN

[guards.mjs](guards.mjs) is inert on import. Only an explicit direct FINAL
selection registers tests. The unit mode extracts the actual authorized runtime
tail and actual consumer function from source, evaluating them with synthetic
dependencies. It imports NO production helper and does NOT certify a real issued
context/checkout/producer/archive/native/browser/family runtime or application
permission. Positive callback simulations are **UNIT-only**, not backend/P grants.

Authored unskipped cases cover child/report plus postflight failure retaining both
errors with no inventory/write; single postflight failure; healthy postflight with
ordinary child/report failure preserving failed receipts; boundary loss without
retry (including restored-looking state); unclassified/aggregate execute failures;
tree/receipt secondary errors; final guard loss; unchanged smoke-only shape;
new unpinned identity before marker sentinel; incorrect prepared/storage metadata;
prior pinned mismatch; invalid marker; post-marker loss and pin-only-after-validation.

Separate filesystem mode is a small **rejection-only** test for a newly issued
context whose approved consumer inode was already replaced. It instruments marker
metadata access and requires physical rejection first. Main must precreate a NEW
disposable namespace/roles/selected controls/prepared receipt and replacement, then
independently select this mode. This writer creates no namespace and runs no test.
The fixed namespace `correction-guard-selection.json` must be exactly
`{status:"main-selected-correction-rejection-fixture",run:ID,scenario:"new-context-replaced-consumer-before-marker"}`.
Main's tiny synthetic local controls are rejection-only filesystem data, never
real-checkout/archive or permitting application certificates. No test setup moves,
deletes, writes or provisions files. Main's later separately authorized fixture
phase owns any setup, including choosing an exclusive safe ID and actual lease.

Future shapes, **NOT SELECTED TO RUN**:

```text
WP13_STORAGE_CORRECTION_FINAL=1 node tests/consumers/wp13-storage-correction/guards.mjs --unit
WP13_STORAGE_CORRECTION_FINAL=1 node tests/consumers/wp13-storage-correction/guards.mjs --run MAIN_SELECTED_ID
```

## Source evidence and preservation

[proof.mjs](proof.mjs) is the NEW owned collector/check/pin/seal runner; it does not
import any production helper or old collector. [static.mjs](static.mjs) parses
source only, comparing frozen function bodies/pre-child code against exact new
preimages and checking physical/marker and guard/catch/inventory control ordering.
AST/syntax are not MJS semantic or runtime proof. **MJS remains untyped.**

[Before map](before-001/before.json) captures3,065 current old regular files/modes,
actual current pins, raw-preimage metadata and compiler graph snapshots before
production edits. Exact runtime/storage/old-handoff preimages are `.preimage.txt`
in that directory, avoiding live Markdown packaging. Original184-entry seal stays
SHA256 `56f5b96b67ba168b0d428e3b828e77a7ff40a7fe6651e684a0205cdc71ba961b`.
Its original path set is tied to `af5ad20`, NOT unchanged current after this rename.
New final disclosure enumerates its changed/missing current paths without editing
that old seal or pretending the original raw `.md` path still exists. Runtime is
additionally protected by the new preimage/current-old-file map; it was outside the
original184-file storage seal. Canonical155 and six-field source-alias correction
inputs remain untouched. New collector WIP changes to itself are explicitly
separated from frozen before-pin drift, never called an unchanged tool baseline.

Only syntax, AST, full supported-code Biome (assist OFF/formatter ON), two existing
strict positive noEmit configs and actual `--listFilesOnly` graphs/pins/seals run.
The configs are unchanged `wp13-storage/tsconfig.json` (Node schema) and
`wp13/tsconfig.light.json` (current public source); installed TS6.0.3 and original
compiler options/paths are used. Schema typing does not type-check unchecked MJS.
Formatter enumerates the twelve original supported files, runtime and new code,
excluding immutable preimages/JSON maps/raw logs/seals. Original input pins remain
historical; fresh pins record later actual capture times and full source graphs.

Source-only command shape (fresh labels; none is test execution):

```text
node tests/consumers/wp13-storage-correction/proof.mjs before before-001
node tests/consumers/wp13-storage-correction/proof.mjs format format-001
node tests/consumers/wp13-storage-correction/proof.mjs light light-001
node tests/consumers/wp13-storage-correction/proof.mjs pins pins-001
node tests/consumers/wp13-storage-correction/proof.mjs verify-pins pins-001
node tests/consumers/wp13-storage-correction/proof.mjs seal seal-001
node tests/consumers/wp13-storage-correction/proof.mjs verify seal-001
```

128MiB SSD capacity floor applies before evidence writes; stop, no cleanup.
**No HDD writes/stat/permission operation, CLI/helper import/test/runtime, install,
build/pack/tool acquisition/native provisioning/network/Git/agent operation occurs
in this correction authoring.** Main alone handles the approved parent mode change;
its physical receipt is separate, not an UNRUN guard-test success. Missing complete
owned pnpm JS tooling is not replaced by an ELF/stub/borrowed executable. Drag/G-02
stays blocked. Independent source review and separately selected filesystem guard
tests/materialization, WP13/G-05, full CI/manual/consumer/publication remain open.

## Actual source-only results

- [before-001](before-001/results.json): both pre-edit source graph listings
  exited0. Scope starts with3,065 old regular files, canonical155 and no drift.
- [light-001](light-001/results.json):13 syntax checks, both positive programs and
  Biome exited0, but AST exited1. The new checker selected the pre-child browser
  inventory rather than the corrected tail's inventory. Its actual stderr/status
  is retained. Only that locator was corrected to select after the `failure`
  declaration; no production contract/assertion was weakened to hide a defect.
- [light-002](light-002/results.json) and [light-003](light-003/results.json) record
  the later source-only passing states. All format labels001–004 are retained;
  final [format-004](format-004/results.json) passes full16-file Biome, assist OFF
  and formatter ON. No old preimage/map/log/seal was formatter-rewritten.
- [pins-001](pins-001/inputs.json) and its earlier1,191-entry verification are
  historical source capture. A final collector review added explicit pinning of
  the scope/AST data inputs (preimages/before map/original maps/raw renamed bytes).
  No old capture was overwritten or presented as the final collector state.
- Final [pins-002](pins-002/inputs.json) contains1,199 actual entries with SHA256
  `08658289ef702de433e20e4b41f8fd52cc727183cc593751707f3d6987cc21c9`.
  The unchanged Node schema graph reports169 files and public-source graph1,128
  files; graphs overlap and these are not additive counts. Both listing commands
  exited0 at their recorded capture times. After final replay, read-only
  `verify-pins pins-002` matches all1,199 hashes/sizes/modes.
- Final [light-004](light-004/results.json):17/17 selected source commands exit0
  (13 syntax, one AST, two strict positive noEmit, full16-file Biome). Both compiler
  stdout/stderr logs are empty; Biome reports no fixes/warnings. Full current
  input snapshots before/after are preserved with `changedDuring=[]`.
- Current scope has exactly two production body deltas, original handoff link/
  append delta and exact preimage relocation, plus this new subtree. The new
  before-pin map includes runtime's previously unpinned body and records those
  two production drifts explicitly. The collector's own initial WIP hash drift is
  separate (`newOwnPinDrift`), not an unchanged-before-tool claim. No main metadata
  drift was observed in these checks. All other old3,065-file identities and
  canonical155 match, subject only to that precise authorized delta.
- The [new exact correction seal](seal-001/seal.json) covers current two production
  files, original-handoff follow-up, relocated raw preimage and this complete new
  source/evidence subtree (excluding only its self-reference). The accompanying
  [original184 disclosure](seal-001/historical184-disclosure.json) identifies changed
  and relocated paths while preserving the original seal bytes and producer truth.
  Actual seal count/digest is returned by read-only verification, not embedded here
  as a self-referential signature. Original storage `checks.mjs`/`evidence.mjs`/
  `static.mjs` and original guards were neither changed nor executed.

Exact final continuation commands (source evidence only):

```text
node tests/consumers/wp13-storage-correction/proof.mjs format format-004
node tests/consumers/wp13-storage-correction/proof.mjs pins pins-002
node tests/consumers/wp13-storage-correction/proof.mjs light light-004
node tests/consumers/wp13-storage-correction/proof.mjs verify-pins pins-002
node tests/consumers/wp13-storage-correction/proof.mjs seal seal-001
node tests/consumers/wp13-storage-correction/proof.mjs verify seal-001
```

**Next:** main independently reads the two function deltas, all authored cases and
new evidence, verifies the current seal/pins and replays documentation. Main then
separately allocates any independent unit/real filesystem guard phase and exclusive
NEW namespace. This is a source correction handoff, not self-review acceptance or
runtime closure of review45n1/n3. All tests/helpers/CLI/runtime/materialization
remain **UNRUN** by this writer; original failed documentation evidence stays exact.
