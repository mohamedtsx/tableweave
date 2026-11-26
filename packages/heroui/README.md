# @tableweave/heroui — private collection producer

The root exports WP-04's bounded `NativeCollection` and `NativeCollectionProps`.
It renders the current headless native view through real HeroUI/Aria grouped
collections, stable row/cell keys, row headers, page-only selection and explicit
sort priorities. The [candidate boundary](../../docs/engineering/wp-04-native.md)
and [collection fixture notes](../../tests/native/collection/README.md) distinguish
actual APIs and recorded delegated G-01 checks/limits. This is not the full `DataTable`,
filter tools, resource notices, details shell or final visual system.

`/sortable` still exports no plugin; the default root never imports it.
`/styles.css` declares a reserved side-effectful CSS layer. Applications supply
their actual HeroUI/Tailwind stylesheet setup. Raw vendor declaration limitations
and the strict build/public-type boundary are documented in the candidate contract.

Not published or ready for application use. No sortable dependency is needed for
the isolated entry; WP-10 will select and prove its actual adapter. MIT is
selected for owned source, but rightsholder/legal inputs remain pending; private
`UNLICENSED` metadata prevents accidental distribution, not a new license decision.
