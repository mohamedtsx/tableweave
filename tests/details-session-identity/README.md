# D1 — private legacy DetailsSession issuance

**Implementation ready for main intake, PROVISIONAL.** No independent approval,
runtime/React/SSR/browser/type-negative/dual/emitted/packed pass, strict adopted
details proof or full WP-09 acceptance is claimed.

Main-supplied base: `e8529b0` in
`/tmp/opencode/tableweave-wp09-details-issuance`. No Git command was run. Main owns
the frozen install; its log is `/tmp/opencode/wp09-details-issuance-install.log`.
Authority is the child TASKS top and main
`docs/planning/wp-09-details-issuance-plan.md`. Those files were read, not edited.
The earlier private P4 report is design context, not an adopted implementation.

## Actual private API

New source-private `packages/heroui/src/details/session-identity.ts`:

```ts
interface DetailsSessionOwner<S extends QuerySchema> {
  readonly controller: TableController<S>;
  readonly mount: object;
  readonly mode: "legacy";
}
getDetailsSessionOwner<S extends QuerySchema, T extends object>(
  session: DetailsSession<S, T>
): DetailsSessionOwner<S> | null;
```

The WeakMap records the exact object returned by the real raw `useDetailsSession`.
Lookup checks null/typeof and WeakMap identity only. Unknown primitives/structural
copies/proxies do not acquire entries; no alleged property, getter, method,
prototype or controller method is consulted. Returned owner descriptors are frozen
new owned objects. Neither the session, controller, source, record, options nor
callback is frozen/wrapped/mutated by this bookkeeping.

The hook adds one inert `useState(() => Object.freeze({}))` mount token, assigns its
existing return literal to a typed local, records it and returns **that same object**.
Each returned view records that render's exact captured C. Controller replacement
does not retag earlier views; a new view may have a different C with the same mount.
Mount identity is not a controller/domain/readiness grant. Old views retain historical
issuance after replacement/unmount/disposal; lookup does not promise currentness.
Speculative returned views may also be recorded: this is render-time producer
issuance, explicitly **not committed callback readiness**.

`recordDetailsSession` is exported only between private source modules so the real
producer can register. It accepts no mode/authority/permission selector and issues
only legacy records. No package/root/details index export was added. Direct imports
of internal source files can bypass this convention; this is not an internal-module
consumer security sandbox. Future strict admission must reject legacy issuance and
use its separately allocated genuine bound producer, not bless old raw callbacks.

## Scope and unchanged raw behavior

Only one existing source changed:
`packages/heroui/src/details/use-details-session.ts`. The new identity source and
this test namespace are the only additions. Existing details types/identity/shell/
index, S1/F3/renderer, headless P2, Date/Builder, other sources, exports, CSS, configs,
manifests, lockfile and old tests/assets/profiles remain frozen.

Actual legacy policy remains `beforeChange` / `onOutcome` / `focusFallback` plus
`port.read/retry`; there is no new dirty-form, onInvalidate, bound hook, accessory,
adopted actor, focus engine or permission API. No new source read, controller method,
subscription, layout effect, source/native boundary, publication, close/reset/focus
operation or accepted-state mirror is introduced for issuance. Raw coherent-host
render reads and existing callbacks are intentionally unchanged.

`original-hook.before.txt` is the original raw-byte preimage. `check-static.mjs`
requires its recorded hash and strips **only** the exact new import, exact inert
mount declaration, final record/return statements, and changes the session local
back to the original return literal. The whole printed AST must then equal the
original hook AST. This structurally protects every old policy/callback/currentRow/
focus/record/context/method body. It is **static evidence, not React behavior proof**.

## Captured protection baseline and source hashes

Captured **before the hook edit**, never rebased:

- Original hook SHA256:
  `53284c89ae9442a05bf1621047521473e3d90987e1f528428b68295eb6b01e85`.
- **1,001 protected existing files**, aggregate
  `383596007435d71a58b8784e015394d97793d4c8592d822e1b929368125e5324`.
- **121 protected other package source files**, aggregate
  `4b0cfa86126559e9536aa25945ef10b2e0d3fdbf6f4ffd66209d926ef86482cc`.
  The actual pre-edit package-source inventory was 122 including the owned hook;
  it is derived by walking all files under both package src trees, including CSS,
  not hardcoded to a TS-only expectation. New identity makes 123 after D1.
- Final hook SHA256:
  `aea680d0a9892762c3465cbbae27db495b28f244fb462be7be6c48f8d53669b7`.
- New identity SHA256:
  `79b33c20fc819102a8f91730c896a7c8b956c02bb122b5ac66477c419e1df00a`.
- Exact-scaffolding-normalized original/current AST SHA256:
  `5cccbeb9d622ca5ebe5149ab3690ca233a896ee4194fbd54bb99fd7ca12bf359`.

`protected-before.json`, `protected-sources-before.json`, `baseline.json` own these
inputs. The file inventory excludes `.git`, `node_modules`, `.repo`, this new
namespace and the one leased hook; it includes existing workspace dist and old
fixtures/assets. Symlink targets are not followed; their link bytes/mode are recorded.
Values are mode/kind/raw SHA256, relative keys sorted with Node localeCompare,
indented JSON plus LF; the aggregate hashes that representation. These are local
scope identities, **not public output/generation identities**. Old seals stay intact.

## Authored, not executed, proof fixtures

- `lookup.test.ts`: unknown/primitive/function/structural/revoked/hostile-proxy
  denial, with getter/prototype/descriptor/key trap counters. No registration helper
  is used to fabricate a positive session.
- `browser.tsx` / `browser.spec.ts`: actual React DOM raw hook and real controller
  factory; exact controller/record/field-array/method/key identity, owner/mount
  freezing without session freezing, zero lookup-induced private calls, copy/proxy
  rejection, every returned view issuance, Strict replay/rerender mount continuity,
  two actual hooks on one C, raw C replacement preserving old owner, unmount/remount.
  This fixture deliberately uses the existing **raw** details precondition, not a
  fake permitting native/strict actor. It claims no native/adopted session proof.
- `types.ts`: exact inferred owner/controller/schema, readonly owner keys and
  legacy-only mode, with no ordinary-use record/schema casts.
- `types.negative.ts`: four authored readonly/mode/wrong-record negatives.
  `check-negatives.mjs` later checks an annotated program and a second program with
  all directives removed, requiring diagnostics at each marker line. **Not run**.

The fixture aliases real source barrels so all source factory registries are coherent.
The hook's new private module is imported by source path. Installed dist remains
historical; no emitted/root-package/ordinary installed-consumer availability follows.

## Actual LIGHT results

Commands run from the supplied worktree, with logs retained in this namespace:

1. `node tests/details-session-identity/scope.mjs snapshot` — status 0; captured the
   original preimage and 1001/121 inventories before production edits.
2. Scoped `pnpm exec biome check --write --vcs-enabled=false ...` — first status 1
   (`biome-first.log`): formatted 10 owned files, found one self-assignment in an
   authored negative fixture. Replaced it with assignment from a separately declared
   typed controller; no suppression. Failure log is preserved.
3. **One** `pnpm exec tsc -p tests/details-session-identity/tsconfig.light.json
   --pretty false` — status 0, `ts6-light.log` (empty). Strict TS **6.0.3**, noEmit,
   skipLibCheck=false; actual whole styled package source/imported headless source
   plus own positive/browser/unit-fixture types. Negative fixture excluded. No
   second compiler program, emitted output or runtime execution in this light check.
4. `node tests/details-session-identity/check-static.mjs` — status 0, exact raw AST
   preservation; new identity has only type imports and only owners.set/Object.freeze/
   owners.get calls. The only production importer is the actual hook. TS/TSX parse
   checks and Node --check of own scripts are syntax checks, not executing their tests.
5. `node tests/details-session-identity/scope.mjs` — status 0, no changes to all
   1001 protected files / 121 protected sources and no unexpected new workspace files.
6. The subsequent directory-wide read-only Biome invocation returned status 1
   (`biome-final.log`) solely because generated `.artifacts/static.json` uses the
   evidence serializer's indented arrays rather than Biome's compact one-element
   array formatting. That diagnostic/failure is retained. The final authored-input
   check excludes generated artifacts, not source: status 0,
   `biome-authored-final.log`, using the two production files plus
   `tests/details-session-identity/*.{ts,tsx,mjs,json}`. No source suppression or
   protection-map rebase. Final scope/static logs and `.artifacts` hold exact results.

These checks do not establish runtime behavior, meaningful negative rejection,
React/Strict/focus/SSR semantics or independent acceptance. Production sources and
positive TS fixtures did not change after the single successful TS6 program; later
edits are README/static/deferred-check tooling only.

## DEFERRED commands — only the authorized final verification phase

```sh
pnpm exec vitest run --config tests/details-session-identity/vitest.config.mjs
pnpm exec playwright test --config tests/details-session-identity/playwright.config.ts
node tests/details-session-identity/check-negatives.mjs typescript
node tests/details-session-identity/check-negatives.mjs typescript-5-9
pnpm exec tsc -p tests/details-session-identity/tsconfig.light.json --pretty false
node node_modules/typescript-5-9/bin/tsc -p tests/details-session-identity/tsconfig.light.json --pretty false
```

No deferred command above was run. Browser command would start only the owned
6569 Vite fixture; no server was started this phase. Genuine emitted/private-consumer,
packed/public source exposure, full existing raw details regressions, integration and
independent review require main's final allocation/workflow; no shared build/emission
or output registration was performed here. Manual AT/device/performance/privacy/
release gates remain separate. No agents, installs, commits, pushes, PR/merge,
publication, deployments, Figma or reference work occurred.

**Exact next step:** main inspect the two source files, AST preimage/protection maps,
authored fixtures and final implementation map; intake only as this legacy identity
prerequisite. Later adopted details waits for actual S1 and its own bounded lease.
