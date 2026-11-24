# Bound details source export audit — main-owned provisional integration

TASK-017. D2 correctly flags existing type-star barrels: appending internal commit
types to details/types.ts would otherwise expose those names through both details/
index.ts and the HeroUI root. Main inspects both actual barrels and the original16
exported legacy types. No runtime producer/API is changed by this audit.

After D2's own source handoff is preserved and intaken, main owns only replacement
of those two type-stars with an explicit allowlist of the same16 legacy public types.
New DetailsCommit actor/lease/local/work/snapshot/cell internals remain private.
The intended accessory/option types/runtime functions are added only in a separate
explicit final source-export integration, not accidentally by a star. No manifest/
dependency/lock/version/publication/input seal rebaseline follows.

Preserve each barrel preimage/hash and record one integrated positive source TS6
check; ordinary emitted/root/packed consumer and independent export review remain
deferred. Existing raw names/props/type inference/client marker are unchanged.

Main preserves both preimages externally, replaces only the type-stars and compares
allowlists to original details declarations: exactly16 names at each barrel.
Integrated D2/S2 positive source-fixture TS6 passes. Post-intake/audit source133 is
cf4b36714107d270c0be26ed38a77cc87a456ae76ba8bba3b4a5d553f63d8ef7.
No ordinary root/emitted/packed/runtime or independent acceptance is claimed.
