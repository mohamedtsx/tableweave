# Evidence conventions

Evidence records actual observations, not intended behavior or live task status.
Use [template](../templates/evidence.md); requirements live in `product/`, strategy
in [testing](../testing/README.md), and live work in [TASKS](../../TASKS.md).

For substantive work, record date, exact revision/dirty state (or no initial
commit), tool/browser/OS/AT versions, target/scopes, fixtures/workload/sample count,
actual versus mocked dependencies, commands/method, observed results including
failures, sanitized durable artifacts and explicit limits/unexecuted gates.
Never backdate new results or promote old passing counts to current acceptance.

Structural links/ID coverage do not establish semantic equality to Notion or a
working implementation. A parsed proposed API is not a typechecked package.
Story/axe/WebKit/mock passes are not actual SSR/backend/AT/Safari/consumer proof.
Retain failures and supersession; do not rewrite history into success.

No private records, credentials, auth state, raw sensitive filters/errors or
commercial assets in reports/screenshots. Temporary machine-local tool outputs
are not durable repository artifacts. Link only permitted sanitized supporting
files and distinguish what is retained versus transient.

## Captures

- [WP-05 private resource producer — 2026-11-24](wp-05-resource-2026-11-24.md):
  independently corrected Suspense lifetime, deterministic races and isolated full
  plus combined native/resource public packed/browser workflow evidence; not
  framework hydration or real authorization/release proof.

- [WP-04 native/collection candidate — 2026-11-24](wp-04-native-2026-11-24.md):
  corrected actual native/grouped collection G-01 proof, independent review and
  strict public packed/browser checks; not broader framework/device/release gates.

- [WP-03 private coordinator — 2026-11-23](wp-03-controller-2026-11-23.md):
  pure controller, controlled transactions, packed types/runtime and React hook
  fixture evidence; no native/resource/framework SSR or release acceptance.

- [WP-02 private contracts — 2026-11-23](wp-02-contracts-2026-11-23.md):
  pure schema/operator/date/translator and packed-boundary evidence; no mounted
  table, backend, SSR, full gate or publication acceptance.

- [Documentation foundation — 2026-11-23](documentation-foundation-2026-11-23.md):
  source intake, local coverage/navigation/skill review and check results; no
  runtime, Figma, package, benchmark or publication acceptance.
