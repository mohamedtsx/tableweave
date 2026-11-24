# @tableweave/heroui — private collection and tool candidates

The root exports WP-04's bounded `NativeCollection` and `NativeCollectionProps`.
It renders the current headless native view through real HeroUI/Aria grouped
collections, stable row/cell keys, row headers, page-only selection and explicit
sort priorities. The [candidate boundary](../../docs/engineering/wp-04-native.md)
and [collection fixture notes](../../tests/native/collection/README.md) distinguish
actual APIs and recorded delegated G-01 checks/limits. This is not the full `DataTable`,
resource notices, details shell or final visual system.

The root also exports private WP-07 `FilterBuilder`, `FilterSearch`, `FilterTabs`,
`FilterDate` and genuine own prop/message/option-port types. Independently corrected
source integration passes real emitted/actual-tarball interactions and unpatched
strict NodeNext TS6/5.9 consumers under delegated technical source approval.
See the [tool boundary](../../docs/engineering/wp-07-tools.md) and actual
[builder handoff](../../tests/filter-tools/builder/README.md). Final combined-stack
delivery, personal maintainer and later release gates remain separate.
`FilterBuilder` requires explicit client/server `evaluationMode`; it never owns
transport, accepted query state or backend authorization. Mutation observers report
submitted/proposed outcomes, not automatic application acceptance.

`/sortable` still exports no plugin; the default root never imports it.
`/styles.css` imports owned tool CSS in a reserved side-effectful layer. Applications supply
their actual HeroUI/Tailwind stylesheet setup. Raw vendor declaration limitations
and the strict build/public-type boundary are documented in the candidate contract.

Not published or ready for application use. No sortable dependency is needed for
the isolated entry; WP-10 will select and prove its actual adapter. MIT is
selected for owned source, but rightsholder/legal inputs remain pending; private
`UNLICENSED` metadata prevents accidental distribution, not a new license decision.

## Candidate filter-tool styles

WP-07's isolated source integration is reviewed; final stack delivery remains.
Applications own theme and CSS
setup; declare layer order **before** vendor imports so utility classes can still
override Tableweave defaults:

```css
@layer theme, base, components, tableweave, utilities;
@import "tailwindcss";
@import "@heroui/styles";
@import "@tableweave/heroui/styles.css";
```

The stable side-effectful root CSS imports reviewed owned component CSS in the
tableweave layer. Components do not import styles from JavaScript or copy assets.
No automatic global application/theme provider is installed.
