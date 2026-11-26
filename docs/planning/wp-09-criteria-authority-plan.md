# WP-09 plain criteria-authority producer

TASK-017 / AC-16/25. Main approves this bounded producer before code under the
existing delivery grant. Final packet still follows WP-08. No full facade, UI
adoption, unpaged policy, dependency install, shared build, Git or publication.

## Readiness and exclusive paths

The accepted WP-05 baseline here already has actual getDefinition()/isDisposed()
controller methods and plain ResourceContext. This stage does not depend on the
pending WP-08 vendor profile. Own only new controller/criteria.ts and
tests/criteria-authority/**. All existing store/types/index, contracts/filters,
native/resource/presentation, HeroUI/details, config/manifests/lock/docs and ledger
remain read-only. Main owns exports/discovery/integration and independent review.

## Exact candidate contract

New module packages/react/src/controller/criteria.ts exports:

- CriteriaOrigin<S>: exact controller/ControllerDefinition refs, context and
  epoch:string|number. CriteriaCurrent<S>: exact refs, expected/actual contexts,
  epoch. These envelopes contain metadata only, never query/rows/private values.
- CriteriaAuthorityOptions<S>: origin and pure synchronous readCurrent() method.
- CriteriaAuthority<S>: require():CriteriaOrigin<S>, returning the captured verified
  origin to retain schema typing; no backend authorization or future permission.
- createCriteriaAuthority, getCriteriaAuthorityOrigin and
  requireCriteriaAuthority(authority,targetOrigin), plus CriteriaAuthorityError
  with fixed safe unavailable code/message and no original error payload.

Register immutable origin/callback metadata privately in a WeakMap. Freeze only
new authority/origin/context copies, never application controller/definition/options.
Construction and origin lookup call no reader/controller method/subscription or
lifecycle. Denied origins may exist; require denies before reader/controller calls.

Shared require rejects unregistered/copied/inherited/proxy authorities without
invoking arbitrary require getters/methods. Compare exact target refs, context tags/
access and epoch before calling the registered internal implementation. Invalid
inputs never fall back to permissive legacy behavior. Origin lookup is provenance.

Capture one current own-data envelope; require matching refs, allowed expected and
actual context, tags and epoch before checking actual controller definition and
disposal through captured methods with their receiver. Wrong context must not call
later controller methods. Epoch accepts strings/finite numbers, strict equality;
NaN/infinity/other values deny. The application advances epoch for ABA/reset.

Capture consumed descriptor values/callbacks once or reject accessors. Ignore
unconsumed fields without invocation; preserve reader receivers. Thrown/malformed/
async values deny safely without error stringification or then/constructor/species
reads. No unsupported Promise containment claim, input mutation or global handlers.

Do not read query identity/evaluatedAt/rows or call getSnapshot, dispatch, accept,
subscribe, connect or dispose. Unrelated accepted query changes remain eligible;
editor rule/search/date baselines are separate. No accepted-state mirror, cache,
resource lifetime, native/UI/React runtime dependency or controller wrapper.

The host publishes coherent expected/actual metadata and immediate revocation before
subsequent actor work. Unpublished transitions are unknowable. Later tools must
require after reentrant callbacks and immediately before mutation; applications
retire revoked proposals. UI adoption, controls adapter and optional-key defaults
need another approved allocation after this exact producer handoff.

## Required checks and stop rules

Use actual accepted controllers: origin/current positive; foreign equal-valued refs;
identical-query A→B; expected/actual/access mismatch; ABA; disposal/definition change;
independent instances; unrelated query transitions; frozen new metadata but unfrozen
inputs; copied/proxy/inherited/revoked objects; target mismatch before reader;
accessor counters/poisoned thrown values; method receivers; capture-once; unsupported
async values without Promise hooks. Include inferred positive/negative own types
under strict TS6/5.9 and a DOM-free isolated import/runtime dependency guard.

Use installed pinned tooling and own private outputs only. Inspect that the plain
runtime imports no React/native/resource/UI/DOM/network/storage/telemetry. Fingerprint
new files and unchanged existing controller/details inputs. Stop before changing an
accepted producer. Source/unit/type/import success is not packed, request-local
SSR, React/tool integration, full facade or integrated AC-16/25 acceptance.

The initial producer receives bounded delegated source approval after independent
70-unit/strict compiler/import review. [Exact checks and limits](../../tests/criteria-authority/README.md)
record its implementation; root exports and all integration allocations stay separate.
