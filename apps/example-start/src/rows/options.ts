import { queryOptions } from "@tanstack/react-query";
import { AuthorizationLostError } from "./authorization";
import { rowsPrefix } from "./authorization-session";
import { identity } from "./schema";
import { loadRows } from "./transport";
import type { AuthorizationIdentity, ReadInput } from "./types";

export function rowsOptions(
  input: ReadInput,
  authorization: AuthorizationIdentity,
) {
  return queryOptions({
    queryKey: [
      ...rowsPrefix(authorization),
      identity(input.query, input.clock),
    ] as const,
    queryFn: async ({ signal }) => {
      const outcome = await loadRows(input, signal);
      if (outcome.kind === "access-lost") throw new AuthorizationLostError();
      return outcome.result;
    },
    staleTime: 30_000,
    retry: false,
  });
}
