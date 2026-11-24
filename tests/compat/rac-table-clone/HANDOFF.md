# Candidate clone-only assets — ready for independent asset review

This allocation constructed assets only. No shipping/runtime-profile approval,
package registration/allowlist/export, install, shared build, vendor mutation,
Git operation, model/renderer/core edit or agent delegation occurred. Earlier
private experiments/cases/reports remain immutable historical evidence.
The user selected the temporary private/prerelease profile direction, conditional
on independent review and genuine packed-consumer tests. This does not extend the
asset-only lease or grant stable/legal/manual/G05/personal PR acceptance.

## Delivered scope and counts

- Six candidate assets under `packages/heroui/compat/rac-table-clone/`:
  runtime.patch, profile.json, verify.mjs, README.md, NOTICE-RAC,
  LICENSE-APACHE-2.0.
- Six owned test/handoff files here: fixtures.mjs, verify.test.mjs,
  registry-proof.mjs, README.md, SHA256SUMS and this handoff.
- SHA256SUMS checks ten asset/harness inputs (not itself or this narrative).
- Forty-two Node built-in tests pass: two positive test-double cases and forty
  safe negative cases. Five scoped JS/JSON Biome inputs pass.
- Separate pinned-registry byte proof passes for all three genuine runtime
  formats, including newly checked CJS patch/application parity. No vendor code
  was imported or executed; this is not CJS runtime or browser acceptance.

## Exact commands run

From `/tmp/opencode/tableweave-wp08`:

```sh
node --test tests/compat/rac-table-clone/verify.test.mjs
node tests/compat/rac-table-clone/registry-proof.mjs
pnpm exec biome check packages/heroui/compat/rac-table-clone/verify.mjs packages/heroui/compat/rac-table-clone/profile.json tests/compat/rac-table-clone/fixtures.mjs tests/compat/rac-table-clone/verify.test.mjs tests/compat/rac-table-clone/registry-proof.mjs
sha256sum -c tests/compat/rac-table-clone/SHA256SUMS
```

Logs: `.artifacts/unit.log`, `registry-proof.log`, `biome.log`.
Structured byte proof: `.artifacts/registry-proof.json`; final guard/fingerprints:
`.artifacts/handoff-evidence.json`. Unit fixture data/digests are explicitly
coherent test doubles, not registry or patch correctness proof. Actual registry
bytes and genuine `patch --batch --fuzz=0 -p1` application are checked separately.
Both the archive and its metadata are fetched without an installer; archive bytes
stay in memory and system tar reads them through stdin. Only private fixture
copies are written, then removed. No tgz, vendor runtime or replacement table
implementation is shipped into a Tableweave package.

## Pinned upstream and runtime hashes

Exact registry tarball:
`https://registry.npmjs.org/react-aria-components/-/react-aria-components-1.22.1.tgz`.
Verified archive SHA-512 integrity:

`sha512-UTHaYHOaM71bOCjGPF50DcLywlrwAodE63IP64LB4kO+OizatQEL8TesVEOM8+TkBeSgHoflJ45388IlJfa7aw==`

Registry SHA-1: `abc446c527e1804673ac84d43a6909828d1e1724`.
Patch SHA-256: `f3073583972685a721995e0db935a5172cbbc777bcc679270a718a2f12736e35`.
Descriptor SHA-256: `a81cfea070c71cfff5623af41893da23601cfafe74cae765f08dcd2a90d443c6`.

| Runtime | Registry before SHA-256 | Candidate after SHA-256 |
| --- | --- | --- |
| Table.js | 93ef6ab34eb5da85006dc7615e76d2e52eb506114cb0a8a71d0a0f13f7f5152d | 4cbd2a4ba6e9a7e74082c497f3ec0c596c2048fb7d5f30c6e64176374091eacd |
| Table.mjs | aa49fcfc87cc494b97c6e77eb79e79b9dec6d13de9a0090ae249ee7683d32623 | 22edf3fc5423744d2682beadddac018332431bb3e9ebb33c8335d12c776035b6 |
| Table.cjs | ba44d79b191776374c4fdf998a38e8af4dd323665f3191627dca37f7400aa4cf | dc263287e3d9b966416c47818f3adbb7d6d058ce24ffde6b90b183dacbb28ead |

All three installed runtime baseline files equal registry bytes. The existing
declaration compatibility profile is unrelated: no assertion requires the whole
package to be unpatched. The proof restores each runtime format individually to
its genuine unpatched bytes and confirms E_VENDOR, then restores candidate bytes.

Only the actual boolean copy, prominent modification comments and removal of the
three terminal sourceMappingURL annotations are permitted by the exact byte proof.
Original maps remain present, unchanged and unreferenced; they are not regenerated.
Apache license bytes exactly match the existing root Adobe-attributed license.
Original runtime copyright/license headers are retained. No upstream NOTICE was
present in the inspected registry archive. No legal/publication acceptance claimed.

## Verifier and sanitized negative evidence

Explicit read-only CLI with one supplied project root; no enabled option or
callback/receiver port. Parsed JSON data is captured and validated, never merged
into executable options. It resolves from that root's own manifest, requires a
direct exact dependency and consumer-local isolated pnpm layout, verifies companion
assets/descriptor and all three runtime digests, and never executes vendor code.

Negative cases cover missing/corrupt assets/descriptor, unsupported schema/pins/
targets/formats, unpatched and mixed-format files, wrong vendor name/version,
parent/global/borrowed resolution, alias metadata and outside-consumer/file/asset/
manifest symlink escapes. Matching escaped file bytes do not bypass containment.
Each verifier rejection asserts unchanged fixture bytes/links, empty stdout and a
fixed error without raw paths/errors/content, for example:

`Tableweave RAC clone candidate profile verification failed: E_VENDOR.`

This verifies integrity against reviewed JSON/assets, not malicious-supply-chain
signing or backend authorization. The constructed isolated pnpm-shaped fixture is
not a genuine install. General npm/monorepo/Yarn layouts and hostile-process or
concurrent-filesystem defenses are not claimed.

## Frozen boundaries and exact next owner action

All137 candidate emitted JS/declaration/CSS files still match the historical
per-file manifest, aggregate
`0fa7dd24a8060f94b71e9dc872d2a835dfc48d3aa6da2eb5af5ca2ff98f46a6f`.
All1446 shared installed vendor files match the pre-experiment hashes. The earlier
private two-format experiment runtime bytes retain their recorded hashes; no
earlier profile was rewritten for this asset construction.

The bootstrap README requires extracting these files from the ACTUAL approved
styled archive into app-owned patches BEFORE installation. The current package
allowlist does not ship them. It documents explicit patchedDependencies and warns
that one version selector cannot stack this with a declaration patch. Main owns
any combined development patch and separate unpatched NodeNext public-declaration
lane, packaging/registration/install and genuine archive-profile production38.

Clone-only preserves the tested immutable NativeCollection owner/same-group-order/
visibility/current-row requirements. The broader raw cached Collection insertion
limitation remains; the traversal repair is excluded absent an actual supported
consumer reason. WP09 optional criteria proposals are not included.

Next: independently review these candidate assets and fail-closed resolver scope;
main owns the separately authorized shipping/registration/install and actual
consumer-profile proof for the selected conditional direction. No additional input
blocker was found within asset construction. No runtime-profile, current38, packed/full-WP08/G05,
setup-friction maintainer acceptance, AT/device/performance or release approval.
