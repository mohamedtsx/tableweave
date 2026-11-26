import { Table } from "@heroui/react/table";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  CollectionColumn,
  CollectionLeaf,
} from "../../../packages/heroui/src/table/collection-projection.js";
import type {
  CollectionRow,
  CollectionSort,
} from "../../../packages/heroui/src/table/controlled-collection.js";
import { ControlledCollection } from "../../../packages/heroui/src/table/controlled-collection.js";
import { GroupColumn } from "../../../packages/heroui/src/table/group-column.js";
import { NativeFixture } from "./native-fixture.js";

const leaf = (
  id: string,
  textValue: string,
  extra: Partial<CollectionLeaf> = {},
): CollectionLeaf => ({
  kind: "leaf",
  id,
  label: textValue,
  textValue,
  ...extra,
});
const rows: readonly CollectionRow[] = [
  {
    id: "inv-a",
    textValue: "Alpha",
    cells: {
      name: { content: "Alpha", textValue: "Alpha" },
      sku: { content: "A-01", textValue: "A-01" },
      quantity: { content: 2, textValue: "2" },
      location: { content: "West", textValue: "West" },
    },
  },
  {
    id: "inv-b",
    textValue: "Beta",
    cells: {
      name: { content: "Beta", textValue: "Beta" },
      sku: { content: "B-02", textValue: "B-02" },
      quantity: { content: 1, textValue: "1" },
      location: { content: "East", textValue: "East" },
    },
  },
  {
    id: "inv-d",
    textValue: "Delta",
    cells: {
      name: { content: "Delta", textValue: "Delta" },
      sku: { content: "D-04", textValue: "D-04" },
      quantity: { content: 1, textValue: "1" },
      location: { content: "East", textValue: "East" },
    },
  },
  {
    id: "inv-c",
    textValue: "Gamma",
    cells: {
      name: { content: "Gamma", textValue: "Gamma" },
      sku: { content: "C-03", textValue: "C-03" },
      quantity: { content: 2, textValue: "2" },
      location: { content: "North", textValue: "North" },
    },
  },
];

// This owner supplies presentation props only. Native row processing/controller
// integration is intentionally separate; this static fixture cannot prove it.
function Fixture() {
  const [uneven, setUneven] = useState(false);
  const [hideSku, setHideSku] = useState(false);
  const [hideStock, setHideStock] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(["off-page"]),
  );
  const [sorting, setSorting] = useState<readonly CollectionSort[]>([]);
  const [revision, setRevision] = useState(0);
  const [reject, setReject] = useState(false);
  const quantity = leaf("quantity", "Quantity", {
    allowsSorting: true,
    isVisible: !hideStock,
  });
  const columns: readonly CollectionColumn[] = [
    leaf("selection", "Selection", { isSelection: true }),
    {
      kind: "group",
      id: "identity",
      label: "Identity",
      textValue: "Identity",
      children: [
        leaf("name", "Name", { isRowHeader: true, allowsSorting: true }),
        leaf("sku", "SKU", { isVisible: !hideSku }),
      ],
    },
    {
      kind: "group",
      id: "stock",
      label: "Stock",
      textValue: "Stock",
      children: [
        uneven
          ? {
              kind: "group",
              id: "metrics",
              label: "Metrics",
              textValue: "Metrics",
              children: [quantity],
            }
          : quantity,
        leaf("location", "Location", { isVisible: !hideStock }),
      ],
    },
    leaf("predicate-carrier", "INTERNAL PREDICATE", { isInternal: true }),
  ];
  const currentRows = page === 0 ? rows.slice(0, 3) : rows.slice(3);
  const changedRows = currentRows.map((row) =>
    revision && row.id === "inv-a"
      ? {
          ...row,
          textValue: "Alpha revised",
          cells: {
            ...row.cells,
            name: { content: "Alpha revised", textValue: "Alpha revised" },
          },
        }
      : row,
  );
  return (
    <main>
      <h1>Grouped collection proof</h1>
      <p>
        Static controlled presentation owner; native processing is not claimed.
      </p>
      <nav aria-label="Fixture controls">
        <button type="button" onClick={() => setUneven(!uneven)}>
          Toggle uneven depth
        </button>
        <button type="button" onClick={() => setHideSku(!hideSku)}>
          Toggle SKU
        </button>
        <button type="button" onClick={() => setHideStock(!hideStock)}>
          Toggle stock group
        </button>
        <button type="button" onClick={() => setPage(1 - page)}>
          Change page
        </button>
        <button type="button" onClick={() => setSelectedIds(new Set())}>
          Clear row selection
        </button>
        <button type="button" onClick={() => setRevision(revision + 1)}>
          Revise Alpha
        </button>
        <button
          type="button"
          onClick={() => setReject(!reject)}
          aria-pressed={reject}
        >
          Reject proposals
        </button>
      </nav>
      <ControlledCollection
        label="Grouped inventory"
        columns={columns}
        rows={changedRows}
        selectedIds={selectedIds}
        eligiblePageIds={changedRows
          .filter((row) => row.id !== "inv-b")
          .map((row) => row.id)}
        onSelectedIdsChange={(ids) => {
          if (!reject) setSelectedIds(ids);
        }}
        sorting={sorting}
        onSort={(id, additive) => {
          if (reject) return;
          const old = sorting.find((sort) => sort.id === id);
          const next = old?.desc ? undefined : { id, desc: old !== undefined };
          setSorting(
            additive
              ? [
                  ...sorting.filter((sort) => sort.id !== id),
                  ...(next ? [next] : []),
                ]
              : next
                ? [next]
                : [],
          );
        }}
      />
      <output aria-label="Accepted selected IDs">
        {[...selectedIds].sort().join(",")}
      </output>
    </main>
  );
}

/** Deliberately unbalanced raw public branch reproducer, without adapter padding. */
function RawUneven() {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Raw uneven inventory">
          <Table.Header>
            <Table.Column id="selection">Standalone</Table.Column>
            <GroupColumn id="identity" label="Identity" textValue="Identity">
              <Table.Column id="name" isRowHeader>
                Name
              </Table.Column>
            </GroupColumn>
          </Table.Header>
          <Table.Body>
            <Table.Row id="raw" textValue="Alpha">
              <Table.Cell>utility</Table.Cell>
              <Table.Cell>Alpha</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  location.search.includes("raw-uneven") ? (
    <RawUneven />
  ) : location.search.includes("native") ? (
    <NativeFixture />
  ) : (
    <Fixture />
  ),
);
