# Review notes

Temporary scratchpad for maintainer feedback, separate from the live task ledger
in [TASKS.md](TASKS.md). Note numbering (`n1`, `n2`, …) restarts in each new review
session. Keep session context while notes are retained; labels are not TASK IDs
or acceptance of the whole work packet.

When the maintainer no longer needs these notes, they can be cleared on request.
Keep applied decisions in their canonical documentation/code first, so clearing
the scratchpad does not lose the guidance. No notes are cleared by this move.

## WP-01 — review session 1

**Closed:** the maintainer ended this review and accepted TASK-003 / WP-01 on
2026-11-23. The foundation revision is `6bac5a6`; WP-02 is not started or authorized.
Notes are retained until clearing is requested; applied guidance remains in the
canonical documentation and skill.

### n1 — HeroUI component reference

- **Request:** use the official
  [HeroUI v3 Storybook](https://storybook-v3.heroui.com/?path=/docs/welcome--docs)
  for component lookup instead of relying on the main HeroUI site, which the
  maintainer reports is sometimes unresponsive.
- **Disposition:** applied in [stack lookup guidance](docs/engineering/stack.md#conditional-official-lookup),
  [design references](docs/design/handoff.md#authority-and-exact-references) and
  the [UI workflow skill](.agents/skills/tableweave-ui-workflow/SKILL.md).
  Installed-version/type/tagged-source verification remains required. No change
  to product scope, dependency versions or the three maintainer taste sources.
- **Checks:** documentation structure, all 17 checker regression probes and
  `git diff --check` passed when the guidance was applied. No runtime or external
  site availability validation was claimed for that documentation-only update.

This session has ended. Restart note numbering at `n1` in the next review session.

## WP-02 — review session 1

Open. Maintainer reports are checked against executable reproductions and product
contracts; neither maintainer nor agent assertions are assumed correct.

### n1 — Invalid collection records can match negative filters (P2)

- **Report:** `set.noneOf ['a']` accepts `['']` and a sparse single-slot array;
  record ID validation differs from operand validation and `.every` skips holes.
- **Disposition:** confirmed with both reported inputs returning true before the
  fix. Operand and record ID shape checks now share an internal validator;
  collection validation explicitly checks every own index. The independent
  translator fixture was also defective and now checks density/ID shapes using
  its own implementation. Regression coverage includes all membership operators,
  notEmpty, mixed invalid members, inherited slots and finite numeric IDs/zero.

### n2 — Skipped local day compiles to an empty interval (P2)

- **Report:** datetime On `2011-12-30` in `Pacific/Apia` yields equal epoch bounds.
- **Disposition:** confirmed: a corrected runtime reproduction accepted an empty
  interval before the fix. Converted timestamp bounds are now checked for
  finiteness and strict order. Tests reject the skipped absolute/relative day and
  preserve date-only intent and the next representable day; existing DST tests
  remain in the verification set. Initial reproduction setup mistakenly passed a
  clock into createQuery; that unrelated setup error was corrected before diagnosis.

### n3 — Dynamic definitions lose valid sort/tab types (P2)

- **Report:** a broadly typed `QuerySchemaDefinition` yields sort ID `never` and
  tab ID `null` even when runtime configuration supports those values.
- **Disposition:** confirmed by two TS2322 errors on otherwise valid dynamic
  sort/tab calls. Type derivation now admits possibly-true optional sort flags
  and extracts optional tab element IDs without requiring present properties.
  Local strict typecheck passes broad/optional positive cases and literal/known
  ID negative cases. Equivalent fixtures are included in the packed TS matrix.

**Verification:** all three reports independently confirmed and corrected.
`pnpm check` passes 159 tests (including ten new review regressions), strict local
types, both packed TS 6.0.3/5.9.3 consumers with broad/optional/literal fixtures,
guarded packed runtime regressions and the existing Chromium smoke. See
[correction evidence](docs/evidence/wp-02-contracts-2026-11-23.md#review-session-1--n1n3-corrections).
The [worker workflow](docs/agents/workflow.md#lifecycle-and-one-live-ledger) now
preserves the maintainer's instruction to verify factual reports rather than
assume their truth. These corrections do not accept WP-02 or close this session.
