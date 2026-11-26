# Verification strategy

Source: HLD §13; product acceptance and quality gates. WP-01 mounts foundation
build/type/boundary-unit/browser-smoke/Storybook/packed-consumer checks, not feature
acceptance suites. The [README](../../README.md#local-foundation-workflow) owns
executable commands; [foundation evidence](../evidence/wp-01-foundation-2026-11-23.md)
records their scope. WP-02 adds pure contract/operator conformance; WP-03 adds
pure controller and real React hook fixture checks. Their evidence is still
packet-scoped, not full table/native/resource/SSR acceptance. Documentation checks
remain independently runnable in Python.

## Choose checks for meaningful risk

Name a failure and consequence, inspect existing coverage, then choose the
smallest boundary that establishes the required fact. Add a test for an uncovered
meaningful risk, not every edit. Minor visual changes normally use visual review;
avoid brittle geometry/CSS tests or duplicated story/browser runners. A cosmetic
change must not bypass meaningful focus/state/overflow acceptance.

| Boundary | Check | Does not prove |
| --- | --- | --- |
| Documentation | Local targets/fragments/navigation, ID inventories, skill structure, source/prose review | Runtime, semantic equivalence from ID counts alone, external URL health |
| Contracts | Unit/property/conformance vectors: owners, values, nulls, inverses, ranges/clock/DST, validation/keys/limits | Browser collection behavior or backend authorization |
| Transitions | Pure reducer + command interactions: atomic resets, semantic no-ops, controlled rejection, selection, isolation | SSR or actual network races unless exercised |
| Types | Inferred field/accessor/native/custom values and source union, positive/negative declaration consumers | Runtime validity or supported peers without builds |
| Components | Testing Library/Vitest and meaningful story interactions | Actual browser layout, full AT or server behavior |
| Real browser | Playwright collection/ARIA/focus/controls/recovery/drag/input/race fixtures, screenshots, axe | Actual Safari/mobile/AT from emulation or automated scans alone |
| SSR | Start loader/cache/two-scope/hydration, timezone/IDs/client directives | Real consumer authorization from synthetic actors |
| Packed consumers | Clean tarballs in headless/styled/Start/Vite/Next and declared TS/peer matrix | Npm ownership, production app use, untested combinations |
| Manual input/AT | Actual keyboard/screen-reader/simple-pointer/touch, narrow/zoom/RTL/themes | Universal WCAG conformance beyond recorded scope |
| Performance | Fixed workload/runner/samples/protocol and raw results | General/mobile latency or universal maximum dataset |
| Real consumer | Authorized actual application integration and failure/permission behavior | Other deployments, or permission to modify `.repo/` |

## Minimum scenario selection

Use [AC-01–AC-29](../../product/acceptance.md) and [traceability](../../product/traceability.md)
to select affected coverage, not run every suite blindly. Mandatory high-risk
compositions include:

- Builder-only Clear with all tools, inactive owner exclusions, All/Any across
  fields and multiple same-field rules, inverse/membership/draft/null/date boundaries.
- Selection replacement preserving hidden criteria, off-page total/loaded object
  distinction, sort/page/size preservation versus effective-filter clearing.
- Initial versus retained/error/empty precedence, requested/displayed page
  provenance, successful empty replacement, late/uncancellable requests/access loss.
- Current-page row move restrictions, no competing DOM owner, latest-authoritative
  failure recovery; fixed utility/group/hidden order for columns, all input methods.
- Arbitrary details, controlled closing/focus/target isolation, two tables,
  controlled owner rejection, server manual mode and actual package import boundaries.

G-01–G-05 have exact [exit criteria](../engineering/feasibility.md); full stable
quality gates still apply beyond these focused fixtures.

## Future executable workflow ownership

Bootstrap selects pinned compatible tools and verifies real commands. Build
shared exports/declarations/generated app artifacts before dependent checks when
they are required; do not run tests against missing/stale generated output and
claim behavior failure/success. Do not copy Gamila's build assumptions blindly.
Unit work need not rebuild unrelated apps if the actual dependency graph permits.

Use isolated synthetic fixtures, request scopes, origins/ports and output paths.
Avoid test cleanup touching running review servers or another worker's artifacts.
No real private records or live consumer writes without explicit target authority.

Automated engines should cover Chromium/Firefox/WebKit as useful, with actual
supported Edge/Safari/iOS/Android/manual evidence recorded separately. Publish
exact versions, tested feature combinations and known limitations per release.

## Evidence and completion

Record commands/environment/revision/fixtures/results/failures and untested
boundaries using [evidence conventions](../evidence/README.md). Mock/story checks
must remain labeled. Fix verified in-scope issues and rerun affected checks after
integration; earlier passes do not automatically cover a new revision.
Required missing runtime/manual/benchmark evidence blocks the outcome that
requires it. Documentation foundation can finish with those future gates explicit.
