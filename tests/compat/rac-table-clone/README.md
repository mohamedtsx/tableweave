# Clone-only candidate asset checks

Run from the repository root; Node built-ins only, with system `tar`/`patch` for the
explicit registry byte proof. No dependency install, library build or vendor runtime
execution. All fixture writes are confined to this directory's ignored `.artifacts`.

```sh
node --test tests/compat/rac-table-clone/verify.test.mjs
node tests/compat/rac-table-clone/registry-proof.mjs
```

The unit fixtures deliberately use coherent descriptor/runtime **test doubles**
with vendor-execution sentinels. They prove safe read-only validation and rejection,
not upstream provenance or patch semantics. Their temporary directories are owned
and removed by each test. Negative checks assert exact fixed errors, no raw paths,
and unchanged fixture bytes/links.

The separate network-enabled proof fetches pinned registry metadata and the exact
archive in memory, validates SHA-512 integrity/SHA-1, compares all three installed
runtime files to either all exact originals or all reviewed profile outputs (mixed
or unknown formats fail), and invokes genuine `patch --fuzz=0` on a
private copy of the three actual files, their original maps and actual package
metadata. It verifies the three resulting hashes, exact approved transformations,
notices/map-annotation removal, retained unchanged maps and the actual byte verifier.
No tgz is saved, no installer runs and no vendor code executes. The constructed
isolated pnpm-shaped root is a test layout, NOT a real package-manager install or
production archive consumer. The current installed declaration profile is unrelated
and is not required to match the entire unpatched registry package. After workspace
runtime registration the report explicitly says reviewed-clone; downloaded original
bytes and private unpatched rejection remain independent requirements. The preserved
pre-registration report and ASSET-REVIEW.sha256 are historical, not a claim that
their changed metadata/harness inputs still match the current tree.

Candidate assets live at `packages/heroui/compat/rac-table-clone`. Their descriptor
and setup README own pins, hashes, scope and limitations. Main separately owns any
shipping/registration/install/combined development patch/consumer-production38 work.
No current38, new browser/CJS-runtime, packed/G05, maintainer setup-friction or legal/
release approval follows from these asset tests. The raw vendor cached-column
insertion limitation remains outside the tested current NativeCollection API.
