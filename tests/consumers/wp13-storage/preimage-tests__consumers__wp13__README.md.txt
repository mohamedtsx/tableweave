# WP13 current-candidate archive driver — provisional source

TASK-021 / FR-01/16, AC-26/27, package portion of G-05. Main selected
`docs/planning/wp-13-implementation-plan.md` above supplied WP12 `8c39a4f` and WP11
`fb69232`. No worker Git operation establishes those supplied revisions. This is a
NEW additive harness, not accepted packed compatibility or a registered generation.
**Keep drag blocked.** No DnD/vendor repair, patch registration, backend activation,
WP10/G-02 waiver, publication, deployment or independent acceptance is included.

Only this subtree is worker-owned. Main owns TASKS/REVIEW/docs/root commands,
manifests, dependencies, Git, approval inputs and subsequent execution. Existing
library155, exports, old tests/consumers, private assets, raw failures/seals and
`CURRENT_PUBLIC_GENERATION=fc01` are unchanged. The historical180-versus199 result
remains historical; there is no rebaseline/re-sign/rebuild of an old producer.

## What is authored

- [Protocol and approval fields](protocol.json), [current surface/pins/matrix](matrix.json),
  [explicit CLI](cli.mjs). No CLI invocation, even help, occurred during authoring.
- Inert [boundary](lib/boundary.mjs), [receipts](lib/receipts.mjs),
  [generation](lib/generation.mjs), [archive](lib/archive.mjs),
  [installer](lib/installer.mjs), [inspection](lib/inspect.mjs) and
  [type-check](lib/types.mjs) helpers. Imports do not read argv, capture, spawn,
  write or run framework/application code. Helper MJS is **not type-checked**;
  syntax/static/Biome evidence is not a JS semantic or filesystem test pass.
- Actual public [headless](fixtures/headless.ts), [facade/details](fixtures/styled.tsx)
  and [13-runtime/13-type helper](fixtures/reordering-controller.ts) positives.
  LIGHT's [source-alias config](tsconfig.light.json) is deliberately not a packed
  consumer and runs only TS6. The [negative ledger](fixtures/diagnostics.json) is
  **authored/unverified**, including exact code/location expectations; no negative
  expectation, directive-removal or TS5.9 execution occurred.
- FINAL-only [plain imports](fixtures/pure-runtime.mjs),
  [resolution/bundle config](fixtures/default-bundle.mjs), [CSS](fixtures/styles.css),
  and [filesystem/parser adversaries](driver-filesystem.test.mjs). Their assertions
  are authored, **UNRUN**, not receipts of passing runtime or real archives.
- [Vite](families/vite.mjs), [Next](families/next.mjs), [Start](families/start.mjs)
  stage finite existing application/shared-source allowlists and bounded config
  adaptations, rather than another product matrix. All source bytes/manifests and
  generated config hashes must be independently main-selected. No WP12 app/matrix
  or permitting publication fixture is copied here.

Generation uses fixed `pnpm build` and `pnpm --dir packages/NAME pack
--pack-destination ABSOLUTE_OWNED_DESTINATION` argument lists, only in a fresh
main-provided real detached checkout whose **both dist roots are absent**.
The destructive existing build script is never called in primary/historical trees.
Source/config/compiler/profile inputs, real output paths/modes/sizes/hashes, actual
pnpm archive bytes/member maps, installed local files, compiler file lists, runtime
resolutions and actual bundle module/CSS output are linked by selected receipts.
No source-copy pseudo-emission, fake tarball or installed-root compiler exemption.

Tar validation is bounded gzip + ustar/checksum/header/type/mode/path/namespace/
duplicate/casefold-parent-collision/footer validation before **either** archive is
extracted or a consumer is written. Only0644/0755 regular files and0755 directories;
no links/devices/extension magic. Actual unsupported PAX/GNU extension output yields
`E_TAR_EXTENSION_HOLD`; no unrestricted `tar -x` fallback. Limits are parser-safety
bounds, not bundle/performance budgets. Ownership, canonical ancestor, exclusive
write/no-follow read, immutable map and repeated realpath checks are best effort,
**not an OS sandbox or hostile same-user/concurrent-race guarantee**.

## Future FINAL selection — not authorization to execute now

Main must select capacity/native provisioning and the exact phases, then supply:

1. Real canonical direct-child roots from `protocol.json`, no ancestor project,
   node_modules, Git or npmrc hazards. Producer is a new detached real checkout at
   the reviewed revision **including this intaken tooling**, not the old base alone.
   `producer-checkout.json` binds status `main-reviewed-fresh-detached-real-checkout`,
   root and full40-character revision to actual regular `.git/HEAD` and
   `request.selectedRevision`. No checkout/provisioning/Git is performed by this CLI.
2. Run `owner.json`: protocol `wp13-current-archives-v1`, run ID, owner `main`.
   `request.json`: protocol/run, `candidate=wp13-candidate-ID`, selectedRevision,
   `consumers.FAMILY-PROFILE.package`, and `nextCase=ordinary|rsc-negative`.
   `main-approval.json`: status `main-reviewed-final-selection`, run, requestSHA256,
   selected phases, tools, receipts, consumerLocks and the phase-specific fields
   below. These trusted-main local files are **not cryptographic signatures**;
   caller hashes/argv/gate presence cannot replace independent review.
3. Main-reviewed `producer-inputs.json` regular mode/size/SHA256 map, including every
   actual source/build/style-copy/config/profile/installed compiler/declaration input.
   Use actual canonical regular `node_modules/.pnpm/...` paths, not symlink spellings.
   Retain the original `library-source155.json` bytes (`bdfabded…`). Node24.22.0 and
   pnpm10.13.1 are provisioned by main in regular `tools/bin/node`, `tools/bin/pnpm`
   and `tools/node_modules/pnpm`; complete actual implementation maps belong in
   `toolchain-inputs.json`. Approval tools binds nodeSHA256/pnpmSHA256.
   `tooling-inputs.json` covers **every** non-evidence owned source file in both
   executing and producer trees. `tooling-runtime-inputs.json` pins the executing
   tree's actual TS6 parser implementation. Main hashes all input/predecessor
   receipts in `approval.receipts`; paths from arbitrary receipts are not trusted.
4. For each consumer, main reviews a standalone exact lock in
   `locks/FAMILY-PROFILE.yaml`, after actual archive identities exist. Package bytes
   are two-space JSON plus newline; no scripts/extra manifest keys/dependency names,
   ranges, duplicates, workspace aliases or substituted archives. Direct dependencies
   exactly match `matrix.json`, including **both local compiler declarations**.
   `approval.consumerLocks[KEY]` binds reviewed status/profile, both shared producer
   archive hashes (even headless-only), packageSHA256/lockSHA256/npmrcSHA256/
   workspaceSHA256. Frozen scripts-disabled installs only; no forced peers,
   automatic resolution, source aliases, unfrozen retry or fallback profile.
5. Selected ordinary preparation creates an exclusive owned marker/config/files
   receipt. Main independently reviews/hashes each output receipt before its next
   phase. Empty owned HOME user/global npmrc files, literal allowlist environment,
   tools-only PATH, separate HOME/cache/store per key and `package-import-method=copy`
   keep ambient credentials/proxies/NODE_OPTIONS/NODE_PATH/root profiles out.
   Actual installed regular files and pnpm link topology are pinned; all compiler,
   standard-library, declaration, runtime and bundle resolutions must stay local.
   Each phase/key is single-attempt: failed files/logs/targets are preserved, never
   deleted, reused, overwritten or converted into pass. Main selects a genuinely
   new run identity for a retry, not a changed expected hash on the old target.

Future invocation shape, **do not run until separately authorized**:

```text
WP13_FINAL=1 /tmp/opencode/wp13-tools-ID/bin/node tests/consumers/wp13/cli.mjs --run ID --phase PHASE --family FAMILY --profile PROFILE
```

The actual Node binary must match the main-approved owned toolchain. All four pairs
are mandatory; no default phase or help action. Main stages approvals between
processes, not during one phase; control-file replacement within a phase fails.
`generate`/`inspect` are one shared pair per run (select `headless/ordinary`);
other phases are per family/profile. Candidate provenance is never public-generation
registration. Root reconciliation, obsolete styled DataTable-absence guards and
publication remain main-owned after actual proof.

## Independent profiles and phase-specific holds

| Phase / lane | Required selection and honest boundary |
| --- | --- |
| generate → inspect | Fresh detached producer/dependencies, complete tool/config/source maps, actual one archive per package; main reviews generation receipt before inspect. Inspect links real emitted/archive closure, JS/declaration graphs, directives, styles and helper names; not runtime acceptance. |
| ordinary prepare → install | [Ordinary descriptor](profiles/ordinary.json). Minimal headless and Start install **no styled archive/UI/Tailwind**; styled/Next install the actual pair. Strict peers/unpatched failures remain red and retained. |
| explicit profile prepare | Intentionally holds `E_HOLD_PROFILE_REQUIRES_MAIN_MANUAL_STAGING`. Main manually supplies separately owned source/config/asset/lock preparation and approved `consumer-prepared-KEY.json` plus `profile-assets-KEY.json` status `main-manually-staged-and-reviewed`, profile/key/nonempty files. Exact `selectedWorkspace()` and `ordinaryNpmrc()` bytes are required; no hooks/extra registrations. No assets are auto-staged/patched. |
| RAC profile install/verify | [RAC descriptor](profiles/rac-runtime.json): six actual archive assets, five companion hashes, three exact before/after runtime hashes. Main stages assets from the **inspected real archive**, independent store/files and frozen registration. After-map, independent ordinary-before map, actual installed local runtime bytes/nonshared inodes and packaged verifier are required. Do not stack the root declaration patch under this selector. Grouped/Strict browser remains UNRUN. |
| Start SDK profile install/verify | [SDK descriptor](profiles/start-sdk-declarations.json): two separate SDK declaration patch selectors/assets + MIT notice and reviewed package extensions. Not headless archive content or SDK runtime repair. Main supplies declaration AFTER map and exhaustive selected-SDK runtime-unchanged map; ordinary unpatched failures are not recolored. |
| types | Main selects ledger digest and status `main-reviewed-authored-expectations-not-executed`. Actual local TS6.0.3/5.9.3: positive → expected directives → independent copied directive-removal files → positive, plus canonical compiler input maps before/after. Missing/empty/unparsed/unrelated diagnostics fail;2307 is only the exact intentional private-path case. Expectations are not compiler-confirmed yet. Immutable archives/positive files are never edited for removal. |
| bundle / family-build | Separate `native-inputs-KEY.json` status `main-reviewed-provisioned-local-native-files`, key and nonempty actual local native file map. CLI does not provision native engines or run install lifecycle. Actual minimal resolution/import/bundle code inspects local paths/modules/CSS/chunks, not a fabricated source grep or invented budget. |
| family stage/build | `approval.familyInputs[FAMILY]` selects actual allowlisted source/declaring manifests; `familyConfigSHA256[FAMILY]` selects bounded config bytes. Corrected current Start parent/debt source is used, not superseded partial-Start report text. Standard Start Vite plugin must **generate** routeTree; no handcrafted tree. Main selects actual Start `familyOutputRoots.start` from `dist`/`.output`; absent/unknown output is a hold/failure. Vite/Start whole-app dual typing follows real generation/build, never LIGHT. |
| family-runtime | All three adapters explicitly throw an `E_HOLD_*` for the separately selected actual HTTP/Flight/stream/browser/native runner. No false functional-family pass. Strict serialized port6575, no reuse. Next RSC-negative route has a function prop spread into the real client boundary; TS shape success is not serialization proof. Actual HTTP/Flight framework rejection, Start two-domain request/stream/hydration and browser/retained scheduling remain UNRUN. |

Filesystem adversaries are FINAL-only `node --test` source (also gated by
`WP13_FINAL=1`), not part of LIGHT. They create tiny explicitly adversarial data in
owned `mkdtemp` roots, never positive application authority/producer receipts. No
cleanup, shared npmrc mutation or massive hostile archive fixture. Their unrun
coverage includes target/Git/ancestor/dangling-link/regular-file/owner/config/hash
substitution, root-hoisted resolution, shared mutable profile bytes, tar/path/
checksum/type/mode/empty identity, poisoned ledgers and historical-generation argv.

## LIGHT evidence and preservation

The immutable [before map](evidence/before.json) captured **2,286 old regular files**
and actual modes before source authoring; [canonical155](evidence/source155.json)
retains the original digest, and [initial installed map](evidence/installed-before.json)
captured14 actual compiler/type/formatter entry inputs. It is **not** an initial
whole-installed-tree pin. The later positive input pin captures the actual full
listed compiler/declaration graph and exact tool/settings/source inputs at its own
capture time; it does not retroactively strengthen the initial14 map. No old whole-
tree/raw producer seal was recomputed or represented as current.

- [Scope procedure](evidence/scope.mjs), [static-only assertions](evidence/static.mjs),
  [LIGHT/format runner](evidence/light.mjs), [input pin](evidence/inputs.mjs),
  [handoff seal](evidence/seal.mjs). Only these explicitly owned evidence procedures
  run now; none imports the CLI or production helpers.
- [format-001](evidence/format-001/results.json) failed: Biome treated the helper name
  `describe` as a test callback and flagged a control-character regex; code was
  renamed/rephrased, not suppressed. Raw [log](evidence/format-001/biome.log) retained.
- [light-001](evidence/light-001/results.json): syntax and strict positive TS6 passed;
  static failed because its own parser treated `.ts` as JS. Fixed the parser mode,
  not public APIs or dependency declarations. Raw [positive](evidence/light-001/positive.log)
  and [static](evidence/light-001/static.log) logs retained.
- [format-002](evidence/format-002/results.json) and
  [light-002](evidence/light-002/results.json) passed at their recorded earlier source
  state. Later edits require fresh passing labels; those receipts are not silently
  reused as current proof.
- `format-003` refused at the capacity guard before creating its attempt directory:
  observed free space102,400,000 bytes, below134,217,728. There is **no format-003
  artifact/raw log**; the [recovery note](evidence/recovery.json) is a retrospective
  record of the prior terminal refusal, not an invented contemporaneous receipt.
- Recovery authorization retained the same new-only lease; supplied main frame is
  `feat/wp-13-archives`, last committed `96b111e` plus main bookkeeping WIP, not
  worker Git output. Main reported the restored HDD mounted at `/mnt/data` and a
  restarted server; this worker observed4,042,522,624 bytes free on the unchanged
  primary path before resuming. These observations do not establish which files
  caused the capacity change, and authorize **no relocation, cleanup or HDD use**.
  No project, worktree, dependencies or evidence was moved; immutable before maps
  and all prior attempts were retained. The interrupted modal supplied no permission.
- [format-004](evidence/format-004/results.json) passed full scoped Biome with assist
  disabled (30 files,15 formatted); [light-003](evidence/light-003/results.json)
  passed19 syntax checks, strict positive source TS6 and static checks after those
  later edits. No feature expansion or public-library/dependency seam repair was
  performed during recovery.
- Final current-input capture is [positive-inputs-001](evidence/positive-inputs-001/inputs.json),
  with its actual positive-program [file list](evidence/positive-inputs-001/list-files.log).
  Its capture time is **after** the initial14-input map, not an initial whole-installed
  tree claim. [Pinned LIGHT replay](evidence/light-004/results.json) and
  [no-write full Biome replay](evidence/biome-001/results.json) record the final checks;
  the raw [positive](evidence/light-004/positive.log), [static](evidence/light-004/static.log)
  and [Biome](evidence/biome-001/biome.log) outputs preserve their actual statuses.
  The [aggregate source/evidence seal](evidence/source-seal-001/seal.json) covers the
  final authored files, attempts, original before maps and current input pin.
  Input and seal verification are read-only; actual counts/digests are in their maps
  and verification output, not a replacement signature on historical evidence.

Recovery/final commands (run from `/tmp/opencode/tableweave-wp11-workbench`):

```text
node tests/consumers/wp13/evidence/light.mjs format format-004
node tests/consumers/wp13/evidence/light.mjs light light-003
node tests/consumers/wp13/evidence/inputs.mjs capture positive-inputs-001
node tests/consumers/wp13/evidence/light.mjs light light-004
node tests/consumers/wp13/evidence/light.mjs biome biome-001
node tests/consumers/wp13/evidence/inputs.mjs verify positive-inputs-001
node tests/consumers/wp13/evidence/seal.mjs capture source-seal-001
node tests/consumers/wp13/evidence/seal.mjs verify source-seal-001
```

Do not recapture existing labels. Main's read-only replay may verify the existing
pin/seal; a further owned LIGHT attempt needs a genuinely new label. Scope results
continue to protect2,286 original regular files plus canonical155 and14 initial
installed inputs; only disclosed main-owned `TASKS.md` bookkeeping drift was observed
in recovery checks. This is a **provisional sealed source/LIGHT handoff**, pending
main's independent source/API/delta review and replay, not author acceptance.

Replays use `node tests/consumers/wp13/evidence/light.mjs ACTION FRESH-LABEL`
(`format`, `biome`, `light`), `inputs.mjs capture|verify positive-inputs-NNN` and
`seal.mjs capture|verify source-seal-NNN`. Formatter runs full scoped Biome check
with assist disabled and formatter enabled; source-only TS6 uses the explicit
positive config. Attempt directories/pins/seals are exclusive and immutable. Check
statfs before writes and stop below128MiB; no cleanup authority. Scope verification
discloses main TASKS/REVIEW/docs bookkeeping drift without re-signing any old map.

No install/build/pack/CLI/helper-unit/consumer/negative/dual/framework/config/app/
vendor execution, HTTP/browser/SSR/hydration, CI, manual/AT, performance, network
write, credential access or agent delegation is a LIGHT outcome. Main independent
review/replay, final-phase selection and all WP14/15/manual/real-consumer gates remain
open. This worker handoff cannot self-approve complete WP13 or change G-02.
