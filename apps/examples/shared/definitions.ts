import { defineTable, type NativeColumnDef } from "@tableweave/react";
import type { Customer, InventoryItem, Transaction } from "./records.js";
import {
  customerSchema,
  exampleOperators,
  inventorySchema,
  minimalTransactionSchema,
  transactionSchema,
} from "./schemas.js";

export interface DefinitionOptions<T extends object> {
  readonly full?: boolean;
  readonly grouped?: boolean;
  readonly rows?: boolean;
  readonly utilities?: readonly NativeColumnDef<T>[];
}
const fullTools = {
  builder: "toolbar",
  search: "toolbar",
  columnChooser: "toolbar",
  tabs: "external",
  date: "external",
} as const;
export function minimalTransactionDefinition() {
  return defineTable<Transaction>()({
    schema: minimalTransactionSchema,
    getRowId: (record) => record.id,
    columns: [
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        enableHiding: false,
        meta: { rowHeader: true },
      },
      { id: "amount", accessorKey: "amount", header: "Amount" },
    ],
  });
}
function selection<T extends object>(full: boolean): NativeColumnDef<T>[] {
  return full
    ? [
        {
          id: "selection",
          header: "Selection",
          meta: { utility: true },
          cell: () => null,
        },
      ]
    : [];
}
export function transactionDefinition(
  options: DefinitionOptions<Transaction> = {},
) {
  const full = options.full ?? false;
  const values: NativeColumnDef<Transaction>[] = [
    {
      id: "amount",
      accessorKey: "amount",
      header: "Amount",
      cell: (context) =>
        new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
          context.row.original.amount,
        ),
    },
    { id: "reference", accessorKey: "reference", header: "Reference" },
    { id: "account", accessorKey: "account", header: "Account" },
    {
      id: "magnitude",
      header: "Magnitude",
      accessorFn: (record) => Math.abs(record.amount),
      cell: (context) => String(Math.abs(context.row.original.amount)),
    },
  ];
  return defineTable<Transaction>()({
    schema: transactionSchema,
    evaluation: { registry: exampleOperators },
    getRowId: (record) => record.id,
    selection: full ? "multiple" : false,
    details: full,
    isRowSelectable: (row) => row.id !== "tx-002",
    multiSort: full,
    ...(full ? { tools: fullTools } : {}),
    reordering: {
      rows: options.rows ?? false,
      columns: options.grouped ?? false,
    },
    defaultColumns: { visibility: { reference: false } },
    columns: [
      ...selection<Transaction>(full),
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        enableHiding: false,
        meta: { rowHeader: true },
      },
      { id: "status", accessorKey: "status", header: "Status" },
      { id: "occurred", accessorKey: "occurred", header: "Occurred" },
      ...(options.grouped
        ? [{ id: "values", header: "Values", columns: values }]
        : values),
      ...(options.utilities ?? []),
    ],
  });
}
export function customerDefinition(options: DefinitionOptions<Customer> = {}) {
  return defineTable<Customer>()({
    schema: customerSchema,
    getRowId: (record) => record.id,
    selection: "multiple",
    details: true,
    multiSort: true,
    tools: fullTools,
    columns: [
      ...selection<Customer>(true),
      {
        id: "name",
        accessorKey: "name",
        header: "Customer",
        enableHiding: false,
        meta: { rowHeader: true },
      },
      { id: "segment", accessorKey: "segment", header: "Segment" },
      { id: "balance", accessorKey: "balance", header: "Balance" },
      {
        id: "active",
        accessorKey: "active",
        header: "Active",
        cell: (context) => (context.row.original.active ? "Active" : "Paused"),
      },
      { id: "note", accessorKey: "note", header: "Note" },
      ...(options.utilities ?? []),
    ],
  });
}
export function inventoryDefinition(
  options: DefinitionOptions<InventoryItem> = {},
) {
  return defineTable<InventoryItem>()({
    schema: inventorySchema,
    getRowId: (record) => record.id,
    selection: "multiple",
    details: true,
    multiSort: true,
    tools: fullTools,
    columns: [
      ...selection<InventoryItem>(true),
      {
        id: "title",
        accessorKey: "title",
        header: "Record",
        enableHiding: false,
        meta: { rowHeader: true },
      },
      { id: "category", accessorKey: "category", header: "Category" },
      { id: "status", accessorKey: "status", header: "Status" },
      { id: "quantity", accessorKey: "quantity", header: "Quantity" },
      {
        id: "availableUnits",
        header: "Unreserved units",
        accessorFn: (record) => (record.reserved ? 0 : record.quantity),
      },
      { id: "updated", accessorKey: "updated", header: "Updated" },
      ...(options.utilities ?? []),
    ],
  });
}
