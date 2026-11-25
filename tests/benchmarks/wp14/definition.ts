import { defineTable, type NativeColumnDef } from "@tableweave/react";
import {
  CLIENT_KEYS,
  SERVER_KEYS,
  cellText,
  type BenchClient,
  type BenchServer,
} from "./fixture.js";
import { clientSchema, serverSchema } from "./schema.js";
const clientColumns: readonly NativeColumnDef<BenchClient>[] = CLIENT_KEYS.map(
  (key) => ({
    id: key,
    header: key,
    accessorFn: (value) => value[key],
    cell: (context) => cellText(context.getValue()),
    meta: { rowHeader: key === "recordLabel" },
    enableHiding: key !== "recordLabel",
  }),
);
const serverColumns: readonly NativeColumnDef<BenchServer>[] = SERVER_KEYS.map(
  (key) => ({
    id: key,
    header: key,
    accessorFn: (value) => value[key],
    cell: (context) => cellText(context.getValue()),
    meta: { rowHeader: key === "recordLabel" },
    enableHiding: key !== "recordLabel",
  }),
);
export function clientDefinition() {
  return defineTable<BenchClient>()({
    schema: clientSchema,
    columns: clientColumns,
    getRowId: (value) => value.id,
    multiSort: true,
    selection: "multiple",
    details: true,
    tools: { builder: "hidden", search: "toolbar", columnChooser: "hidden" },
  });
}
export function serverDefinition() {
  return defineTable<BenchServer>()({
    schema: serverSchema,
    columns: serverColumns,
    getRowId: (value) => value.id,
    multiSort: true,
    selection: "multiple",
    details: true,
    tools: { builder: "hidden", search: "toolbar", columnChooser: "hidden" },
  });
}
