# WP-09 aggregate English/Arabic messages — provisional isolated lease

TASK-017 / FR-16, localization/RTL quality. Main permits independent module-only
locale authoring against stable existing message ports while U4 changes headless
sources and another worker changes pager guards. Final verification is deferred.

## Exclusive scope

In the isolated bootstrap-proof worktree atf05bdb6, own only new
packages/heroui/src/localization/** and new tests/localization/**. Existing bootstrap
proof and all existing runtime/exports/config/manifests/lock/styles/docs/Git freeze.
No dependencies, root build, remote work, agents, browser suite or global direction/
locale mutation. Main owns intake/public exports and later facade integration.

## Exact module contract

Provide a readonly TableweaveLocale with locale:string, direction:ltr|rtl and complete
messages for the existing builder, search, tabs, date tool, date editor, collection,
sorting, column chooser, selection toolbar, pagination and details message ports.
Use their actual imported types, not guessed copied interfaces. Module-only exports:
englishTableweaveLocale and arabicTableweaveLocale, plus aggregate type(s).
Names become public only through later explicit main-owned export integration.

Use en-US/ltr and ar/rtl metadata. English preserves existing component defaults'
meaning/callback behavior; Arabic supplies every label/status/aria string and built-in
operator label represented by those ports. Never translate stable field/operator IDs,
application labels, record values or raw error payloads. Custom labels remain app-owned.
Message functions receive exactly their port's existing arguments (often already
formatted numbers); do not infer numeric plural categories from localized strings.

Constants/nested dictionaries are library-owned immutable data. Prefer no runtime
React/HeroUI/component imports just to collect message data; type imports are fine.
No eager formatter/editor callbacks, hidden source/Intl provider, app config mutation
or source/controller state. Direction metadata is not a document.dir side effect.
Do not invent future DataTable state-message ports; extend them after actual facade
types exist. Existing per-component defaults remain untouched and compatible.

### Resolved operator-label placement

The worker correctly finds no operator-label member in FilterBuilderMessages.
Main selects a separate readonly **builtinOperatorLabels** property on the locale
bundle, outside messages.builder, typed from the existing optional
FilterFieldPresentation.operatorLabels data port. Supply all36 existing private
built-in English-label entries and Arabic translations without changing stable IDs.
Later facade wiring passes this map through each field's existing operatorLabels
fallback, with explicit application field overrides winning. No automatic field
mutation/helper or existing component/port change is authorized in this lease.
Custom operator labels remain application-owned. This resolves the module-shape
gap without inventing messages.builder.operatorLabels or weakening a typed port.

## Provisional preserved handoff

Isolated commitb286884 contains only the four new localization modules and eight
own test/handoff files. Main inspects actual types/dictionaries/imports and runs
git diff --cached --check, without executing deferred tests. Worker records one
successful lightweight TS6 check, a static seven-data-module graph and752 unchanged
protected inputs. Five units/ten type negatives remain authored, not verified.
Later main intake links tests/localization/README.md and owns public facade wiring.

## Authored proof and light checks

Author complete-key/type checks, representative function outputs, built-in operator
coverage, immutability, English-default parity and Arabic rendering-text expectations.
Use synthetic labels only. One lightweight TS6 source/noEmit compile and static/scope
checks now; dual compiler/negative/unit/browser/RTL/Storybook verification belongs to
the final phase. No manual native-language, device, WCAG or full localization acceptance
is claimed from authored dictionaries. Record exact files/API/hashes/actual/deferred
checks in own README; stop before editing an existing port/default or adding an API.
