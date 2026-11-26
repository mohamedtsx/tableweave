# RAC 1.22.1 clone-only candidate profile

**Private candidate profile; consumer verification pending.**
`@tableweave/heroui` remains private/UNLICENSED. Its archive allowlist includes these
six assets, without a runtime import, postinstall or automatic consumer patch.
The user selected the temporary private/prerelease profile direction, conditional
on independent review and genuine packed-consumer tests. Main owns later packaging,
installation and archive/production verification/integration. Packaging the candidate
is not a completed consumer/runtime approval or publication.

## Repair and scope

`runtime.patch` targets exactly `react-aria-components@1.22.1` Table.js, Table.mjs
and Table.cjs. It copies the real `columnsDirty` boolean alongside the existing
TableCollection clone cache fields, preserving true and false. Nothing forces the
cache clean or changes node traversal, guards, DOM, prototypes or native pipelines.
Each changed upstream file carries a modification comment. Only its terminal
sourceMappingURL annotation is removed; original map files remain untouched and
unreferenced. There are no regenerated maps. CJS byte/application parity is a new
candidate check, not earlier ESM browser evidence or new CJS runtime approval.

Private experiments cover genuine current NativeCollection views with immutable
definition/controller ownership, same-group order, visibility/group pruning,
preferred row-header fallback, current same-ID records and StrictMode lifetimes.
Do not drop those requirements to accommodate a dependency. Internal
ControlledCollection/GroupColumn helpers are not public root exports. Broader raw
vendor cached `Table.Collection` insertion can still throw five cells/eight columns
with clone-only; it is not a demonstrated Tableweave public API claim. The broader
column-parent traversal repair is intentionally excluded absent a consumer reason.
WP09 optional criteria protocol proposals are not part of this asset.

## Explicit bootstrap, only after main approves an actual styled archive

The patch must exist **before dependency installation**. Do not locate it through
an absent `node_modules/@tableweave/heroui` installation or borrow a workspace copy.
First inspect the ACTUAL approved archive; do not copy assets from a workspace.
From the consumer project, using its approved archive path:

```sh
tar -tzf /path/to/actual-tableweave-heroui.tgz package/compat/rac-table-clone/profile.json
mkdir -p patches/tableweave-rac-table-clone
tar -xzf /path/to/actual-tableweave-heroui.tgz --strip-components=3 -C patches/tableweave-rac-table-clone \
  package/compat/rac-table-clone/runtime.patch \
  package/compat/rac-table-clone/profile.json \
  package/compat/rac-table-clone/verify.mjs \
  package/compat/rac-table-clone/README.md \
  package/compat/rac-table-clone/NOTICE-RAC \
  package/compat/rac-table-clone/LICENSE-APACHE-2.0
```

Keep all six assets together in that application-owned directory. Pin a direct
application dependency on `react-aria-components: "1.22.1"`. The proposed explicit
consumer `pnpm-workspace.yaml` registration is:

```yaml
patchedDependencies:
  react-aria-components@1.22.1: patches/tableweave-rac-table-clone/runtime.patch
allowUnusedPatches: false
ignorePatchFailures: false
```

These are bootstrap instructions, not permission for this agent to edit a consumer
or install anything. A pnpm version selector accepts one patch: **do not stack the
existing declaration patch under the same selector**. Main must separately own any
combined development patch. This asset changes no declarations. Keep clean,
unpatched NodeNext TS6/5.9 public-declaration consumers as a separate verification
lane; a workspace patch does not propagate through Tableweave tarballs.

After a separately authorized install in an isolated pnpm project:

```sh
node patches/tableweave-rac-table-clone/verify.mjs /absolute/path/to/consumer
```

## Read-only verifier and limits

The verifier reads JSON/bytes and uses createRequire from the supplied manifest
only for package-path resolution. It never imports/executes vendor runtime code,
applies patches, writes files, uploads data, persists state or accepts an enabled
boolean. It requires a direct exact dependency, a real local node_modules directory
and a consumer-local `.pnpm/<slot>/node_modules/react-aria-components` package.
It rejects parent/global resolution, aliases, borrowed node_modules and escaped
package/file symlinks. This is a deliberately narrow isolated-pnpm-project layout,
not a general monorepo/npm/Yarn resolver or a claimed installed-consumer matrix.

It validates descriptor structure/pins, the five companion asset digests and all
three installed runtime digests. It does NOT require the entire package to remain
unpatched: unrelated declaration profiles are outside its runtime-file check.
Failures are fixed safe error codes, without raw paths, errors or file contents.
This is integrity verification against the descriptor, not malicious-supply-chain
signing, backend authorization or a defense against a hostile Node process or
concurrent filesystem replacement. Review/trust the asset source independently.

Upstream registry tarball integrity and before/after SHA-256 values are in
profile.json. The registry archive is read in memory for proof; no installer or
vendor runtime executes. Constructed pnpm-shaped fixtures and byte application
proof are not genuine install, production-browser or archive-profile acceptance.

Remove/replace this profile only after an independently reviewed upstream fix or
other approved compatibility disposition passes the actual supported Strict,
order/visibility/current-row/lifetime cases and genuine archive consumers. Other
versions fail closed pending a new profile review. The selected private setup does
not grant stable/full G05, personal PR acceptance, manual AT/devices, performance,
legal/release or publication
remain unclaimed. See NOTICE-RAC and LICENSE-APACHE-2.0 for third-party attribution.
