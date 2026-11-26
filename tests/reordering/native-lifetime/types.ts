import type {
  DataTableModel,
  NativeCell,
  NativeColumn,
  NativeHeader,
  NativeRow,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { RefCallback } from "react";
import {
  issueNativeScope,
  issueNativeRow,
  issueNativeLeaf,
  issueNativeRowHandle,
  issueNativeLeafHandle,
  nativeScopeRef,
  nativeRowRef,
  nativeLeafRef,
  nativeHandleRef,
  sealNativeRefs,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import type { TableRendererTarget } from "../../../packages/heroui/src/table/types.js";

export function positive<S extends QuerySchema, T extends object>(
  model: DataTableModel<S, T>,
  target: TableRendererTarget<S, T>,
  row: NativeRow<T>,
  column: NativeColumn<T>,
  header: NativeHeader<T>,
  cell: NativeCell<T>,
) {
  const scope = issueNativeScope(target, column);
  const rowTicket = issueNativeRow(target, row);
  const leaf = issueNativeLeaf(target, header);
  const rowHandle = issueNativeRowHandle(target, rowTicket, cell);
  const leafHandle = issueNativeLeafHandle(target, leaf);
  const tableRef: RefCallback<HTMLTableElement | HTMLDivElement> =
    nativeScopeRef(scope);
  const trRef: RefCallback<HTMLTableRowElement | HTMLDivElement> =
    nativeRowRef(rowTicket);
  const thRef: RefCallback<HTMLTableCellElement | HTMLDivElement> =
    nativeLeafRef(leaf);
  const buttonRef: RefCallback<HTMLButtonElement> = nativeHandleRef(rowHandle);
  return {
    model,
    tableRef,
    trRef,
    thRef,
    buttonRef,
    leafHandle,
    status: sealNativeRefs(target),
  };
}
