# API negative versus live-page errors — source-only correction

Review31n1; main preserves the prior runner as5853ef6. Only
`../wp13/fixtures/family-runtime.mjs` changes; this directory contains its distinct
static/adversary/receipt evidence. No prior map/log/README is edited or re-signed.

The intentional callback-over-RSC request is made through APIRequestContext, not
through a browser page. Every live-page pageerror/console error is now unexpected,
including during that request and final cleanup. Only the narrow matched **server**
diagnostic can count as intentional. genuineRsc and its unrelated500/type/build-error
rejections remain byte-identical. No unrelated product/app/library behavior changes.

The [static checker](check-source.mjs) reads/parses source and compares99 unchanged
runtime-stage inputs,132 original-stage inputs and all155 library bodies. It checks
the final cleanup recount includes every browser error and the global timing exemption
is gone. It does not execute a production helper, observer, CLI, process or browser.
The [rejection case](rejection.test.mjs) is authored FINAL-only and **UNRUN**. Actual
concurrent-page/error plus HTTP/Flight reproduction and independent verification
remain final; a source/count assertion does not establish that runtime behavior.

Source-only commands:

```sh
node tests/consumers/wp13-runtime-errors/check-source.mjs
node --check tests/consumers/wp13/fixtures/family-runtime.mjs
node --check tests/consumers/wp13-runtime-errors/rejection.test.mjs
node node_modules/typescript/bin/tsc -p tests/consumers/wp13-runtime/tsconfig.light.json --pretty false
pnpm exec biome check --assist-enabled=false tests/consumers/wp13-runtime-errors tests/consumers/wp13/fixtures/family-runtime.mjs
```

Original100-file/1,282-input maps have exactly this disclosed one-body drift; their
bytes and original137-file/1,179-input history stay exact. Main's current
static/syntax/full scoped Biome and positive source TS6 checks pass. Main also
verifies1,281 historical pin inputs unchanged, with only the disclosed runner-body
drift. MJS remains untyped. All process/helper/unit/server/browser/
framework/HTTP/SSR/consumer/dual/negative/CI/manual/performance/independent gates stay
UNRUN. No drag/G-02 approval, native provisioning, install, build, pack or relocation.
