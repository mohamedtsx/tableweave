import { queryOptions } from "@tanstack/react-query";
import type { ResourceRequest, ResourceSuccess } from "@tableweave/react";
import { getQueryIdentity, type QueryFor } from "@tableweave/react/contracts";
import type { Transaction } from "../../../../examples/shared/records.js";
import {
  exampleOperators,
  transactionSchema,
  type TransactionSchema,
} from "../../../../examples/shared/schemas.js";

export interface RecipeReadInput {
  readonly definitionKey: string;
  readonly scopeKey: string;
  readonly query: QueryFor<TransactionSchema>;
  readonly evaluatedAt: number;
}
export type RecipeReader = (
  input: RecipeReadInput,
  signal: AbortSignal,
) => Promise<ResourceSuccess<Transaction>>;
/** Request/router-local namespace, supplied by the app, never a module cache. */
export function recipePrefix(namespace: string) {
  return ["wp11-recipe", namespace] as const;
}
export function recipeQueryOptions(
  namespace: string,
  input: RecipeReadInput,
  read: RecipeReader,
) {
  // Stable normalized wire+clock identity; no mutable controller/model in keys.
  const identity = getQueryIdentity(transactionSchema, input.query, {
    now: input.evaluatedAt,
    registry: exampleOperators,
  });
  return queryOptions({
    queryKey: [
      ...recipePrefix(namespace),
      input.definitionKey,
      input.scopeKey,
      identity,
      input.evaluatedAt,
    ] as const,
    queryFn: ({ signal }) => read(input, signal),
    staleTime: 30_000,
    retry: false,
  });
}
export function recipeRequestInput(
  request: ResourceRequest<QueryFor<TransactionSchema>>,
): RecipeReadInput {
  if (request.evaluatedAt === undefined)
    throw new Error("Recipe request lacks a captured evaluation clock");
  return {
    definitionKey: request.definitionKey,
    scopeKey: request.scopeKey,
    query: request.query,
    evaluatedAt: request.evaluatedAt,
  };
}
