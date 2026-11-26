# WP-08 SelectionToolbar producer handoff

2026-11-24; worker candidate for independent review, **not packet approval**.
The verified masked-render privacy finding has a fail-first correction in
[privacy correction evidence](privacy-correction.md); its new fingerprints and
29-test rerun supersede the historical initial-candidate figures below.
Authorization: main's approved WP-08 selection allocation, amended plan, and explicit
user grant. Writes are only `packages/heroui/src/selection/**` and this directory.
Start/base HEAD: `3e4aaa8e697670035346d4e9a26055d1ad2e6b4a`; existing main/core work
was already uncommitted and is preserved. No Git writes, installs, shared builds,
root exports/config/style/manifest changes, merges, deployment or publication.

## Exact producer API

`packages/heroui/src/selection/index.ts` exports:

- `SelectionToolbar<S extends QuerySchema, T extends object>`.
- Own types `SelectionToolbarProps`, `SelectionToolbarMessages`, `SelectionAction`,
  `SelectionActionContext`, `SelectionToolbarFailure`.

Required props: `presentation: ControlsPresentation<S,T>`,
`authority: ControlsAuthority<S,T>`, `normal: ReactNode`.
Optional: `actions: readonly SelectionAction<S,T>[]`,
`messages: Partial<SelectionToolbarMessages>`, `className`,
`getRestoreFocusTarget: () => HTMLElement | null`,
`onError: (failure: SelectionToolbarFailure) => void | Promise<void>`.

`presentation` is the current reactive **accepted render projection** supplied by
the owner. `authority` is the genuine event-time producer, with an application-owned
commit-phase `readCommitted` port. No speculative render assignments, committed
native getter substitution, new controller/query/selection store, resource read
subscription, transport, retention buffer or resource lifetime is introduced here.

Each action requires `id: string`, `label: string`, and
`onAction: (context: SelectionActionContext<S,T>) => void | Promise<void>`.
Optional `isDisabled`, `isPending` are application-controlled booleans;
`variant` is the own union `secondary | tertiary | danger`.
IDs must be distinct/nonempty, labels nonempty and callbacks callable; malformed
descriptors throw a generic TypeError. No vendor props/events/polymorphic types,
implicit actions or Export. This producer supplies **descriptors**, not an unsafe
record-bearing custom-render slot. Fixture descriptors invoke real app callbacks.

Context fields are readonly `selectedIds`, `selectedCount`, `loadedSelected`
(`{id, record}` entries, never synthetic off-page records), `missingSelectedIds`,
`busy`, `stale`, `obsolete`, `resourceObsolete`, `blockedReason`, `displayed`, and
`requestedQuery`. Provenance is the genuine ControlsPresentation provenance,
including retained displayed A versus requested B; no extra invented status.
Only containers/entry envelopes are frozen, **never application records**.
Native rows are not passed to app actions.

Messages: `normalLabel`, `selectionLabel`, `actionsLabel`,
`selectedCount(count): string`, `cancel`, `cancelLabel`; all defaults replaceable.
Cancel's accessible name includes the visible `cancel` text plus `cancelLabel`,
including when only the visible message is overridden (label-in-name preservation).

## Behavioral protocol for later shell consumers

- An authorized presentation with exactly zero accepted selected IDs mounts
  `normal`. Withheld `requestedQuery: null` or context/definition denial renders
  **no private region**, not the normal region; action metadata/renderers and
  private focus fallback are not invoked. This is first-render/SSR policy, not an
  effect or a row-readiness check. Any authorized selected ID, including
  off-page-only selection, **unmounts** all normal embedded tools/chips/search/
  chooser/custom children and mounts count/actions/Cancel. There is no optimistic
  transition or mutation during render. Rejected/delayed controlled Cancel retains
  the selection region. Accepted criteria and external tabs/date are untouched.
- Normal tools own their portal/draft cleanup on unmount; do not put external
  tabs/date inside `normal`. Never remount/reset the query controller for the swap.
- Cancel delegates to captured `authority.cancelSelection` at event time. That
  producer guards owner/definition/controller/resource/scope while preserving
  same-owner pending/failure/stale recovery. No `canSelect` prerequisite.
- Descriptor metadata, methods, callbacks, used presentation facts and messages
  are captured once before validation/use. App descriptors/ports are committed in
  a layout effect, not written to a speculative render ref. Saved handlers reread
  the latest committed descriptor/pending/disabled/callback and genuine authority.
  Replacing the authority object retires its old handlers; memoize it within an
  origin when practical. The genuine read independently checks current origin.
- App actions require nonempty current selected IDs and current Cancel-scope
  eligibility. `context`, `definition`, `source` and `binding` blocks suppress the
  callback. Same-owner `query`/`resource` stale states may pass truthful context;
  these are app operations, not built-in new-row selection/reorder. A new read
  supplies changed same-ID records and the current loaded/missing partition.
- IDs, UI visibility and resource scope are **not backend authorization**. The app
  authorizes/mutates/persists independently and owns pending/errors/access-loss
  cancellation. A legitimately delivered event snapshot cannot retract objects
  already retained by an app callback; apps must not replay old pending work.
- Synchronous callback throws, rejected promises and thenable failures are observed.
  Optional `onError` receives `{actionId: string|null, reason: unavailable|callback,
  error: unknown}` only while the reporting origin is still valid. Errors are never
  rendered/logged automatically. Reporter throws/rejections are also observed.
  Old-scope async failures are not forwarded into a new owner's error handler.
  Controlled reducer results are not misrepresented as completed persistence.
- Focus restoration happens only if the removed region actually owned focus,
  including a React-owned portal. Entry targets Cancel; exit asks
  `getRestoreFocusTarget` for the restored normal trigger or app-safe fallback.
  Absent/disconnected/throwing target falls back to the named group. Focus in the
  surviving table/external tools is not stolen. The named fieldset and actual
  HeroUI ButtonGroup use ordinary Tab/Shift+Tab; there is **no fake toolbar role**
  or unsupported roving-keyboard claim.
- Styles use semantic tokens/logical layout, wrapping and 44px minimum action
  targets. HeroUI's actual Button and ButtonGroup are used, not replacement mocks.

Main must add the desired genuine root exports and shared discovery later; this
worker deliberately did not edit `packages/heroui/src/index.ts` or a manifest.

## Verification actually run

Existing exact dependencies: Node 24.22.0, HeroUI 3.2.8, React 19.3.1,
TanStack 9.3.1, TS 6.0.3/5.9.3, Vitest 5.1.1, Playwright 1.65.1,
Vite 7.3.8 and its existing esbuild 0.28.2. No installs or dependency patches.
The ignored `vendor-node_modules` link points to the already installed Storybook
vendors in the main workspace. Do not commit links or generated `.artifacts/`.

Run from `/tmp/opencode/tableweave-wp08`:

```sh
pnpm exec vitest run --config tests/controls/selection/vitest.config.ts
pnpm exec playwright test --config tests/controls/selection/playwright.config.ts
node tests/controls/selection/check-types.mjs
node tests/controls/selection/check-ssr.mjs
pnpm exec biome check packages/heroui/src/selection tests/controls/selection
sha256sum -c tests/controls/selection/privacy-correction.sha256
git diff --check -- packages/heroui/src/selection tests/controls/selection
```

- **8 unit tests pass**: real accepted controllers/native boundaries/resources;
  controlled single/multiple acceptance; incomplete/off-page subsets; fresh records;
  stale busy/provenance; scope/access guards; one-read metadata/facts and validation;
  app records remain unfrozen. No vendor or controller mock.
- **Initial candidate: 24 Chromium tests passed** (the privacy finding below was
  missed; corrected candidate passes 29), source fixture on port **6463**: real
  HeroUI Buttons/Group and real native view/resources; controlled delayed/rejected
  selection and Cancel in both modes; off-page count; actual custom normal-child
  portal/draft lifecycle; accepted criteria/external/independent-table survival;
  fresh subsets; stale busy/failure Cancel; saved foreign scope/access/controller/
  resource/retired-authority callbacks; guarded pending/disabled metadata; thrown/
  rejected/deferred callbacks/reporters; focus entry/exit/retained table/external
  focus/fallback and keyboard-visible focus; optional actions; complete client data.
  Five width scenes (1440/1024/768/390/320), English long labels/light and Arabic
  RTL/dark, all pass scoped axe **with contrast and label rules enabled**, ten
  screenshots and no page horizontal overflow. A separate 320px/200%-root-text
  check passes action-group containment. Screenshots were inspected at 320 RTL/dark
  and 1440 long/light after fixing wrapped ButtonGroup corner treatment.
- **TS6/TS5.9 strict source and own emitted NodeNext declarations pass** with
  `exactOptionalPropertyTypes`, `skipLibCheck: false`, positive record/schema
  inference and meaningful negative record/ID/vendor-prop cases. `check-types.mjs`
  resolves the existing vendor symlinks to their genuine pnpm paths, uses Bundler
  source resolution for HeroUI's published extensionless internal declarations,
  emits only into this directory's ignored artifacts, checks own public declaration
  imports, then checks that own emitted interface under NodeNext in both compilers.
  Its Tableweave dependency is still source-aliased: **not packed/public-root proof**.
- **Source SSR/import passes without window/document** in both modes using the
  real HeroUI/runtime dependencies, no CSS input/reference imports, no action
  invocation. Existing esbuild bundles solely into `.artifacts/`; this is not a
  package build, framework SSR, hydration or clean bare-package import claim.
- Scoped Biome and whitespace checks pass. Historical fingerprints are in
  `candidate.sha256`; corrected bytes are in `privacy-correction.sha256`:
  owned source/fixture files plus the actual headless source inputs. No unfinished
  collection adapter source is frozen or claimed as combined renderer evidence.

Earlier failing runs were not hidden: two unit cases initially omitted the
controller's required controlled `onRequest`; the first browser run had ambiguous
fixture status selectors and missing app-owned scope cleanup; a 120s host deadline
also interrupted that run. Source type checks initially exposed pnpm path resolution
and an exact-optional boolean issue; those were fixed without skipping declarations.
The first axe matrix caught a genuine Cancel label-content mismatch and default
primary contrast failures on **fixture-only external/table buttons**. Cancel now
includes its visible label, fixture controls use quiet tertiary styling, and all
contrast/label assertions remain enabled and pass. DOM-free SSR originally used a
dev module loader that tried to evaluate React CJS as ESM; the actual Node-targeted
source bundle now passes. These were followed by the complete successful reruns.

## Limits and exact next action

This is scoped worker evidence, not independent review or agent packet approval.
The ordinary `normal` child is a **real small custom draft/portal component**, not
a fake full WP-07 implementation or alias. Exact WP-07 portal/timer/draft cleanup
integration remains main-owned. The fixture renders stable genuine native rows in
simple table markup; it **does not import** the concurrently changing shared
collection adapter. Its owner has separate port6469 work. Final shared adapter,
shell, public-root exports/discovery, full emitted/public packed consumers,
Storybook and combined workflow checks remain main-owned and mandatory.

No Firefox/WebKit/Safari/device/manual assistive-technology, full browser zoom,
framework SSR/hydration, performance, real consumer, backend authorization or
stable-release gate is claimed. Arabic validates this fixture's layout/copy
replacement, not a maintained dictionary or translator approval.

Reference intake: the isolated `.repo/` is absent, but the main workspace's relevant
read-only Gamila `apps/shared/src/ui/data-table.tsx` and recorded assessment were
consulted; quiet rendering-only composition was adapted, no code/assets/business
policy imported. Transactions reference was read. Official HeroUI Storybook lookup
and MCP docs were attempted (empty/fetch-failed); shipped exact 3.2.8 Button and
ButtonGroup documentation and types supplied the version-matching fallback.

**Next:** independently review the candidate/fingerprints, then main composes these
exact props with real WP-07/shared collection/shell producers and performs the
remaining genuine public/packed/Storybook/combined checks. Never infer a gate pass
from this source fixture; never merge or publish this worker's work.
## Portable local-install harness

The new test-only [portability handoff](../harness/README.md) records current
declaring-package resolution, commands, results and remaining gaps. Earlier source
review hashes/counts above remain historical; they do not certify the new configs.
