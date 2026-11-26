import { createServerFn } from "@tanstack/react-start";
import {
  bootstrapReader,
  canaryReader,
  readRows,
  requestSignal,
  validateRead,
} from "./reader.server";

export const getBootstrap = createServerFn({ method: "GET" }).handler(() =>
  bootstrapReader(),
);
export const getCanary = createServerFn({ method: "GET" }).handler(() =>
  canaryReader(),
);
export const rowsRpc = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateRead(input))
  .handler(({ data }) => readRows(data, requestSignal()));
