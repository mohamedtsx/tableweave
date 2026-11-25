# Move-menu reason visibility — provisional correction

Review22n7 / FR-02/03, AC-12/13/21. Baselineb3cc5a7 preserves the complete N1/C1b
producer. Its reason span was hidden while one direction remained available, despite
the disabled opposite menu item referencing it. Main removes only that hidden prop;
the existing boundary/pending/unavailable text is now visible in both axes.

`check-source.mjs` verifies the exact one-span delta against the preserved Git
revision and all154 other source hashes against the original155 map. It executes
no table/UI module. No original producer fixture, map, seal or assertion is modified.

LIGHT commands:

```sh
node tests/reordering/move-reason/check-source.mjs
node --check tests/reordering/move-reason/check-source.mjs
pnpm exec tsc -p tests/reordering/pretoken-renderer/tsconfig.light.json --pretty false
pnpm exec biome check --assist-enabled=false packages/heroui/src/table/reordering-controls.tsx tests/reordering/move-reason
```

Main's exact static154-source check, syntax and positive TS6 program pass. Full
scoped Biome passes after formatting only the changed span/new helper; the original
format/lint log is preserved at `/tmp/opencode/wp10-move-reason-biome.log`, with
fresh passing logs using `final`. No old producer seal is re-signed.
Browser/generated-ARIA/manual
AT verification remains deferred: test first/last and single-item row/column menus,
both directions enabled, pending/waiting, EN/AR and narrow/zoom text. Do not infer
accessibility acceptance from this source correction. No action, ref, backend or
drag behavior is added; drag remains user-blocked.
