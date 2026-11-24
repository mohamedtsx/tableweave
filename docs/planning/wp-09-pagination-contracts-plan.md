# WP-09 pure pagination contract prerequisite

TASK-017 / D-10/D-24, FR-12/16, AC-24/25/26. Main approves this bounded prerequisite
before code under the delegated delivery grant. It is **not a usable unpaged table**.
No install, shared build/export, Git, merge, publication or facade adoption follows.

## Exclusive ownership and dependency

One worker owns only packages/react/src/contracts/{types,schema,query,identity}.ts
and new tests/pagination-policy/contracts/**. Every other source, existing test,
config/manifest/lock/index/export, docs/ledger/Git remains read-only/main-owned.
No vendor/.repo edits or extra agents. Main verifies these four inputs byte-identical
to accepted core and reviewed WP-08 source17b846b; the remote harness correction does
not touch them. This independent stage need not wait for remote delivery, but later
native/resource/facade integration still needs the exact delivered dependency.

Initial SHA256s:

- types.ts:2811e8bf0fc6351c74be93e8de06d75fd110bdedee11802aec0ff1eb9c608d39
- schema.ts:7232c51f90581d54d9e66096cc2bae79a1b673195f40f88eed6aff2aa2934e84
- query.ts:210a7711c607094ae079506a4b0e77bdce05f5a105d5cdd6a87fac1825ad36d0
- identity.ts:76530b9aab896afadca85b310854457f6c7d7dcd959bfbbbdf3cbc121328b3c8

## Exact implementation contract

- Definition pagination gains readonly enabled?:boolean; normalized pagination has
  enabled?:false. Omission/true normalize to the old physical shape with no member;
  only false survives. Preserve deep clone/freeze, strict JSON/unknown/accessor/
  prototype rejection and all original numeric/default/sizes/maxPageRows rules.
- Keep WireQuery v1/required page pair. Disabled permits only pageIndex0/configured
  defaultSize; createQuery supplies it when absent. Other valid-shaped pairs fail
  query.invalid; malformed/bounds failures retain their original diagnostics.
  No huge-size/hidden-footer workaround or silent repair.
- Check original pair policy before custom rule normalizer/validator callbacks.
  Simultaneous changed filter/sort cannot conceal forbidden page intent. Keep every
  other query/field/operator/date/ownership normalization unchanged.
- Paged/omitted/true schema/controller/query identity bytes stay compatible. Filter
  identity gains no policy. Only disabled query identity adds paginationEnabled:false
  alongside existing actual schema/version/dormant metadata. No wire bump/timestamp.
- Existing same-ID/version definition replacement must reject changed policy;
  omitted<->true remains equal. Test real controller APIs without editing them.

No native/resource/presentation/controller/filter-helper/execution descriptor or
tool edits. Current native still slices. Later integration must deny disabled
commands/no-ops before functional pagination updaters/private validators; this
partial stage proves no such command behavior or complete-server provenance.

## Proof and stop rules

Before edits, capture representative real old paged schema/controller fingerprints,
default/custom-size wire queries and filter/query identities. Freeze expected bytes;
never rebase from corrected code. Prove omission/true match all those bytes, false
is frozen/distinct in query identity only, and actual definition replacement guards.

Cover allowed/alternate/unsafe/negative/bounds/default pairs, false/true/invalid
boolean/null/undefined/getter/prototype/unknown keys, changed filter/sort payloads,
input nonmutation and zero custom callbacks for denied page intent. Use real schema/
registry/query factories. Run affected existing pure tests plus own focused tests
with pinned tools/isolated caches. Strict TS6/5.9 source/own-emitted fixtures must
preserve inference and meaningful negative errors; private server-safe graph adds
no React/UI/native/resource import. Fingerprint four outputs and protected existing
controller/native/resource/details/criteria sources. Own README records exact proof
and partial limits. No root/tarball/browser/SSR/full support is inferred.

Stop before excluded edits or an unapproved clock/extent/error choice. Custom
captured-evaluation parity stays unchanged; no temporal refresh migration or waiver.
Independent review precedes main-owned discovery/exports/consumer integration.

## Scoped source disposition

The [source handoff and commands](../../tests/pagination-policy/contracts/README.md)
own executable scoped proof and its explicit limits.

Independent56 fresh probes plus267 candidate/existing cases, strict TS6/5.9 and
64 meaningful line/compiler/mode rejections pass. All16 literal golden strings
independently replay from hash-verified original preimages; graph/bare-import and
279-entry/163-protected seals match. Main grants bounded delegated source approval
at36676cb883cda5276a2a63194988bacd89d38981ff49e16b8690daf8d1111086.
This does not allocate the excluded owners or establish actual unpaged runtime.
