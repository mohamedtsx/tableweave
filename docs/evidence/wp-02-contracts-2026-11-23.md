# WP-02 private contracts — 2026-11-23

Task: TASK-006; [plan](../planning/wp-02-implementation-plan.md),
[producer contract](../engineering/wp-02-contracts.md). Requirements: pure
portions of FR-01/FR-04/FR-07–FR-10/FR-12/FR-14 and
AC-02–AC-07/AC-23/AC-26 only. Product acceptance/gates remain broader.

## Target and environment

- Base revision `5c11d53dc889d09a001e5cb8d0d66fbc918e9497` on `chore/setup`;
  dirty tracked/untracked WP-02 plan, implementation, fixtures and documentation.
  No commit, push, branch switch, PR update or publication performed.
- Linux; Node `24.22.0`, pnpm `10.13.1`, TypeScript `6.0.3` and packed declaration
  cross-check `5.9.3`; Vitest `5.1.1`, Vite `7.3.8`, Playwright `1.65.1`.
- Actual runtime dependencies: Valibot `1.5.0`, Internationalized Date `3.12.4`;
  no vendor patches/forced peers or dependency/toolchain upgrades. Build uses
  existing Node typings to satisfy Valibot's internal Blob/File declarations;
  public packed declarations must work without DOM/Node typings.
- Wire/vector revision 1; package version remains private `0.0.0-wp01.0`.
  Synthetic records only. No production records, scopes, tokens or services.

## Method and observed corrections

- Captured the initial three schema tests failing because `defineQuerySchema`
  was absent; implemented them instead of faking exports.
- Initial strict build exposed Valibot's internal global type references and
  exact-optional/schema-union issues. Fixed internal build typings and actual
  schema-dependent public types; did not add DOM libs to consumers, enable
  declaration skipping or relax strict/exact-optional checking.
- Expanded vectors to every built-in ID, all presets, calendar/date-time variants,
  null/invalid/negative edges, composition, custom precision/inverses/matchers,
  immutable strict transport, dates/DST and identities. A separate application
  translator fixture binds values and interprets its own primitives against
  independently stated expected record indices. It does not invoke the library
  evaluator; SQL-shaped output is synthetic, not a real database.
- Review corrected duplicate built-in key neutrality, overbroad date/custom-none
  types, context validation, clipped calendar windows, accessor/prototype/getter
  hazards and callback diagnostic leakage. Failed intermediate type/format runs
  are superseded by final verification, not release evidence.
- First isolated packed run passed both TS versions and invoked real validation,
  DST predicate and identity functions under the import guard. Subsequent
  formatting moved negative-fixture error locations: moved expectations to the
  actual rejected properties, without suppressing errors or dropping cases.

## Initial delivery verification (before review session 1)

Final `pnpm check` passed on the delivered runtime/test snapshot. A first full
run also passed; repeated after late review edits to avoid relying on an in-flight
mixed source snapshot. Only handoff/evidence Markdown changed after the final run;
documentation checks and whitespace checks are rerun for that update.

| Check | Observed result |
| --- | --- |
| Fresh isolated manifest-only frozen install | Passed, 317 packages, lockfile unchanged, cache reused |
| Biome / strict typecheck | Passed; 59 code/config files, package/Storybook/harness sources including contract tests |
| Vitest | Six suites, **149 tests**: 145 contracts and four foundation guards |
| Documentation | 68 Markdown files, 428 local links/fragments; 17 checker regression probes passed before final ledger edits; external links/source snapshots not fetched |
| Packed content/install | Exact 36-file core / seven-file styled allowlists; private ESM/export encapsulation; clean strict-peer then frozen consumer installs |
| Packed declarations | Headless and styled fixtures each passed TS 6.0.3 and 5.9.3, strict/exact-optional/skipLibCheck:false, ES2022 only, no DOM/Node typings |
| Packed runtime/bundling | Real schema creation, invalid-version rejection, DST/date/number predicate and key invocation passed under React/UI/router/network-module import guard; Vite module/CSS checks passed |
| Declaration inspection | No vendor, React, Blob/File or Node imports/names in emitted public declarations |
| Storybook/Chromium | Static Storybook 9.1.21 build and one pointer/keyboard/style/axe smoke passed; no page exceptions or external-origin app requests |

Browser: Playwright-managed **Google Chrome for Testing 159.0.8154.6**, Linux.
No manual AT session. Nonfatal existing Vite warnings about ignored client
directives and large Storybook chunks remain; source/emitted directive checks
still pass. They are not SSR or performance evidence.

Final transient report: `.artifacts/packed-HVdaVi/report.json`; generated tarballs,
consumer installs/bundles and `test-results/` screenshots remain ignored/local,
not durable repository evidence. Durable fingerprints from that report:

| Artifact | SHA-256 |
| --- | --- |
| Core private tarball | `be24684e2dbe5b0964ea00838ca933cfbbe6431cb4b7d31abd6e4bb6ccc7ac3d` |
| Styled private tarball (unchanged) | `cdf073ec9505ccd8dd0582b9805ada2152af969f0263c3296bb8abff709a8ff2` |

Maintainer packet review/acceptance is pending. No full AC or release gate was
marked passed by the agent.

## Review session 1 — n1–n3 corrections

Same base revision/environment and uncommitted WP-02 scope. Maintainer reports
were treated as hypotheses and checked independently, not accepted as authority.

- **Before:** `pnpm exec vitest run tests/contracts/review-regressions.test.ts`
  failed both invalid-collection cases (true instead of false) and the corrected
  Apia compile assertion (did not throw). The first Apia attempt failed because
  the agent incorrectly passed `now` to createQuery; correcting the fixture
  exposed the actual reported bug. `pnpm exec tsc -p tests/foundation/tsconfig.json`
  produced the two reported TS2322 errors for dynamic sort/tab values.
- **Correction:** shared internal ID shape validation plus own-index collection
  checks; independently implemented equivalent fixture validation (no evaluator
  call-through); finite, strictly increasing timestamp bounds after conversion;
  sort/tab types account for optional configuration without widening literals.
- **Focused after:** ten regression cases pass; `pnpm typecheck` passes, including
  optional known-tab/possibly-sortable positive cases and forbidden-sort/unknown
  known-tab/absent-tab negatives. Existing packed consumer fixtures now carry the
  same distinctions and real invalid-collection/skipped-day runtime calls.
- **Final integrated verification:** `pnpm check` passed on the corrected code:
  frozen fresh install/unchanged lockfile; Biome (61 files); strict package,
  Storybook and harness types; **159 tests in seven suites** (155 contracts,
  including ten review regressions, plus four foundation guards); 17 docs probes;
  exact tarball allowlists; isolated strict-peer/frozen installs; headless/styled
  packed TS 6.0.3/5.9.3 positive/negative dynamic/optional/literal types; guarded
  real runtime invalid-collection/skipped-day checks; Vite bundle checks; static
  Storybook and one Chromium smoke. Existing client-directive/chunk-size warnings
  remain nonfatal. No React/UI/native/SSR/backend gate scope changes.
- **Final review:** inspected the corrected scalar/collection/date/type paths and
  fixtures; public export surface and dependency graph unchanged. Added the
  explicit evidence-first factual-review instruction to the worker workflow so
  clearing REVIEW.md does not remove it. Only review/evidence/workflow/ledger
  Markdown changed after the full check; final docs/whitespace checks rerun.
- **Current artifact:** transient report `.artifacts/packed-2hryAJ/report.json`.
  Core tarball SHA-256
  `f2673a9c23d6ce9f70f2e3d6509cfb89d56692012ad72ea701305f35a8df24db`;
  unchanged styled SHA-256
  `cdf073ec9505ccd8dd0582b9805ada2152af969f0263c3296bb8abff709a8ff2`.
  Artifacts remain ignored/local; this summary retains the sanitized fingerprints.
  Earlier 149-test/tarball results above describe the pre-review snapshot only.

## Limits and remaining review

Pure predicate/translator/type evidence is not proof of mounted controller
atomicity, UI drafts/Clear/Cancel, async picker recovery, native row processing,
actual SSR/Start/Next hydration, backend parameterization/authorization, sort/page
execution, accessibility, performance or real-consumer compatibility.

The existing Chromium/axe Storybook smoke, when run, remains a synthetic vendor
scene; it is not WP-02 UI coverage. G-01–G-05 and legal/publication inputs remain
open. Applications still own data, access checks, clock scheduling, query scope
and persistence. Keys can contain filter values and are never logged automatically.
Maintainer reviews this producer before WP-03; no later packet is authorized.
