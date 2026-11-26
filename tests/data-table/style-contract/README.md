# Shell layout CSS — implementation-ready PROVISIONAL

Isolated prerequisite at neutral-label tree `5e09726`, under main's
`docs/planning/wp-09-shell-layout-css-plan.md` lease (in the stacked tree).
Only **new** `packages/heroui/src/data-table/styles.css` and this new fixture
directory are owned here. Main already owns child TASKS/bookkeeping and all
Git/preservation/intake/public-generation work. No shared S3/Builder/core APIs
were required, inspected as changing APIs, resumed or modified.

This is a reserved **selector helper, not a new UI**. The stylesheet is **not
imported**, root styling is **not activated**, and no functioning DataTable,
responsive/accessible table or public CSS availability follows from this change.
Main's future actual shell must adopt the classes and separately wire/review the
CSS asset/import/export generation after the shared S3 handshake. No existing
CSS, import, component, type, barrel, manifest, config, lock, test or asset changed.

## Reference provenance and adaptation

- Loaded mandatory Figma design-to-code guidance from
  `skill://figma/figma-design-to-code/SKILL.md` before the context request and CSS
  authoring; also loaded Tableweave UI workflow and HeroUI v3 guidance.
- Reused authorized file **Tableweave** `USX6vMtBrZICYS9M4V84bB`, session
  `ee4af72b-3aba-4d91-b261-5c136b8e84ba`. Called `get_design_context` for
  [Configured, node5:159](https://www.figma.com/design/USX6vMtBrZICYS9M4V84bB?node-id=5-159),
  `clientLanguages: typescript,css`, `clientFrameworks: react`,
  `skillNames: resource:figma-design-to-code`, **excludeScreenshot:false**.
  The response supplied detailed component/Tailwind reference code, not a sparse
  scene needing a child-node expansion. That generated code was not copied.
- Subsequently retrieved/viewed the same node with `get_screenshot` at its actual
  **1440×752** dimensions. Inline image delivery was used because this lease
  forbids arbitrary HTTP/shell downloads outside read-only Figma/docs tools.
  This was a Figma reference screenshot, **not an application/browser screenshot**.
  It is not saved/imported as an asset, and its short-lived URL is not recorded.
  No configured-scene image/SVG asset is needed by this layout stylesheet.
- The approved direction is quiet hierarchy, compact tool groups, open table
  space and restrained metadata. App title/business content,32px screen padding,
  fixed sample column widths/six-row geometry, button/checkbox implementation,
  Figma fallback colors and Noto fonts are **not** library defaults. No asset,
  icon, new font, Tailwind/div-table recreation or Figma/CodeConnect mutation.
- Read `docs/design/{handoff,wp-09-shell-reference}.md`, engineering rendering/stack,
  shared rules and `docs/reference/{README,gamila-assessment}.md` for the three
  maintainer references and their no-copy boundaries. Local `.repo` is absent in
  this isolated tree (read reported not found): no direct Gamila inspection,
  metadata repair or runtime import occurred. The recorded assessment is scoped
  history, not a new visual review. Transactions-reference hierarchy/exclusions
  were read through the maintained handoff; its live site was not fetched.
  Current explicit user direction and approved shell reference guide this small
  adaptation; no new brand/business/architecture decisions are inferred.
- Inspected actual pinned **@heroui/styles3.2.8** Table CSS and theme variables,
  `packages/heroui/src/{styles.css,toolbar/filter-tools.css,pagination/styles.css,details/styles.css}`
  and actual `table/controlled-collection.tsx`/NativeCollection root. The actual
  native Table secondary root owns `Table.ScrollContainer → Content → Header/Body`.
  Its vendor grid is `minmax(0,1fr)`; its scroll container owns `overflow-x:auto`.
  The new shell keeps that boundary, adds no competing overflow, and touches no
  vendor selectors, cell/header sizes, root variant or internal tool layout.
  No phantom `defaultRoot`/integrated S2 renderer API is assumed in this older tree.
- Supplementary HeroUI MCP quick-start docs request failed (`fetch failed`). No
  retry/install was made. Matching installed package CSS/theme is the actual
  token/style authority here; hosted Storybook/main-site runtime was not opened.
  The failed lookup is recorded in `.artifacts/reference-results.json`.

## Future class slots

All rules are in the already established `@layer tableweave`.

| Reserved class | Intended future slot / treatment |
| --- | --- |
| `.tw-data-table` | Shell grid, one shrinkable track,1rem overall gap, inherited font and actual foreground token |
| `.tw-data-table__external` | Optional external tools; flex-wrapping root groups,0.5rem gap, space-between |
| `.tw-data-table__toolbar` | Normal/replacement toolbar; flex-wrap direct tool roots with0.5rem gaps |
| `.tw-data-table__collection` | Width boundary only around NativeCollection, not a scroller/row/card renderer |
| `.tw-data-table__state` | Neutral waiting/loading/error/empty slot; small grid,0.5rem gap,1rem block padding, no promised pixel height |
| `.tw-data-table__notice` | Quiet resource/status metadata; no status semantics/announcement/callback is fabricated |
| `.tw-data-table__footer` | Footer tool groups; flex-wrap with0.5rem gaps and space-between; native pager keeps its own internals |

Every slot/root has `min-inline-size:0` / `max-inline-size:100%`. Spacing1rem/0.5rem
corresponds to the requested16/8px rhythm **at the default16px root**, not a fixed
screen promise. Only state/notice use0.75rem and1.5 line-height (12/18 at that root).
Body/control text remains inherited; this CSS does **not** globally force14/20,
change the font stack or reset arbitrary slot descendants. Foreground, muted and
focus use actual `--foreground`, `--muted`, `--focus`, no fallback hex/token aliases.
No background/radius/separator is added merely to imitate a screenshot card.

Flex wrap applies at the shell's direct tool-group boundaries only: future markup
must supply intact rule/tool roots, not individual field/operator/value segments
as independent flex children. It does not repair arbitrary app-owned slot content
or overwrite the Builder's rules. RTL inherits direction and uses logical sizing/
block padding; no RTL/language selector, physical sizing, breakpoint/cards/column
hiding, animation, shader or new scrolling surface exists here. Geometry, long
labels/200% zoom/narrow controls still require actual integration review.

`.tw-data-table:focus-visible` uses a2px actual focus-token outline with2px offset,
only if the future shell makes its root focusable. CSS creates **no** tab stop,
permission, focus transfer/restoration, readiness or event handler.

### Hidden semantics: explicit but not security

`.tw-data-table[hidden]` and `.tw-data-table [hidden]` set `display:none`. These
scoped selectors have higher specificity than the module's one-class layout
display rules, so those rules cannot themselves reveal an already hidden root/
descendant. They are deliberately limited to the root subtree, not a global
`[hidden]` reset. No `!important` is needed against **these** rules. There is no
claim of dominance over arbitrary app/vendor layers, higher-specificity rules,
inline styles or future consumer overrides; final cascade checks remain deferred.
Nested status/toolbar/waiting subtrees and arbitrary app slots are not remounted,
erased or authorized by this stylesheet. Hidden presentation is **not** backend
authorization, DOM/heap erasure, confidentiality or a substitute for producer gates.

## Actual LIGHT checks / preserved limits

`check-static.mjs` invokes the **installed declared** Biome2.6.8 CLI, explicitly
enabling the CSS formatter and disabling Tailwind-specific parser syntax. It
requires successful status, exactly one processed file and that actual CSS path
in verbose output. Ignored/skipped files cannot be reported as CSS parsing proof.
No runtime dependency/parser import was added. The root Biome config was not edited.
Biome parses/formats the source; it does **not** compute CSS or run the app.

`inspect-css.mjs` is intentionally a **restricted flat-rule text inventory, not a
general CSS parser/AST/cascade simulator**. After independent Biome syntax parsing,
it requires the exact established layer/allocated selectors and declaration map:
**8 rule blocks,10 distinct selectors,25 declarations in those blocks**, seven
classes plus root focus and two scoped hidden selectors. Logical boundaries,
16/8 rhythm, inherited font, actual tokens, metadata and hidden declarations are
checked statically. Imports/fonts/assets/important/colors/extra at-rules, unknown
namespaces, vendor/row/card/column/visibility/new overflow/physical width rules and
descendant tool wrapping cannot join this exact contract. This is not a regex
claim of pixel/cascade/accessibility correctness.

Five Node unit contract cases are **authored only, unrun** in `contract.test.mjs`.
They cover actual reserved CSS, prohibited import/font/asset/color/important,
physical/new-scroller/vendor/card/column declarations, scoped hidden declarations
and intact tool/direction boundaries. No Node test runner or negative replay was
executed; running the LIGHT inspector over actual text is not a passed unit suite.
All four own `.mjs` files also get `node --check` syntax checks only. No TS compile
is needed for an unused CSS module with no TS fixture or changed public type.

The first static wrapper failed **after Biome successfully parsed the CSS**:
it looked only at stdout for Biome's one-file summary, but Biome sends that summary
to stderr. The wrapper now retains/inspects both streams. `static-01.log` and
`css-biome-1795562714460.log` preserve that failure/raw output. `static-02.log` and
`static-result.json` record the corrected LIGHT success, without changing CSS to
mask the harness issue. This is not a skipped-input parse success claim.

Actual results: scoped Biome pass; CSS parse/format and structural checks pass;
own JS syntax checks pass; final scope pass. Logs and machine-readable results
remain under own `.artifacts/`, including all failed lookup/check evidence.

```sh
# LIGHT only; does not load the CSS into a runtime or execute unit cases.
NODE_DISABLE_COMPILE_CACHE=1 node tests/data-table/style-contract/check-static.mjs
NODE_DISABLE_COMPILE_CACHE=1 node node_modules/@biomejs/biome/bin/biome check --css-formatter-enabled=true --css-parse-tailwind-directives=false packages/heroui/src/data-table/styles.css tests/data-table/style-contract/*.mjs
NODE_DISABLE_COMPILE_CACHE=1 node tests/data-table/style-contract/scope.mjs --after
```

### Immutable protection and handoff hashes

Before adding CSS, verified the supplied **all-file130-source** map (CSS included)
at `/tmp/opencode/wp09-before-shell-css-source130.json`, exact byte aggregate
`92fc6e44fc160e6508740e06000ed1f21f9352d11ea6b85544fa5c92f35e1a89`.
New stage `.artifacts/before-source130.json` is that unchanged original map; no
old D2/neutral/fc01 maps or expected post-delta generations were refreshed.

`scope.mjs` inventories **all file types**, including ignored logs/preimages/old
dist/assets, not TS alone. It protects all130 old sources and **1147 existing
worktree inputs**, including root styles/manifests and main's already-written
TASKS. It excludes only this lease's new fixture subtree and ordinary Git/dependency/
local-reference internals; symlink targets are recorded without traversal. Git
file kinds and owner executable bits are compared, not raw100664 versus100644 rw
bits. Read-only index bytes are captured/compared; no Git mutation is performed.
Source count increases to **131** by exactly the one new CSS file. No other added
worktree paths or old byte/mode changes are allowed. Own new source/fixture hashes
and their exact count/aggregate are in `.artifacts/handoff.json`.
That handoff excludes generated own `.artifacts/` logs/maps from its input aggregate;
main must preserve useful evidence separately rather than stage old warning logs.

This isolated source tree predates main's S2/audit/Date integration: static success
is **not integrated current-root, ordinary emitted/packed or CSS asset discovery
proof**. No package/style entry, sideEffects generation, build/copy output or export
map is changed. The neutral-label implementation and all historical fixtures/seals
are preserved byte-for-byte, not revalidated by rerunning them.

## Deferred final phase / main next step

Only after the user's final-phase authorization, the authored non-rendering unit
cases may run with:

```sh
NODE_DISABLE_COMPILE_CACHE=1 node --test tests/data-table/style-contract/contract.test.mjs
```

That still would not prove actual CSS rendering. Main must first integrate real
shell markup/imports with the final shared sources; then review real browser
layout, contained native scrolling, intact groups and waiting-subtree cascade,
320/390/768/1024/1440 geometry, RTL/dark, long text/200% zoom, root focus outline,
contrast, manual Arabic/AT and independent visual acceptance. No dummy UI or
server/browser test is added/run to imitate that future integration.

Main next: inspect this single-new-source helper, parser/static result and unchanged
130/1147/index hashes, preserve/commit in this isolated tree, then intake after
shared S3 handshake. Final CSS import/asset/export wiring and all runtime/visual/
manual/independent approval remain main-owned. No install/build/shared emission,
agents/browser/server/arbitrary network/paid AI/Weave/deploy/publication/Git/PR/merge
or full WP-09/public-generation approval occurred.
