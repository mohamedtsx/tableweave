# WP13 fixed HDD source handoff — PROVISIONAL

TASK-021 / AC-26/27 / package G-05 filesystem provenance only. Supplied main base
`68bd197`, primary `/tmp/opencode/tableweave-wp11-workbench`; no worker Git
operation verifies that supplied revision. The [selected lease](../../../docs/planning/wp-13-hdd-storage-plan.md)
permits four existing MJS changes plus one new module and this new proof subtree.
Main retains Git/TASKS/REVIEW/plans/manifests/lock/dependencies/public exports and
all actual phase/namespace allocations. **No HDD directory/data, helper/CLI/test,
build/pack/install/runtime/browser/network, mount/move/delete/cleanup or dependency
operation has been performed by this writer. Drag/G-02 stays blocked.**

**Implementation STOP / unresolved additional production seam:**
`tests/consumers/wp13/lib/runtime.mjs:runFamily()` catches failed post-child
`revalidate(ctx)`/`installed(ctx)` checks, then unconditionally inventories
`tree(path.join(target,"wp13-runtime"))` through its cached target (lines404–408).
If the consumer was replaced, that read happens AFTER the identity failure was
observed. The issued run getter prevents the subsequent unsafe receipt write but
cannot intercept a cached raw string passed to the frozen helper. This is a
deterministic caught-failure path, not a claim of hostile same-user race defense.
Closing it requires an explicit additional lease for that function's postflight/
inventory failure path, or main's disposition before any affected HDD runtime
phase. This writer has **not edited that frozen file**, added a bypass/false pass,
or silently weakened the contract. The five-module source is provisional and is
not claimed to close the complete requested confinement outcome.

## Actual source contract

The single inert [storage-roots module](../wp13/lib/storage-roots.mjs) owns both
layouts, exact parsing, issued-context WeakMaps, physical/control checks, fixed
scratch derivation and filesystem provenance. Existing four production deltas:
[CLI](../wp13/cli.mjs), [boundary](../wp13/lib/boundary.mjs),
[generation](../wp13/lib/generation.mjs), [installer](../wp13/lib/installer.mjs).
Only [current protocol](../wp13/protocol.json) and the stock
[README follow-up](../wp13/README.md#fixed-hdd-layout-follow-up--source-only-not-old-result-replacement)
change outside those production modules. All other old regular inputs are checked
against the actual pre-edit map, not an inferred Git diff.

The exact ordered eight arguments stay legacy SSD. Only terminal `--storage hdd-v1`
adds two arguments. Unknown/duplicate/reordered/incomplete/root selectors reject;
there is no `--storage legacy-ssd` alias, environment/cwd root selector, fallback,
help action or default phase. Legacy direct-child external checks remain; legacy
controls with a `storage` field now explicitly reject cross-layout confusion.
Legacy contexts are issued/frozen and control bytes are captured once rather than
recaptured after parsing. This is an intentional internal tightening, not a claim
that old records had HDD confinement or new fields.

HDD namespace is ONLY `/mnt/data/Projects/tableweave-final-verification-ID` with
the old lower-case safe ID regex. Its derived roles are `wp13-run-ID`,
`wp13-producer-ID`, `wp13-tools-ID`, and `wp13-consumer-ID-FAMILY-PROFILE` inside
that namespace. Ten valid consumer keys: six ordinary families, styled/vite-styled/
next RAC and Start SDK. No caller root, JSON redirect or copied alleged context
can authorize an HDD external target. The namespace and all three0700 role
directories must already exist; ordinary consumer must be absent including a
dangling link. No provisioning at import/parse/load occurs.

Canonical nonsymlink components and project/config-free ancestors include `/`,
`/mnt`, `/mnt/data`, `/mnt/data/Projects` and namespace. Ancestors require root or
effective-UID ownership and no group/world writes; namespace and roles require
effective UID and0700. `.git`, package/workspace/lock/npmrc/node_modules ancestor
markers are not waived by a lease marker. Producer remains the sole allowed Git
role; actual `producerInputs()` still requires a real Git directory, regular
detached HEAD, exact40-character selected revision, unchanged canonical155 map,
full compiler/build/config inputs and genuine owned Node24.22.0/pnpm10.13.1.

Issued HDD root getters recheck all role identities and captured controls whenever
a frozen helper obtains `ctx.run`, `ctx.producer` or `ctx.tools`. All physical
roles/observed consumers/scratch and control hashes/stat stamps are also checked
before/after phases/children. Child postflight precedes child-log writes; CLI
failure logging first revalidates and retains primary plus guard failures in an
AggregateError if logging is unsafe. Frozen runtime's catch cannot write through
a lost HDD run getter. This is best effort under exclusive trusted-main ownership,
**not a hostile same-user/concurrent-race OS sandbox**.

## Complete new layout/control schema

The [strict Node-only source schema probe](schema.ts) names the actual new fields;
its [compiler config](tsconfig.json) uses installed TS6.0.3, Node24.19.2 types,
ES2022/NodeNext, strict/noEmit/no incremental/skipLibCheck=false. It does **not**
type-check MJS or supply ambient declarations pretending those helpers are typed.

No executable approval example is filled in. The following is a **BLOCKED /
UNSELECTED schema template**, not an actual main-reviewed lease or successful run:

```text
Template status: BLOCKED/UNSELECTED; namespace/ID/revision/hashes/stats = NOT ALLOCATED

namespace/storage-lease.json:
  schema: "wp13-storage-lease-v1"
  status: "main-owned-new-namespace" ONLY after actual main allocation/review
  layout: "hdd-v1"
  run: actual safe ID
  candidate: "wp13-candidate-ID"
  uid: actual effective UID (nonnegative safe integer)
  selectedRevision: actual reviewed detached 40-lowercase-hex revision
  producerInputsSHA256: actual SHA256 of run/producer-inputs.json
  toolingInputsSHA256: actual SHA256 of run/tooling-inputs.json
  toolingRuntimeInputsSHA256: actual SHA256 of run/tooling-runtime-inputs.json
  toolchainInputsSHA256: actual SHA256 of run/toolchain-inputs.json
  roots:
    parent: "/mnt/data/Projects"
    namespace: "/mnt/data/Projects/tableweave-final-verification-ID"
    run: namespace + "/wp13-run-ID"
    producer: namespace + "/wp13-producer-ID"
    tools: namespace + "/wp13-tools-ID"
    consumers:
      headless-ordinary: namespace + "/wp13-consumer-ID-headless-ordinary"
      styled-ordinary: namespace + "/wp13-consumer-ID-styled-ordinary"
      styled-rac-runtime: namespace + "/wp13-consumer-ID-styled-rac-runtime"
      vite-headless-ordinary: namespace + "/wp13-consumer-ID-vite-headless-ordinary"
      vite-styled-ordinary: namespace + "/wp13-consumer-ID-vite-styled-ordinary"
      vite-styled-rac-runtime: namespace + "/wp13-consumer-ID-vite-styled-rac-runtime"
      next-ordinary: namespace + "/wp13-consumer-ID-next-ordinary"
      next-rac-runtime: namespace + "/wp13-consumer-ID-next-rac-runtime"
      start-ordinary: namespace + "/wp13-consumer-ID-start-ordinary"
      start-start-sdk-declarations: namespace + "/wp13-consumer-ID-start-start-sdk-declarations"
  parent: {dev, ino, uid} from actual parent stat
  namespace: {dev, ino, uid} from actual namespace stat
  roles:
    run: {dev, ino, uid} from actual run stat
    producer: {dev, ino, uid} from actual producer stat
    tools: {dev, ino, uid} from actual tools stat

Binding B = {layout:"hdd-v1", leaseSHA256:actual lease file hash, roots:exact roots object above}
run/owner.json: existing protocol/run/owner="main" + storage:B
run/request.json: existing protocol/run/candidate/selectedRevision/consumers/nextCase + storage:B
run/main-approval.json: ALL existing reviewed fields from protocol.approvalFields + storage:B
  storageReceiptBindings:
    EVERY filename in approval.receipts: {leaseSHA256:B.leaseSHA256, sha256:approval.receipts[filename]}
  receipts: actual independently selected predecessor/input hashes (exact same key set)

After actual fresh ordinary prepare only:
Consumer binding C = {layout:"hdd-v1", leaseSHA256:B.leaseSHA256,
  root:exact derived consumer root, identity:{dev,ino,uid} captured after exclusive mkdir}
consumer/wp13-owner.json: existing protocol/run/key + storage:C
run/consumer-prepared-KEY.json: existing protocol/candidate/key/profile/archives/files/initialGenerated + storage:C
```

Lease/owner/request/approval and all selected input/receipt files must be owned
regular0600 single-link files. All physical IDs are nonnegative safe integers;
namespace and roles share the parent's actual device. Controls are read once into
plain JSON values; bytes plus identity/size/mtime/ctime stamps are captured and
rechecked (including byte-identical file replacement). Request/approval/owner
must match the exact lease hash/layout/roots. Four actual input-map hashes must
match BOTH lease and approval.receipts, and request revision/candidate match lease.
Main's `storageReceiptBindings` binds frozen predecessor schemas without editing
those frozen helpers; foreign SSD/other-HDD role references in selected receipt
keys or values reject. This is trusted local main selection, not cryptography.

New generation/installed/phase/failure receipts carry full storage provenance:
`{layout,leaseSHA256,roots,parent,namespace,roles}`. Prepared/owner records instead
carry C, pinning the actual consumer inode and preventing arbitrary old marker
reuse. Later consumers, ordinary comparison siblings and installed links resolve
inside the selected layout and checked owned identities. Frozen byte-only
predecessor schemas are NOT retrospectively claimed to contain these fields.

HDD-only scratch is run/home/KEY/.cache/tmp for TMPDIR/TMP/TEMP and .cache for
XDG_CACHE_HOME. Fixed home/key/cache/tmp directories are created privately only
inside an already selected phase after lease and capacity checks and are pinned
before children. Generate and installer both prepare them; missing/linked/unowned
scratch fails before execute. Legacy HOME/environment semantics stay unchanged.
Capacity uses the selected namespace/run filesystem, not literal SSD. Strict
ordinary scripts-disabled/frozen/ignore-workspace/copy/store config and profile
manual-staging holds remain; independent ordinary-before maps/nonshared RAC inodes
are not bypassed. New absolute archive/file:/npmrc/store/lock paths need NEW actual
receipts and main-reviewed lock identities. No automatic private profile repair.

## Authored guard tests — ALL UNRUN

[guards.mjs](guards.mjs) is inert on import and registers unskipped tests only after
a direct FINAL invocation plus a main-issued selection. It covers grammar/roles,
unknown/copied contexts, wrong lease UID/layout/revision/input/tool hashes, control
mutation/same-byte replacement, unsafe numeric metadata, observed parent identity
(stat-only unit adversary, no shared-parent mutation), role/consumer/scratch inode
swaps, all six ancestor markers, existing/dangling/linked targets, old-root receipts,
correct-device scratch/capacity and ordinary/profile sibling/unit-file separation.
Readonly load positives are filesystem lease tests, **not genuine producer/checkout,
archive/install/profile or application authority proof**. Fake `.git` is never a
positive real-checkout certificate. No backend/P permitting fixture is added.

Future command shape, **NOT SELECTED TO RUN**:

```text
WP13_STORAGE_GUARDS_FINAL=1 node tests/consumers/wp13-storage/guards.mjs --run MAIN_SELECTED_ID
```

Main must first review every test and separately allocate its tiny disposable
namespaces/roles/controls. The fixed selection file is
`derived namespace/guard-selection.json` with schema `wp13-storage-guards-v1`,
status `main-selected-disposable-guard-tests`, run ID, maximumMutationBytes32768,
and `cases[scenario]={run:exclusive safe ID prefixed by selected ID + "-"}`.
Every normal fixture requires precreated0700 roles, valid small selected lease/
controls and namespace `guard-fixture.json` exactly
`{status:"main-owned-disposable-rejection-fixture",run,scenario}`. Rejection-only
cases deliberately start invalid. Main must choose short IDs (48-character cap)
and provide all case names visible in the source. No provisioning/adoption occurs
automatically. Mutated/replaced data is retained; there is no cleanup. Unit file
ordinary/profile setup uses tiny `guard-unit.txt` files with `ordinary-before\n`
and `profile-after\n`, not vendor bodies. Real producer/consumer/archive/private
profile/native/browser proof remains a separately selected later phase.

## Preservation and source-only evidence

[Before map](before.json) captured2,886 old regular files/modes and1,179 actual
current pinned source/tool inputs at its recorded time, before production edits.
[Canonical155](source155.json) retains original SHA256 `bdfabded…`. Byte-exact six
preimages (original modes in the before map) include the [original README](preimage-tests__consumers__wp13__README.md.txt)
and four MJS/protocol copies named `preimage-tests__consumers__wp13__...` here.
All old regular map/seal/log bytes remain protected, including original137
`ca6706bd…`, runtime100 `6f65c028…`, API correction and current six-field alias fixes.
Old maps are not re-signed; leased body drifts and prior cumulative config drifts
remain historical. [Collector failure](capture-001-failure.json) records the first
missing formatter-link path; capture stopped before writing maps/preimages, then
used the actual canonical package-relative binary without installing anything.

[Evidence/scope](evidence.mjs), [AST assertions](static.mjs) and
[source check/pin/seal runner](checks.mjs) never import production helpers. Only
syntax/AST/full scoped Biome (assist OFF, formatter ON), strict positive noEmit,
actual compiler-file lists/pins and exact file-set seals may run in this lease.
Formatter lists supported code/config explicitly, excluding immutable preimages,
maps, raw logs and seals. Each fresh label is exclusive; failures are retained.
No source check is a filesystem test or MJS semantic/type-check. The schema probe
checks its own TS/Node API shape; original public positives check actual current
library source aliases, not emitted packages. Final counts/digests/statuses are
in appended results below and actual maps, never fabricated runtime receipts.

Known evidence-packaging limit for main's documentation review: the byte-exact
README preimage has a `.md` suffix and its historical relative links still resolve
from the old WP13 location, not this new preservation directory. It is linked and
unchanged, but is not portable current Markdown; a full documentation replay is
not claimed. No rename/delete/overwrite of that captured artifact was inferred to
fix packaging under the no-move/no-overwrite constraint. Main must disposition it
without rewriting historical source bytes or waiving link checks.

Source-only commands from primary (each fresh label once):

```text
node tests/consumers/wp13-storage/evidence.mjs scope
node tests/consumers/wp13-storage/checks.mjs format format-001
node tests/consumers/wp13-storage/checks.mjs light light-001
node tests/consumers/wp13-storage/checks.mjs pins pins-001
node tests/consumers/wp13-storage/checks.mjs seal seal-001
node tests/consumers/wp13-storage/checks.mjs verify seal-001
```

Capacity floor128MiB applies before source/evidence writes; no cleanup authority.
Main owns the full documentation replay and independent source/delta review, then
chooses actual HDD guard tests/namespace provisioning and each real materialization
phase. This handoff cannot self-approve WP13, G-05, full CI or stable/publication.

## Actual source results and next action

- Initial collector failure is retained as described above; successful pre-edit
  capture observed2,368,036,864 free SSD bytes,2,886 old regular files and1,179
  current pinned inputs. That is not a pre-edit whole-installed-tree claim.
- [format-001](format-001/results.json) and [format-002](format-002/results.json)
  exited0 but retained one optional-chain lint warning in each raw stderr. It was
  fixed manually, not suppressed or applied with unsafe fixes.
- [format-003](format-003/results.json) exited0: full12 supported files, two
  formatting updates, no remaining warning. Immutable JSON/maps/preimages/logs were
  excluded from formatting, never repaired/re-signed to obtain green output.
- [light-001](light-001/results.json) is the earlier source state. Current
  [light-002](light-002/results.json) and final pinned
  [light-003](light-003/results.json) each record13 exit0 commands: nine syntax
  checks, AST control-path assertions, strict Node schema positive, actual public
  source positive and full12-file Biome. Final two compiler stdout/stderr logs are
  empty; final Biome reports no fixes/warnings. `changedInputs=[]` and actual
  before/after source/tool snapshots are retained. **MJS remains untyped.**
- [Current pin](pins-001/inputs.json) captures1,186 actual inputs, including169
  schema-program and1,128 public-program reported files (overlapping graphs, not
  additive counts), at its own later capture time. Its SHA256 is
  `9dccacbd71ded152618006544c5deeeee49c65b37d43c32d6faf4b5893ca15b3`.
  Read-only `verify-pins pins-001` matched all1,186 entries after final light-003.
- [Historical disclosure](history-001/historical-disclosure.json) retains exact
  original137/100/1,179/1,282 map hashes and before/current differences rather than
  pretending they still seal current bodies: original137 had five prior body
  differences and now nine; runtime100 had one prior and now three. Original pin
  differences mirror those bodies. Runtime-only installed inputs not captured in
  the initial1,179 map are explicitly listed as `unavailableBefore`, not invented
  initial observations. Their actual later bytes still match the historical map.
- Current scope preserves canonical155 and2,886 old regular identities with only
  six leased existing-file body changes (four MJS + protocol/README), one new
  production module and this new subtree. The1,179 current-baseline pin has exactly
  those six disclosed body drifts; other1,173 pinned entries match. Main-only
  TASKS/storage-plan metadata drift is separately listed. No other production,
  type-alias config, manifest/lock/profile/app/test/output/seal change is made.
- The [final exact-file-set seal](seal-001/seal.json) covers the current seven
  leased production/data/doc paths plus this complete owned source/evidence
  subtree, excluding only the seal's own self-reference. Its actual count/digest
  is returned by the read-only verification command, not a self-referential claim
  embedded in this README.

Exact final continuation commands actually selected for source evidence only:

```text
node tests/consumers/wp13-storage/checks.mjs format format-003
node tests/consumers/wp13-storage/checks.mjs light light-002
node tests/consumers/wp13-storage/checks.mjs history history-001
node tests/consumers/wp13-storage/checks.mjs pins pins-001
node tests/consumers/wp13-storage/checks.mjs light light-003
node tests/consumers/wp13-storage/checks.mjs verify-pins pins-001
node tests/consumers/wp13-storage/checks.mjs seal seal-001
node tests/consumers/wp13-storage/checks.mjs verify seal-001
```

**Next action belongs to main:** independently review the five-module delta and
authored tests, disposition the frozen `runFamily()` post-failure cached-read seam
and raw Markdown-preimage packaging issue, and only then allocate any new source
correction or actual HDD guard phase/namespace. No affected runtime selection or
complete confinement/WP13/G-05 approval follows from these source passes. All
guard tests, real detached producer/owned tool/archive/current-lock/ordinary and
private consumer/native/framework/browser execution remain **UNRUN** here.

## Authorized review45 correction follow-up — source only

Main preserved this original producer as `af5ad20` before the user explicitly
authorized the two-function correction and exact raw-preimage packaging rename.
The STOP and packaging observations above remain original history, not current
claims of an unresolved allocation. [The separate correction handoff](../wp13-storage-correction/README.md)
owns new source checks/pins/seal and authored **UNRUN** regressions. The original
184-entry seal and1,186-input pin are unchanged historical bytes, NOT a current
file-set pass after this correction. Runtime/storage-root body changes, this
append/link change and the `.md`→`.md.txt` path change are disclosed separately.
The old raw Markdown path is intentionally absent; its bytes/size/mode remain
exact at the linked `.md.txt` path. No stub, alias, exclusion or target copies
replace the original51-finding documentation failure, which main preserved.
Only main performs the separately approved existing-parent permission operation;
this writer neither changes permissions nor creates HDD data. No test/helper/
runtime/materialization or WP13/G-05 approval is granted by this source follow-up.
