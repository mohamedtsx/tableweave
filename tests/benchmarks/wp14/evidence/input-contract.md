# Future external main inputs — all currently absent/HOLD

This is schema/receipt documentation, not a provisioned runner, generated checksum,
current archive or execution approval. `runner-input.schema.json` documents the
reviewed runner shape; `blocked.json` deliberately does NOT satisfy that shape.
Helpers manually validate inputs; no JSON-schema engine is installed or run now.
MJS is syntax/static checked, not semantically typechecked or executed.

`--inputs /ABS/main-selection.json` is a separately main-supplied trusted local file:
status `main-reviewed-wp14-final-selection`, owner `main`, nonempty reviewer, safe
run ID, selected phases build/validate/measure/report, and `{path,sha256}` references
`materialization`, `runner`, and (only after actual validation/review) `paintReview`.
No `approved:true` flag or environment variable substitutes for those predecessors.
These are independent-review trust inputs, NOT cryptographic signatures/OS sandbox.
Later immutable phase selections may add actual paint/predecessor review. Their
`buildSelection` path/SHA must reference the preserved original main selection;
run/materialization/candidate stay identical. The original selection is not edited
or re-signed to pretend the later paint review existed before validation.

Materialization status `main-reviewed-wp14-local-materialization`, owner main,
`root=/tmp/opencode/wp14-consumer-ID` (NOT an existing WP13 consumer), explicit
`profile=ordinary|rac-runtime`, `candidate`, `sourceRevision`, `dirtyState`, `wp13Root`,
and SHA references generation/publicInspection/archiveInspection/wp13Approval/installed.
Actual WP13 filenames/statuses are checked, not invented alternate archive records:
generation.json `emitted-and-packed-unapproved`, public-inspection.json
`static-package-inspection-only`, archive-inspection.json `inspected-not-runtime-approved`.
Producer-input/checkout/toolchain digests and actual emitted outputs are linked;
both real archive bytes are parsed with the preserved WP13 bounded parser and
member maps linked to installed package bytes/public exports. No extraction/build/
install of those packages by this driver. Historical CURRENT/fc01 is never rewritten.

`files` pins all main-owned consumer configuration/profile/ownership inputs including
package.json, pnpm-lock.yaml, pnpm-workspace.yaml, .npmrc, wp14-owner.json. Ownership
file binds run. Main supplies exact standalone manifest/lock with actual archive
pair file dependencies and pinned local peers/tools. Strict scripts-disabled config,
no root workspace inheritance/host modules/source aliases. `installed` references
status `main-reviewed-wp14-complete-installed-map`, root/profile/shared archive hashes,
`inputs` for EVERY regular installed file (including native/browser files) and `links`
for complete pnpm topology. Inventory is verified exhaustively, not just a whitelist.

Explicit RAC timing additionally needs `profileReceipt`: status
`main-reviewed-wp14-explicit-rac-profile`, root, actual styled archive digest,
actual assets/after maps and `ordinaryReceipt`/before map linked to a genuine WP13
ordinary `installed-not-runtime-approved` receipt for the same candidate. It never
applies a patch or falls back from ordinary. Runtime compatibility of either profile
is unproved; private-profile numbers cannot claim ordinary performance acceptance.

`fixtureFiles` is the exact24-filename allowed source map from main source intake,
mode/size/SHA256. Driver stages only the eleven finite frontend/config files into a
NEW wp14-source directory. `infrastructureRoot` and `infrastructureFiles` pin executing
tooling plus its two preserved inert WP13 parser/receipt helpers. `toolsRoot` and
`toolFiles` pin the owned Node24.22.0/pnpm10.13.1 implementation; current Node executable
must match, no borrowed root tool. `home` is a pre-provisioned consumer-local directory
with empty reviewed user/global npmrc; environment is literal allowlist, not inherited
credentials/proxies/NODE_PATH/NODE_OPTIONS. There is no install/provision subcommand.

Runner attestation is separately main-reviewed plus a hashed external scheduler/
capacity reservation binding run/image/four-CPU affinity, not self-attested quota.
Actual OS/architecture, CPU models/affinity/quota/memory limit, OS-release digest,
process names/load and browser executable/version/actual normalized launch arguments
are observed before each process samples. Process allowlist is an observation check,
not proof of host isolation; the reviewed reservation remains necessary. Image and
browser version are UNSELECTED now. No authority to download/provision/containerize.

All outputs need a new /tmp/opencode/wp14-run-ID, exclusive phase/session paths;
the input selection hash/candidate identity are recorded. No overwrite or reuse of
failed outputs, no deletion/cleanup of files. Only owned browser/server processes
are closed. Cleanup debt fails the phase and is retained. Reusing parser helpers
does not inherit WP13 compatibility approval; every actual runtime step remains FINAL.
