# @tableweave/heroui — private foundation

WP-01 ESM/declaration scaffold only. The root and `/sortable` entries export no
components or plugin. The default root does not import sortable. `/styles.css`
declares a reserved CSS layer and is marked side-effectful; it contains no table
design. Applications own their Tailwind/HeroUI stylesheet setup.

Not published or ready for application use. No sortable dependency is needed for
the empty isolated entry; WP-10 will select and prove its actual adapter. MIT is
selected for owned source, but rightsholder/legal inputs remain pending; private
`UNLICENSED` metadata prevents accidental distribution, not a new license decision.
