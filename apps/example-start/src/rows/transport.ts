import { createIsomorphicFn } from "@tanstack/react-start";
import { rowsRpc } from "./functions";
import { readRows } from "./reader.server";
import type { ReadInput, RowsOutcome } from "./types";

// AbortSignal stays local / in the RPC call options, never in serialized data.
export const loadRows = createIsomorphicFn()
  .server(
    (input: ReadInput, signal: AbortSignal): Promise<RowsOutcome> =>
      readRows(input, signal),
  )
  .client(
    (input: ReadInput, signal: AbortSignal): Promise<RowsOutcome> =>
      rowsRpc({ data: input, signal }),
  );
