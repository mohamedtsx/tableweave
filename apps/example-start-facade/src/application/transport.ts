import { createIsomorphicFn } from "@tanstack/react-start";
import { bootstrapRpc, canaryRpc, rowsRpc } from "./functions.js";
import {
  bootstrapReader,
  canaryReader,
  initialDatasetReader,
  rowsReader,
} from "./reader.server.js";
import type { Bootstrap, Dataset, ReadInput, ReaderPort } from "./types.js";
const bootstrap = createIsomorphicFn()
  .server(async (selected: Dataset, signal: AbortSignal) => {
    signal.throwIfAborted();
    return bootstrapReader(selected);
  })
  .client((selected: Dataset, signal: AbortSignal) =>
    bootstrapRpc({ data: selected, signal }),
  );
const rows = createIsomorphicFn()
  .server((input: ReadInput, signal: AbortSignal) => rowsReader(input, signal))
  .client((input: ReadInput, signal: AbortSignal) =>
    rowsRpc({ data: input, signal }),
  );
const canary = createIsomorphicFn()
  .server((input: Bootstrap, signal: AbortSignal) =>
    canaryReader(input, signal),
  )
  .client((input: Bootstrap, signal: AbortSignal) =>
    canaryRpc({ data: input, signal }),
  );
export const reader: ReaderPort = { bootstrap, canary, rows };
export const initialDataset = createIsomorphicFn()
  .server(initialDatasetReader)
  .client((): Dataset => "alpha");
