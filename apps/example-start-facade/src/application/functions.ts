import { createServerFn } from "@tanstack/react-start";
import { bootstrap, dataset, readInput } from "./codec.js";
import {
  bootstrapReader,
  canaryReader,
  requestSignal,
  rowsReader,
} from "./reader.server.js";
export const bootstrapRpc = createServerFn({ method: "POST" })
  .validator(dataset)
  .handler(({ data }) => bootstrapReader(data));
export const rowsRpc = createServerFn({ method: "POST" })
  .validator(readInput)
  .handler(({ data }) => rowsReader(data, requestSignal()));
export const canaryRpc = createServerFn({ method: "POST" })
  .validator(bootstrap)
  .handler(({ data }) => canaryReader(data, requestSignal()));
