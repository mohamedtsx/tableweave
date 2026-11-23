# Architecture and package boundaries

Source: HLD §§1–2; ADR-01/ADR-10. Product invariants are owned by
[shared rules](../../product/shared-rules.md), not duplicated here.

For architecture learning and maintainer preferences, follow the
[three reference sources](../reference/README.md#maintainer-taste-and-architecture-sources),
with `.repo/` as the main taste and architecture reference. Study relevant local
patterns alongside these Tableweave boundaries; adapt their rationale, not their
application topology, business rules, runtime code or lockfile. Reference patterns
are not integration proof; proposed departures from approved contracts need review.

```text
Consumer application
  ├─ serializable schema + typed rendering definition
  ├─ accepted state/query + resource/status + application actions
  └─ optional Query/router/backend integration
           ↓
@tableweave/react → TanStack Table v9 row processing
           ├─ consumer headless renderer
           └─ @tableweave/heroui → HeroUI / React Aria
                        └─ optional explicit sortable plugin
```

## Planned exports and import direction

| Entry | Owns | Must not import/require |
| --- | --- | --- |
| `@tableweave/react` | Definition compiler, coordinator/hooks, query transitions, registry, resource presentation, TanStack bridge, headless helpers | HeroUI/CSS, Query, app router/ORM/auth |
| `@tableweave/react/contracts` | Versioned wire types, runtime validation/normalization and serialization; browser-independent/server-safe | React runtime, DOM globals, HeroUI, app secrets |
| `@tableweave/react/filters` | Built-in descriptors, presets, extensions and shared local/translator semantics | UI components or network clients |
| `@tableweave/heroui` | Default table, toolbar/builder, selection, pagination, states, details, slots/styles | App fetching, routing, databases/business actions |
| `@tableweave/heroui/sortable` | Explicit optional sortable plugin/drag UI | App persistence/backend clients |
| Examples/Storybook | Synthetic review fixtures; Start + Query, Vite and Next integration | Private Gamila code/data or business rules in library packages |

Two planned npm packages; subpaths isolate responsibilities without creating a
separately released package per feature. Schema validation remains usable by an
application server without importing React. Local filtering uses the TanStack
pipeline, not a competing table engine. Query stays in examples/applications.

## Proposed repository shape

This is the **target shape**, not a list of implemented features. WP-01 mounts
the two package entry/build skeletons, minimal Storybook and foundation test/
consumer harnesses; most feature folders and example apps remain future outputs.
Current docs live alongside them and remain the contract owners.

```text
packages/
  react/src/{contracts,definition,controller,filters,tanstack,resource,hooks}/
  heroui/src/{table,toolbar,filters,selection,pagination,details,states,sortable,styles}/
apps/{docs,storybook,example-start,example-vite,example-next}/
tests/{contracts,interaction,consumers,accessibility,benchmarks}/
changesets/
```

Use pnpm workspaces, ESM, explicit export maps and emitted declarations. Build
server-safe contracts separately from client entries. Preserve Next.js client
boundary directives. Mark actual style files as side effects, not all CSS as
side-effect free. Externalize peers and inspect **packed tarballs**, not only
workspace aliases. Confirm headless and default renderer imports exclude HeroUI
or optional sortable as appropriate; a boolean flag alone is not tree shaking.

The current WP-01 build uses unbundled TypeScript ESM/declaration emission to
preserve directives/import boundaries, with an explicit CSS copy. Verified commands
are in the root [README](../../README.md#local-foundation-workflow). No
database/auth/worker/service stack is required for this library. Do not copy
Gamila's app topology, patches, install hooks or lockfile.
