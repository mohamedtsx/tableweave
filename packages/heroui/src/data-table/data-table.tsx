"use client";

import { type DataTableModel, getDataTableModelOwner } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import { englishDataTableNeutralMessages } from "../localization/data-table.js";
import type {
  DataTableNeutralMessages,
  DataTableProps,
} from "../table/types.js";
import { DataTableHost } from "./host.js";

function own(input: unknown, key: string, optional = false): unknown {
  if (!input || typeof input !== "object")
    throw new TypeError("Invalid table metadata.");
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) {
    if (optional && !Reflect.has(input, key)) return undefined;
    throw new TypeError("Invalid table metadata.");
  }
  if (!Object.hasOwn(descriptor, "value"))
    throw new TypeError("Invalid table metadata.");
  return descriptor.value;
}
export function captureTableNeutralMessages(
  input: unknown,
): Readonly<DataTableNeutralMessages> {
  const raw = own(input, "neutralMessages", true);
  if (raw === undefined) {
    if (
      input &&
      typeof input === "object" &&
      Object.hasOwn(input, "neutralMessages")
    )
      throw new TypeError("Invalid table neutral metadata.");
    return englishDataTableNeutralMessages;
  }
  const uncommitted = own(raw, "uncommitted"),
    unavailable = own(raw, "unavailable");
  if (
    typeof uncommitted !== "string" ||
    !uncommitted.trim() ||
    typeof unavailable !== "string" ||
    !unavailable.trim()
  )
    throw new TypeError("Invalid table neutral metadata.");
  return Object.freeze({ uncommitted, unavailable });
}
/** table is the sole inference anchor. No private config/locale/rows in root render. */
export function DataTable<S extends QuerySchema, T extends object>(
  props: DataTableProps<S, T>,
) {
  let table: DataTableModel<S, T>, neutral: Readonly<DataTableNeutralMessages>;
  try {
    table = own(props, "table") as DataTableModel<S, T>;
    if (!getDataTableModelOwner(table))
      return <p role="status">{englishDataTableNeutralMessages.unavailable}</p>;
    neutral = captureTableNeutralMessages(props);
  } catch {
    return <p role="status">{englishDataTableNeutralMessages.unavailable}</p>;
  }
  return <DataTableHost table={table} input={props} neutral={neutral} />;
}
