import { queryOptions } from "@tanstack/react-query";
import { inputIdentity, rowsOutcome, sameInput } from "./codec.js";
import {
  SourceEnded,
  SourceUnavailable,
  type Bootstrap,
  type ReadInput,
  type ReaderPort,
} from "./types.js";
export const cachePrefix = (id: string) => ["wp11-start-facade", id] as const;
export const rowsKey = (input: ReadInput) =>
  [
    ...cachePrefix(input.bootstrapId),
    input.domain,
    input.scopeKey,
    input.clock,
    inputIdentity(input),
  ] as const;
export function rowsOptions(
  input: ReadInput,
  reader: ReaderPort,
  current: () => boolean,
) {
  return queryOptions({
    queryKey: rowsKey(input),
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      if (!current()) throw new SourceEnded();
      const result = rowsOutcome(await reader.rows(input, signal));
      signal.throwIfAborted();
      if (!current()) throw new SourceEnded();
      if (!sameInput(input, result.input)) throw new SourceUnavailable();
      return result;
    },
  });
}
export const initialInputs = (value: Bootstrap) =>
  [value.transactions, value.inventory] as const;
